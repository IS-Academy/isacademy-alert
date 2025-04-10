// ✅👇 webhookHandler.js

const moment = require("moment-timezone");
const config = require("./config");
const langManager = require("./langConfigManager");
const dummyHandler = require("./dummyHandler");
const handleTableWebhook = require("./handlers/tableHandler");
const {
  getTimeString,
  getLastDummyTime,
  saveBotState
} = require("./utils");

const {
  addEntry,
  clearEntries,
  getEntryInfo
} = require('./entryManager');

const { getTemplate } = require("./MessageTemplates");
const { sendToChoi, sendToMing, sendToAdmin } = require("./botManager");
const sendBotStatus = require("./commands/status");
const { getTranslation, translations } = require("./lang");

// ✅ entry 캐시 저장소
const entryCache = {};

function saveEntryData(symbol, type, avg, ratio) {
  const key = `${symbol}-${type}`;
  entryCache[key] = { avg, ratio, ts: Date.now() };
}

function getEntryData(symbol, type) {
  const key = `${symbol}-${type}`;
  return entryCache[key] || { avg: 'N/A', ratio: 0 };
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
      const symbol = update.symbol || "Unknown";
      const timeframe = update.timeframe?.replace(/<[^>]*>/g, '') || "⏳";
      const type = update.type;
      const price = parseFloat(update.price) || "N/A";

      // ✅ entryAvg/entryRatio 받아와서 캐시에 저장
      const entryAvg = update.entryAvg || 'N/A';
      const entryRatio = update.entryRatio || 0;
      const isEntrySignal = [
        "showSup", "isBigSup",
        "showRes", "isBigRes",
        "exitLong", "exitShort"
      ].includes(type);

      if (isEntrySignal) {
        saveEntryData(symbol, type, entryAvg, entryRatio);
      }

      // ✅ entry 정보 불러오기
      const { avg, ratio } = getEntryData(symbol, type);

      const langChoi = getUserLang(config.TELEGRAM_CHAT_ID);
      const langMing = getUserLang(config.TELEGRAM_CHAT_ID_A);

      if (["showSup", "showRes", "isBigSup", "isBigRes"].includes(type)) {
        addEntry(symbol, type, price, timeframe);
      }
      if (["exitLong", "exitShort"].includes(type)) {
        clearEntries(symbol, type, timeframe);
      }

      const msgChoi = getTemplate({
        type, symbol, timeframe, price, ts,
        lang: langChoi, entryCount: ratio, entryAvg: avg
      });
      const msgMing = getTemplate({
        type, symbol, timeframe, price, ts,
        lang: langMing, entryCount: ratio, entryAvg: avg
      });

      if (global.choiEnabled && msgChoi.trim()) await sendToChoi(msgChoi);
      if (global.mingEnabled && msgMing.trim()) await sendToMing(msgMing);

      return res.status(200).send("✅ 텔레그램 전송 성공");
    } catch (err) {
      console.error("❌ 텔레그램 전송 실패:", err.stack || err.message);
      return res.status(500).send("서버 오류");
    }
  }

  if (update.callback_query) {
    const cmd = update.callback_query.data;
    const chatId = update.callback_query?.message?.chat?.id;
    const messageId = update.callback_query?.message?.message_id;

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
