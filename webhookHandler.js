// ✅ webhookHandler.js (최종본 수정)
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

const { generateAlertMessage } = require("./AlertMessage");
const { sendToChoi, sendToMing } = require("./botManager");
const sendBotStatus = require("./commands/status");
const { getTranslation, translations } = require("./lang");

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

  if (update.symbol || update.type) {
    try {
      const ts = Number(update.ts) || Math.floor(Date.now() / 1000);
      const symbol = update.symbol || "Unknown";
      const timeframe = update.timeframe.replace(/<[^>]*>/g, '') || "⏳";
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

      const generateMsg = (lang) => {
        const symbolText = getTranslation(lang, 'symbols', type);
        const labels = translations[lang].labels;

        if (type.startsWith('Ready_')) {
          return `${symbolText} ${timeframe}⏱️\n\n${labels.symbol}: ${symbol}\n${labels.weight.replace('{weight}', config.DEFAULT_WEIGHT)} / ${labels.leverage.replace('{leverage}', config.DEFAULT_LEVERAGE)}`;
        }

        return generateAlertMessage({
          type, symbol, timeframe, price, ts,
          lang, entryCount, entryAvg
        });
      };

      const msgChoi = generateMsg(langChoi);
      const msgMing = generateMsg(langMing);

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
    const timeStr = getTimeString();

    res.sendStatus(200);

    if (["choi_on", "choi_off", "ming_on", "ming_off"].includes(cmd)) {
      if (cmd === "choi_on") global.choiEnabled = true;
      else if (cmd === "choi_off") global.choiEnabled = false;

      if (cmd === "ming_on") global.mingEnabled = true;
      else if (cmd === "ming_off") global.mingEnabled = false;

      saveBotState({ choiEnabled: global.choiEnabled, mingEnabled: global.mingEnabled });
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
