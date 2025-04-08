// ✅ webhookHandler.js
const moment = require("moment-timezone");
const config = require("./config");
const langManager = require("./langConfigManager");
const dummyHandler = require("./dummyHandler");
const {
  addEntry,
  clearEntries,
  getEntryInfo,
  getTimeString,
  getLastDummyTime,
  saveBotState
} = require("./utils");

const {
  generateAlertMessage,
  getWaitingMessage,
  generateSummaryMessage,
  generatePnLMessage
} = require("./AlertMessage");

const { sendToChoi, sendToMing } = require("./botManager");
const sendBotStatus = require("./commands/status");

const TYPE_MAP = {
  show_Support: 'showSup',
  show_Resistance: 'showRes',
  is_Big_Support: 'isBigSup',
  is_Big_Resistance: 'isBigRes',
  Ready_show_Support: 'Ready_showSup',
  Ready_show_Resistance: 'Ready_showRes',
  Ready_is_Big_Support: 'Ready_isBigSup',
  Ready_is_Big_Resistance: 'Ready_isBigRes'
};

function getUserLang(chatId) {
  return langManager.getUserConfig(chatId)?.lang || 'ko';
}

function getUserTimezone(chatId) {
  return langManager.getUserConfig(chatId)?.tz || config.DEFAULT_TIMEZONE;
}

module.exports = async function webhookHandler(req, res) {
  const update = req.body;

  if (req.originalUrl === "/dummy") {
    await dummyHandler(req, res);
    return;
  }

  if (update.symbol || update.type) {
    try {
      const ts = Number(update.ts) || Math.floor(Date.now() / 1000);
      const symbol = update.symbol || "Unknown";
      const timeframe = update.timeframe.replace(/<[^>]*>/g, '') || "⏳";  // HTML 태그 제거
      const type = TYPE_MAP[update.type] || update.type;
      const price = parseFloat(update.price) || "N/A";

      const langChoi = getUserLang(config.TELEGRAM_CHAT_ID);
      const langMing = getUserLang(config.TELEGRAM_CHAT_ID_A);

      if (["showSup", "showRes", "isBigSup", "isBigRes"].includes(type)) {
        addEntry(symbol, type, price, timeframe);
      }
      if (["exitLong", "exitShort"].includes(type)) {
        clearEntries(symbol, type, timeframe);
      }

      const { entryCount, entryAvg } = getEntryInfo(symbol, type, timeframe);

      // ✅ Ready 타입에 따른 메시지 포맷을 정확히 구성
      const msgChoi = type.startsWith("Ready_")
        ? `#💲${type.includes('Sup') ? '롱 청산 준비📈' : '숏 청산 준비📉'} ${timeframe}⏱️\n\n📌 종목: ${symbol}\n🗝️ 비중: ${config.DEFAULT_WEIGHT}% / 🎲 배율: ${config.DEFAULT_LEVERAGE}×`
        : generateAlertMessage({ type, symbol, timeframe, price, ts, lang: langChoi, entryCount, entryAvg });

      const msgMing = type.startsWith("Ready_")
        ? `#💲${type.includes('Sup') ? '롱 청산 준비📈' : '숏 청산 준비📉'} ${timeframe}⏱️\n\n📌 종목: ${symbol}\n🗝️ 비중: ${config.DEFAULT_WEIGHT}% / 🎲 배율: ${config.DEFAULT_LEVERAGE}×`
        : generateAlertMessage({ type, symbol, timeframe, price, ts, lang: langMing, entryCount, entryAvg });

      // ✅ 콘솔로그로 최종메시지 확인
      console.log("[msgChoi]", msgChoi);
      console.log("[msgMing]", msgMing);

      if (global.choiEnabled && msgChoi.trim()) await sendToChoi(msgChoi, { parse_mode: 'HTML' });
      if (global.mingEnabled && msgMing.trim()) await sendToMing(msgMing, { parse_mode: 'HTML' });

      return res.status(200).send("✅ 텔레그램 전송 성공");
    } catch (err) {
      console.error("❌ 텔레그램 전송 실패:", err.message);
      return res.status(500).send("서버 오류");
    }
  }

  if (update.callback_query) {
    const cmd = update.callback_query.data;
    const chatId = update.callback_query.message.chat.id;
    const messageId = update.callback_query.message.message_id;
    const timeStr = getTimeString(getUserTimezone(chatId));

    res.sendStatus(200);

    if (cmd === "lang_choi" || cmd === "lang_ming") {
      await sendBotStatus(timeStr, cmd, chatId, messageId);
    } else if (cmd.startsWith("lang_choi_") || cmd.startsWith("lang_ming_")) {
      const [_, bot, langCode] = cmd.split("_");
      const targetId = bot === "choi" ? config.TELEGRAM_CHAT_ID : config.TELEGRAM_CHAT_ID_A;
      langManager.setUserLang(targetId, langCode);
      await sendBotStatus(timeStr, '', chatId, messageId);
    } else if (["choi_on", "choi_off", "ming_on", "ming_off"].includes(cmd)) {
      global.choiEnabled = cmd === "choi_on";
      global.mingEnabled = cmd === "ming_on";
      saveBotState({ choiEnabled: global.choiEnabled, mingEnabled: global.mingEnabled });
      await sendBotStatus(timeStr, '', chatId, messageId);
    } else if (["status", "dummy_status"].includes(cmd)) {
      await sendBotStatus(timeStr, '', chatId, messageId);
    }
    return;
  }

  if (update.message && update.message.text) {
    const chatId = update.message.chat.id;
    res.sendStatus(200);
    await sendBotStatus(getTimeString(), '', chatId);
    return;
  }

  res.sendStatus(200);
};
