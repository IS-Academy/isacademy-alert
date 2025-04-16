// ✅👇 webhookHandler.js

const moment = require("moment-timezone");
const config = require("./config");
const langManager = require("./langConfigManager");
const dummyHandler = require("./dummyHandler");
const handleTableWebhook = require("./handlers/tableHandler");
const { getTimeString, saveBotState, setAdminMessageId } = require("./utils");
const { addEntry, clearEntries, getEntryInfo } = require('./entryManager');
const { getTemplate } = require("./MessageTemplates");
const { editMessage, sendToChoi, sendToMing, sendToAdmin, getSymbolToggleKeyboard } = require("./botManager");
const { sendBotStatus, handleAdminAction } = require("./commands/status");
const { exec } = require('child_process');
const { handleTradeSignal } = require('./trader-gate/tradeSignalHandler'); // ✅ 자동매매 핸들러
const tradeSymbols = require('./trader-gate/symbols'); // ✅ 종목 상태 로드
const fs = require('fs');
const path = require('path');
const processedCallbackQueries = new Set();

// ✅ 전역 캐시 & 스위치 선언
const entryCache = {};
global.autoTradeEnabled = true; // 🪄 기본값: 자동매매 ON

function saveEntryData(symbol, type, avg, ratio) {
  global.entryCache = global.entryCache || {};
  const key = `${symbol}-${type}`;
  global.entryCache[key] = { avg, ratio, ts: Date.now() };
}

function getEntryData(symbol, type) {
  global.entryCache = global.entryCache || {};
  const key = `${symbol}-${type}`;
  return global.entryCache[key] || { avg: 'N/A', ratio: 0 };
}

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
      const symbol = update.symbol?.toLowerCase() || "unknown"; // 처리용 (자동매매, 비교) // toLowerCase = 소문자
      const displaySymbol = update.symbol?.toUpperCase() || "UNKNOWN"; // 표시용 (텔레그램 등) // toUpperCase = 대문자
      const timeframe = update.timeframe?.replace(/<[^>]*>/g, '') || "⏳";
      const type = update.type;
      const price = parseFloat(update.price) || "N/A";
      const leverage = update.leverage || config.DEFAULT_LEVERAGE;

      // ✅ 종목 사용 가능 여부 확인
      if (!tradeSymbols[symbol]?.enabled && !update.isTest) {
        console.warn(`⛔ [자동매매 비활성화된 종목] ${displaySymbol} → 무시됨`);
        return res.status(200).send('⛔ 해당 종목은 자동매매 꺼져있음');
      }

      // ✅ entryAvg/entryRatio 받아와서 캐시에 저장 (`25.04.14 미사용)
