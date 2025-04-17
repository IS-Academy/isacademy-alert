//✅👇 webhookHandler.js

// 📦 필요한 모듈들 불러오기
const moment = require("moment-timezone"); // 🕒 날짜 및 시간 관리
const config = require("./config");                                                       // ⚙️ 환경설정 관리
const { sendToChoi, sendToMing, sendToAdmin, editMessage, answerCallback, 
        getSymbolToggleKeyboard } = require("./telegram/botManager"); // 🤖 텔레그램 봇 메시지 관리
const langManager = require("./telegram/langConfigManager"); // 🌐 언어 설정 관리
const dummyHandler = require("./telegram/handlers/dummyHandler"); // 🔄 더미 신호 처리
const { handleMessage } = require('./telegram/handlers/messageHandler');
const { getTimeString, saveBotState, setAdminMessageId, getAdminMessageId } = require("./telegram/utils");   // 🛠️ 유틸리티 함수
const { sendBotStatus, handleAdminAction } = require("./telegram/commands/status");       // 📟 관리자 명령 및 상태 관리
const tradeSymbols = require('./trader-gate/symbols');                                    // 📝 자동매매 종목 상태 로드
const { exec } = require('child_process');                                                // ⚡ 시스템 명령어 실행
const fs = require('fs');                                                                 // 💾 파일시스템 접근
const path = require('path');                                                             // 📂 파일경로 관리

// 🌍 전역변수 선언 및 초기화
global.autoTradeEnabled = true; // 🪄 기본값: 자동매매 ON

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
    await sendBotStatus(config.ADMIN_CHAT_ID, messageId, { allowCreateKeyboard: false });
    return;
  }

  // ✅ 일반 트레이딩 신호 처리 (symbol 또는 type이 있는 경우)
  if (update.symbol || update.type) {
    try {
      const ts = Number(update.ts) || Math.floor(Date.now() / 1000);
      const symbol = update.symbol?.toLowerCase() || "unknown";
      const timeframe = update.timeframe?.replace(/<[^>]*>/g, '') || "⏳";
      const type = update.type;
      const price = parseFloat(update.price) || "N/A";
      const leverage = update.leverage || config.DEFAULT_LEVERAGE;

      if (!tradeSymbols[symbol]?.enabled) {
        console.warn(`⛔ [자동매매 비활성화 종목] ${symbol} → 처리 중단됨`);
        return res.status(200).send('⛔ 해당 종목은 자동매매 꺼져있음');
      }

      const { addEntry, clearEntries } = require('./telegram/entryManager');

      const isEntrySignal = ["showSup", "isBigSup", "showRes", "isBigRes"].includes(type);
      const isExitSignal = ["exitLong", "exitShort"].includes(type);

      if (isEntrySignal) {
        addEntry(symbol, type, price, timeframe);
      }

      if (isExitSignal) {
        clearEntries(symbol, type, timeframe);
      }

      const { handleMessage } = require('./telegram/messageHandler');
      const { msgChoi, msgMing } = await handleMessage({ symbol, type, timeframe, price, ts, leverage });

      if (global.choiEnabled && msgChoi.trim()) await sendToChoi(msgChoi);
      if (global.mingEnabled && msgMing.trim()) await sendToMing(msgMing);

      res.status(200).send("✅ 텔레그램 및 자동매매 전송 성공");

    } catch (err) {
      console.error("❌ 텔레그램/자동매매 처리 오류:", err.stack || err.message);
      res.status(500).send("서버 오류");
    }

    return;
  }

  // ✅ 텔레그램 버튼 콜백 처리
  if (update.callback_query) {
    const cmd = update.callback_query.data;
    const chatId = update.callback_query?.message?.chat?.id;
    const messageId = update.callback_query?.message?.message_id;

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
          answerCallback(update.callback_query.id, `✅ ${symbolKey.toUpperCase()} 상태 변경됨`)
        ]);
      }
      return res.sendStatus(200);
    }

    await handleAdminAction(cmd, ctx);
    return res.sendStatus(200);
  }

  // 텍스트 메시지 처리
  if (update.message?.text) {
    const chatId = update.message.chat.id;
    const messageText = update.message.text.trim().toLowerCase();
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

