//✅👇 webhookHandler.js

// 📦 필요한 모듈들 불러오기
const moment = require("moment-timezone");
const config = require("./config");
const langManager = require("./langConfigManager");
const dummyHandler = require("./dummyHandler");
const handleTableWebhook = require("./handlers/tableHandler");
const { getTimeString, saveBotState, setAdminMessageId } = require("./utils");
const { addEntry, clearEntries, getEntryInfo } = require('./entryManager');
const { getTemplate } = require("./MessageTemplates");
const { sendToChoi, sendToMing, sendToAdmin, editMessage, answerCallback, getSymbolToggleKeyboard } = require("./botManager");
const { sendBotStatus, handleAdminAction } = require("./commands/status");
const { exec } = require('child_process');
const { handleTradeSignal } = require('./trader-gate/tradeSignalHandler'); // ✅ 자동매매 핸들러
const tradeSymbols = require('./trader-gate/symbols'); // ✅ 종목 상태 로드
const fs = require('fs');
const path = require('path');

// 🌍 전역변수 선언 및 초기화
const entryCache = {};
global.autoTradeEnabled = true; // 🪄 기본값: 자동매매 ON

// 📌 진입 정보(entry)를 전역 캐시에 저장하는 함수
function saveEntryData(symbol, type, avg, ratio) {
  global.entryCache = global.entryCache || {};
  const key = `${symbol}-${type}`;
  global.entryCache[key] = { avg, ratio, ts: Date.now() };
}

// 📌 진입 정보를 전역 캐시에서 가져오는 함수
function getEntryData(symbol, type) {
  global.entryCache = global.entryCache || {};
  const key = `${symbol}-${type}`;
  return global.entryCache[key] || { avg: 'N/A', ratio: 0 };
}

// 📌 텔레그램 채팅 ID를 통해 언어 설정을 가져오는 함수
function getUserLang(chatId) {
  return langManager.getUserConfig(chatId)?.lang || 'ko';
}