//      const entryAvg = update.entryAvg || 'N/A';
//      const entryRatio = update.entryRatio || 0;

      // ✅ 방향 판단 추가
      const isShort = type.endsWith('Short');
      const direction = isShort ? 'short' : 'long';
      
      // ✅ direction 결정 후 진입/청산 구분
      const isEntrySignal = ["showSup", "isBigSup", "showRes", "isBigRes"].includes(type);
      const isExitSignal = ["exitLong", "exitShort"].includes(type);

      // ✅ 진입 신호일 경우 → 진입가 저장
      if (isEntrySignal) {
        addEntry(symbol, type, price, timeframe);

        // ✅ 자동매매 실행 (스위치 기반)
        if (global.autoTradeEnabled) {
          await handleTradeSignal({
            side: direction,
            symbol,
            timeframe,
            entryAvg: price,
            amount: 0.001,
            isExit: false,
            orderType: 'market' // ✅ 모든 주문 시장가 처리
          });
        } else {
          console.log('⚠️ 자동매매 꺼짐 상태: 거래소 주문 실행 안됨');
        }
      }

      // ✅ 평균 및 비중 계산 (🔥 핵심)
      const { entryAvg: avg, entryCount: ratio } = getEntryInfo(symbol, type, timeframe);

      // ✅ 청산 신호일 경우 → 리스트 초기화
      if (isExitSignal) {
        clearEntries(symbol, type, timeframe);

        if (global.autoTradeEnabled) {
          await handleTradeSignal({
            side: direction,
            symbol,
            timeframe,
            entryAvg: price,
            amount: 0.001,
            isExit: true,
            orderType: 'market' // ✅ 모든 주문 시장가 처리
          });
        }
      }
      
      console.log('📦 메시지 입력값:', { type, symbol, timeframe, price, avg, ratio, ts }); // ✅ 로그 찍기
      
      // ✅ 다국어 설정
      const langChoi = getUserLang(config.TELEGRAM_CHAT_ID);
      const langMing = getUserLang(config.TELEGRAM_CHAT_ID_A);

      // ✅ 메시지 템플릿 생성
      const msgChoi = getTemplate({ 
        type, symbol: displaySymbol, timeframe, price, ts, 
        entryCount: typeof ratio === 'number' ? ratio : 0, 
        entryAvg: typeof avg === 'number' ? avg : 'N/A',
        leverage: leverage || config.DEFAULT_LEVERAGE, 
        lang: langChoi,
        direction
      });

      const msgMing = getTemplate({ 
        type, symbol: displaySymbol, timeframe, price, ts, 
        entryCount: typeof ratio === 'number' ? ratio : 0, 
        entryAvg: typeof avg === 'number' ? avg : 'N/A',
        leverage: leverage || config.DEFAULT_LEVERAGE, 
        lang: langMing,
        direction
      });
      
      // ✅ 텔레그램 전송
      if (update.isTest) {
        // 테스트일 경우 관리자 봇으로만 전송
        if (msgChoi.trim()) await sendToAdmin(msgChoi);
      } else {      
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
      }

      // ✅ 정상적인 전송 완료 반환
      return res.status(200).send("✅ 텔레그램 및 자동매매 전송 성공");
    } catch (err) {
      console.error("❌ 텔레그램/자동매매 처리 오류:", err.stack || err.message);
      return res.status(500).send("서버 오류");
    }
  }

  // ✅ 버튼 눌렀을 때 처리
  if (update.callback_query) {
    const callbackId = update.callback_query.id;

    if (processedCallbackQueries.has(callbackId)) {
      console.log('⚠️ 중복 콜백 쿼리 요청 무시:', callbackId);
      return res.sendStatus(200);
    }

    processedCallbackQueries.add(callbackId);    
    
    const cmd = update.callback_query.data;
    const chatId = update.callback_query.message.chat.id;
    const messageId = update.callback_query.message.message_id;
    const ctx = { chat: { id: chatId }, callbackQuery: update.callback_query };

    if (cmd.startsWith('toggle_symbol_')) {
      const symbolKey = cmd.replace('toggle_symbol_', '').toLowerCase();
      const symbolsPath = path.join(__dirname, './trader-gate/symbols.js');
      delete require.cache[require.resolve(symbolsPath)];
      const symbols = require(symbolsPath);

      if (symbols[symbolKey]) {
        symbols[symbolKey].enabled = !symbols[symbolKey].enabled;
        fs.writeFileSync(symbolsPath, `module.exports = ${JSON.stringify(symbols, null, 2)}`);

        console.log(`[⚙️ 자동매매 종목 변경] ${symbolKey.toUpperCase()} 상태 → ${symbols[symbolKey].enabled ? '✅ ON' : '❌ OFF'}`);

        await Promise.all([
          editMessage('admin', chatId, messageId, '📊 자동매매 종목 설정 (ON/OFF)', getSymbolToggleKeyboard()),
          answerCallback(callbackId, `✅ ${symbolKey.toUpperCase()} 상태 변경됨`)
        ]);
      }
      return res.sendStatus(200);
    } else {
      await handleAdminAction(cmd, ctx);
      return res.sendStatus(200);
    }
  }

  if (update.message?.text) {
    const chatId = update.message.chat.id;
    const messageText = update.message.text.trim();
    const lower = messageText.toLowerCase();

    res.sendStatus(200);

    if (["/test_menu", "/start", "/status", "/dummy_status", "/setlang", "/settz", "/help", "/settings", "/commands", "/refresh"].includes(lower)) {
      const sent = await sendBotStatus(chatId);
      if (sent?.data?.result?.message_id) setAdminMessageId(sent.data.result.message_id);
    } else {
      await sendToAdmin(`📨 사용자 메시지 수신\n\n<code>${messageText}</code>`, null);
    }
    return;
  }

  res.sendStatus(200);
};
