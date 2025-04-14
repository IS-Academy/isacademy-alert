// ✅👇 webhookHandler.js

const moment = require("moment-timezone");
const config = require("./config");
const langManager = require("./langConfigManager");
const dummyHandler = require("./dummyHandler");
const handleTableWebhook = require("./handlers/tableHandler");
const { getTimeString, saveBotState } = require("./utils");

// ✅ entryManager에서 getEntryInfo도 import
const { addEntry, clearEntries, getEntryInfo } = require('./entryManager');

const { getTemplate } = require("./MessageTemplates");
const { sendToChoi, sendToMing, sendToAdmin } = require("./botManager");
const { sendBotStatus, handleAdminAction } = require("./commands/status");
const { exec } = require('child_process');

// ✅ entry 캐시 저장소 (선택)유지하되 주석 처리 가능
//const entryCache = {};

//function saveEntryData(symbol, type, avg, ratio) {
//  global.entryCache = global.entryCache || {};
//  const key = `${symbol}-${type}`;
//  global.entryCache[key] = { avg, ratio, ts: Date.now() };
//}

//function getEntryData(symbol, type) {
//  global.entryCache = global.entryCache || {};
//  const key = `${symbol}-${type}`;
//  return global.entryCache[key] || { avg: 'N/A', ratio: 0 };
//}

function getUserLang(chatId) {
  return langManager.getUserConfig(chatId)?.lang || 'ko';
}

module.exports = async function webhookHandler(req, res) {
  const update = req.body;

  if (req.originalUrl === "/dummy") {
    await dummyHandler(req, res);
    return;
  }

  if (["long_table", "short_table"].includes(update.type)) {
    await handleTableWebhook(update);
    return res.status(200).send("✅ 테이블 전송됨");
  }

  if (update.symbol || update.type) {
    try {
      const ts = Number(update.ts) || Math.floor(Date.now() / 1000);
      const symbol = update.symbol || "Unknown";
      const timeframe = update.timeframe?.replace(/<[^>]*>/g, '') || "⏳";
      const type = update.type;
      const price = parseFloat(update.price) || "N/A";

      // ✅ entryAvg/entryRatio 받아와서 캐시에 저장 (`25.04.14 미사용)
//      const entryAvg = update.entryAvg || 'N/A';
//      const entryRatio = update.entryRatio || 0;
      
      // ✅ direction 결정 후 진입/청산 구분
      const isEntrySignal = ["showSup", "isBigSup", "showRes", "isBigRes"].includes(type);
      const isExitSignal = ["exitLong", "exitShort"].includes(type);

      // ✅ 진입 신호일 경우 → 진입가 저장
      if (isEntrySignal) addEntry(symbol, type, price, timeframe);

      // ✅ 평균 및 비중 계산 (🔥 핵심)
      const { entryAvg: avg, entryCount: ratio } = getEntryInfo(symbol, type, timeframe);      

      // ✅ 청산 신호일 경우 → 리스트 초기화
      if (isExitSignal) clearEntries(symbol, type, timeframe);   
      
      // ✅ 로그 찍기
      console.log('📦 메시지 입력값:', { type, symbol, timeframe, price, avg, ratio, ts });
      
      // ✅ 다국어 설정
      const langChoi = getUserLang(config.TELEGRAM_CHAT_ID);
      const langMing = getUserLang(config.TELEGRAM_CHAT_ID_A);

      // ✅ 메시지 템플릿 생성
      const msgChoi = getTemplate({ type, symbol, timeframe, price, ts, entryCount: typeof ratio === 'number' ? ratio : 0, entryAvg: typeof avg === 'string' ? avg : 'N/A', leverage: typeof leverage === 'number' ? leverage : config.DEFAULT_LEVERAGE, lang: langChoi });
      const msgMing = getTemplate({ type, symbol, timeframe, price, ts, entryCount: typeof ratio === 'number' ? ratio : 0, entryAvg: typeof avg === 'string' ? avg : 'N/A', leverage: typeof leverage === 'number' ? leverage : config.DEFAULT_LEVERAGE, lang: langMing });

      
      // ✅ 텔레그램 전송
      if (global.choiEnabled && msgChoi.trim()) await sendToChoi(msgChoi);
      if (global.mingEnabled && msgMing.trim()) await sendToMing(msgMing);

      // 📸 이미지 캡처 실행 추가 (여기 추가된 코드)
      if (["exitLong", "exitShort"].includes(type)) {
        const intervalNum = timeframe.replace(/[^0-9]/g, '') || "1";
        const captureCommand = `node captureAndSend.js --interval=${intervalNum} --type=${type}`;
        exec(captureCommand, (error, stdout, stderr) => {
          if (error) console.error(`❌ 캡처 실패: ${error.message}`);
          else if (stderr) console.error(`⚠️ 캡처 경고: ${stderr}`);
          else if (stdout.trim()) console.log(`✅ 캡처 성공:\n${stdout.trim()}`);
        });
      }

      return res.status(200).send("✅ 텔레그램 및 캡처 전송 성공");
    } catch (err) {
      console.error("❌ 텔레그램 및 캡처 처리 오류:", err.stack || err.message);
      return res.status(500).send("서버 오류");
    }
  }

  // ✅ 버튼 눌렀을 때 처리
  if (update.callback_query) {
    const cmd = update.callback_query.data;
    const chatId = update.callback_query?.message?.chat?.id;
    const messageId = update.callback_query?.message?.message_id;

    const ctx = {
      chat: { id: chatId },
      callbackQuery: update.callback_query
    };

    await handleAdminAction(update.callback_query.data, ctx); // ✅ 여기 핵심 추가
    res.sendStatus(200);

    if (!chatId) {
      console.error('❗ chatId 없음: callback_query.message.chat.id 확인 필요');
      return;
    }

    const lang = getUserLang(chatId);
    const timeStr = getTimeString();

    if (["choi_on", "choi_off", "ming_on", "ming_off"].includes(cmd)) {
      global.choiEnabled = cmd === "choi_on" ? true : cmd === "choi_off" ? false : global.choiEnabled;
      global.mingEnabled = cmd === "ming_on" ? true : cmd === "ming_off" ? false : global.mingEnabled;
      saveBotState({ choiEnabled: global.choiEnabled, mingEnabled: global.mingEnabled });
    } else if (cmd.startsWith("lang_choi_") || cmd.startsWith("lang_ming_")) {
      const [_, bot, langCode] = cmd.split("_");
      const targetId = bot === "choi" ? config.TELEGRAM_CHAT_ID : config.TELEGRAM_CHAT_ID_A;
      langManager.setUserLang(targetId, langCode);
    }

    await sendBotStatus(timeStr, cmd, chatId, messageId);
    return;
  }

  if (update.message && update.message.text) {
    const chatId = update.message.chat.id;
    const messageText = update.message.text.trim();
    const timeStr = getTimeString();
    const lower = messageText.toLowerCase();

    res.sendStatus(200);

    if (["/start", "/status", "/dummy_status", "/setlang", "/settz", "/help", "/settings", "/commands", "/refresh"].includes(lower)) {
      await sendBotStatus(timeStr, '', chatId);
    } else {
      await sendToAdmin(`📨 사용자 메시지 수신\n\n<code>${messageText}</code>`, null);
    }
    return;
  }

  res.sendStatus(200);
};
