const moment = require("moment-timezone");
const config = require("./config");
const langManager = require("./langConfigManager");
const dummyHandler = require("./dummyHandler");
const handleTableWebhook = require("./handlers/tableHandler");
const { addEntry, clearEntries, getEntryInfo } = require('./entryManager');
const { getTemplate } = require("./MessageTemplates");
const { sendToChoi, sendToMing, sendToAdmin } = require("./botManager");
const sendBotStatus = require("./commands/status");
const { getTimeString, saveBotState } = require("./utils");

const TYPE_MAP = {
  show_Support: 'showSup',
  show_Resistance: 'showRes',
  is_Big_Support: 'isBigSup',
  is_Big_Resistance: 'isBigRes',
  Ready_show_Support: 'Ready_showSup',
  Ready_show_Resistance: 'Ready_showRes',
  Ready_is_Big_Support: 'Ready_isBigSup',
  Ready_is_Big_Resistance: 'Ready_isBigRes',
  Ready_exitLong: 'Ready_exitLong',
  Ready_exitShort: 'Ready_exitShort',
  exitLong: 'exitLong',
  exitShort: 'exitShort'
};

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
      const type = TYPE_MAP[update.type] || update.type;
      const price = parseFloat(update.price) || "N/A";

      const langChoi = getUserLang(config.TELEGRAM_CHAT_ID);
      const langMing = getUserLang(config.TELEGRAM_CHAT_ID_A);

      if (["showSup", "isBigSup", "showRes", "isBigRes"].includes(type)) {
        addEntry(symbol, type, price, timeframe);
      }
      if (["exitLong", "exitShort"].includes(type)) {
        clearEntries(symbol, type, timeframe);
      }

      const { entryCount, entryAvg } = getEntryInfo(symbol, type, timeframe);

      const msgChoi = getTemplate({ type, symbol, timeframe, price, ts, lang: langChoi, entryCount, entryAvg });
      const msgMing = getTemplate({ type, symbol, timeframe, price, ts, lang: langMing, entryCount, entryAvg });

      if (global.choiEnabled && msgChoi.trim()) await sendToChoi(msgChoi);
      if (global.mingEnabled && msgMing.trim()) await sendToMing(msgMing);

      return res.status(200).send("✅ 텔레그램 전송 성공");
    } catch (err) {
      console.error("❌ 텔레그램 전송 실패:", err.stack || err.message);
      return res.status(500).send("서버 오류");
    }
  }

  res.sendStatus(200);
};