// 📦 웹훅 요청 처리 메인 함수
module.exports = async function webhookHandler(req, res) {
  const update = req.body; // 요청된 웹훅 데이터(JSON)

  // ✅ 더미 웹훅 처리 (/dummy URL로 수신된 경우)
  if (req.originalUrl === "/dummy") {
    await dummyHandler(req, res); // 더미 처리 로직 수행 후,
    const messageId = getAdminMessageId(); // 현재 관리자 메시지 ID 획득
    // 관리자 패널 상태 갱신 (키보드 신규 생성 방지 옵션 설정)
    await sendBotStatus(config.ADMIN_CHAT_ID, messageId, { allowCreateKeyboard: false });
    return; // 이후 로직 종료
  }

  // ✅ long_table, short_table 타입의 웹훅 데이터 처리
  if (["long_table", "short_table"].includes(update.type)) {
    await handleTableWebhook(update);
    return res.status(200).send("✅ 테이블 전송됨");
  }

  // ✅ 일반 트레이딩 신호 처리 (symbol 또는 type이 있는 경우)
  if (update.symbol || update.type) {
    try {
      // 🔖 신호 데이터 추출 및 기본값 설정
      const ts = Number(update.ts) || Math.floor(Date.now() / 1000);
      const symbol = update.symbol?.toLowerCase() || "unknown";
      const timeframe = update.timeframe?.replace(/<[^>]*>/g, '') || "⏳";
      const type = update.type;
      const price = parseFloat(update.price) || "N/A";
      const leverage = update.leverage || config.DEFAULT_LEVERAGE;

      // ⛔ 자동매매 비활성화된 종목 처리
      if (!tradeSymbols[symbol]?.enabled) {
        console.warn(`⛔ [자동매매 비활성화 종목] ${symbol} → 처리 중단됨`);
        return res.status(200).send('⛔ 해당 종목은 자동매매 꺼져있음');
      }

      // ✅ entryAvg/entryRatio 받아와서 캐시에 저장 (`25.04.14 미사용)
//      const entryAvg = update.entryAvg || 'N/A';
//      const entryRatio = update.entryRatio || 0;

      // 📌 신호 타입으로부터 진입(롱/숏) 방향 결정
      const isShort = type.endsWith('Short');
      const direction = isShort ? 'short' : 'long';
      
      // 📌 진입/청산 신호 여부 판별 (direction 결정 후)
      const isEntrySignal = ["showSup", "isBigSup", "showRes", "isBigRes"].includes(type);
      const isExitSignal = ["exitLong", "exitShort"].includes(type);

      // ✅ 진입 신호라면, 진입 정보(entry)를 저장하고 자동매매 주문 수행
      if (isEntrySignal) {
        addEntry(symbol, type, price, timeframe); // entryManager에 진입 저장
        if (global.autoTradeEnabled) {
          await handleTradeSignal({ side: direction, symbol, timeframe, entryAvg: price, amount: 0.001, isExit: false, orderType: 'market' });      
        } else {
          console.log('⚠️ 자동매매 OFF → 주문 생략됨');
        }
      }

      // ✅ 평균진입가 및 진입비중 정보를 얻음
      const { entryAvg: avg, entryCount: ratio } = getEntryInfo(symbol, type, timeframe);

      // ✅ 청산 신호일 경우, 기존 진입 정보(entry)를 삭제하고 자동매매 청산 주문 수행
      if (isExitSignal) {
        clearEntries(symbol, type, timeframe); // entry 정보 초기화
        if (global.autoTradeEnabled) {
          await handleTradeSignal({ side: direction, symbol, timeframe, entryAvg: price, amount: 0.001, isExit: true, orderType: 'market' });
        }
      }

      // 📌 처리한 데이터를 로그로 출력 (디버깅 용)
      console.log('📦 메시지 입력값:', { type, symbol, timeframe, price, avg, ratio, ts });
      
      // ✅ 언어별 메시지 생성 준비
      const langChoi = getUserLang(config.TELEGRAM_CHAT_ID);
      const langMing = getUserLang(config.TELEGRAM_CHAT_ID_A);
      const langGlobal = 'en';
      const langChina = 'zh';
      const langJapan = 'jp';

      // ✅ 언어별 메시지 템플릿 생성 (다국어 지원)
      const msgChoi = getTemplate({ type, symbol: symbol.toUpperCase(), timeframe, price, ts, entryCount: ratio, entryAvg: avg, leverage, lang: langChoi, direction });
      const msgMing = getTemplate({ type, symbol: symbol.toUpperCase(), timeframe, price, ts, entryCount: ratio, entryAvg: avg, leverage, lang: langMing, direction });
      const msgGlobal = getTemplate({ type, symbol, timeframe, price, ts, entryCount: ratio, entryAvg: avg, leverage, lang: langGlobal });
      const msgChina  = getTemplate({ type, symbol, timeframe, price, ts, entryCount: ratio, entryAvg: avg, leverage, lang: langChina });
      const msgJapan  = getTemplate({ type, symbol, timeframe, price, ts, entryCount: ratio, entryAvg: avg, leverage, lang: langJapan });

      
      // ✅ 텔레그램 메시지 전송 (최실장 및 밍밍봇 채널)
      if (global.choiEnabled && msgChoi.trim()) await sendToChoi(msgChoi);
      if (global.mingEnabled && msgMing.trim()) await sendToMing(msgMing);
      // ✅ 다국어 채널 전송
      await sendToEnglish(msgGlobal);
      await sendToChina(msgChina);
      await sendToJapan(msgJapan);

      // 📸 exit 신호 시 캡처 명령어 실행 (차트 이미지 자동 전송)
      if (isExitSignal) {
        const intervalNum = timeframe.replace(/[^0-9]/g, '') || "1";
        const captureCommand = `node captureAndSend.js --interval=${intervalNum} --type=${type}`;
        exec(captureCommand, (error, stdout, stderr) => {
          if (error) console.error(`❌ 캡처 실패: ${error.message}`);
          else if (stderr) console.error(`⚠️ 캡처 경고: ${stderr}`);
          else if (stdout.trim()) console.log(`✅ 캡처 성공:\n${stdout.trim()}`);
        });
      }

      return res.status(200).send("✅ 텔레그램 및 자동매매 전송 성공");
    } catch (err) {
      console.error("❌ 텔레그램/자동매매 처리 오류:", err.stack || err.message);
      return res.status(500).send("서버 오류");
    }
  }

  // ✅ 텔레그램 버튼 콜백 처리
  if (update.callback_query) {
    const cmd = update.callback_query.data;
    const chatId = update.callback_query?.message?.chat?.id;
    const messageId = update.callback_query?.message?.message_id;

    const ctx = { chat: { id: chatId }, callbackQuery: update.callback_query };

    // 자동매매 종목 ON/OFF 처리
    if (cmd.startsWith('toggle_symbol_')) {
      const symbolKey = cmd.replace('toggle_symbol_', '').toLowerCase();
      const symbolsPath = path.join(__dirname, './trader-gate/symbols.js');
      delete require.cache[require.resolve(symbolsPath)];
      const symbols = require(symbolsPath);
      if (symbols[symbolKey]) {
        symbols[symbolKey].enabled = !symbols[symbolKey].enabled;
        fs.writeFileSync(symbolsPath, `module.exports = ${JSON.stringify(symbols, null, 2)}`);
        console.log(`[⚙️ 자동매매 종목 변경] ${symbolKey.toUpperCase()} 상태 → ${symbols[symbolKey].enabled ? '✅ ON' : '❌ OFF'}`); // ✅ 자동매매 종목 변경내용 로그로 출력
        await Promise.all([
          editMessage('admin', chatId, messageId, '📊 자동매매 종목 설정 (ON/OFF)', getSymbolToggleKeyboard()),
          answerCallback(update.callback_query.id, `✅ ${symbolKey.toUpperCase()} 상태 변경됨`)
        ]);
      }
      return res.sendStatus(200);
    }

    // 기타 버튼 액션 처리
    await handleAdminAction(cmd, ctx);
    return res.sendStatus(200);
  }

  // 텍스트 메시지 처리(명령어 및 기타 메시지)
  if (update.message?.text) {
    const chatId = update.message.chat.id;
    const messageText = update.message.text.trim().toLowerCase();
    const timeStr = getTimeString();
    const lower = messageText.toLowerCase();
    res.sendStatus(200);
    if (["/test_menu", "/start", "/status", "/dummy_status", "/setlang", "/settz", "/help", "/settings"].includes(messageText)) {
      await sendBotStatus(chatId);
    } else {
      await sendToAdmin(`📨 사용자 메시지 수신\n\n<code>${messageText}</code>`);
    }
    return;
  }

  res.sendStatus(200);
};
