// ✅ webhookHandler.js (최종 수정 완료)
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
const { sendToChoi, sendToMing, sendToAdmin } = require("./botManager");
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

function formatDate(lang) {
  const now = moment().tz(config.DEFAULT_TIMEZONE);
  const dayKey = now.format('ddd');
  const dayTranslated = translations[lang].days[dayKey];
  return now.format(`YY.MM.DD (${dayTranslated})`);
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
      const timeframe = update.timeframe?.replace(/<[^>]*>/g, '') || "⏳";
      const type = TYPE_MAP[update.type] || update.type;
      const price = parseFloat(update.price) || "N/A";

      console.log(`📥 [신호 수신] type=${type}, symbol=${symbol}, timeframe=${timeframe}, price=${price}, ts=${ts}`);

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
        const labels = translations[lang]?.labels;

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

      if (global.choiEnabled && msgChoi.trim()) {
        console.log(`📤 [최실장에게 전송] lang=${langChoi}, chatId=${config.TELEGRAM_CHAT_ID}`);
        await sendToChoi(msgChoi);
      }
      if (global.mingEnabled && msgMing.trim()) {
        console.log(`📤 [밍밍에게 전송] lang=${langMing}, chatId=${config.TELEGRAM_CHAT_ID_A}`);
        await sendToMing(msgMing);
      }

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

    console.log(`🔘 [인라인 클릭] cmd=${cmd}, chatId=${chatId}, messageId=${messageId}`);

    if (!chatId) {
      console.error('❗ chatId 없음: callback_query.message.chat.id 확인 필요');
      return res.sendStatus(400);
    }

    res.sendStatus(200);

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
      console.log(`🌐 [언어 변경] 대상=${bot}, 언어=${langCode}`);
    }

    await sendBotStatus(timeStr, cmd, chatId, messageId);
    return;
  }

  if (update.message && update.message.text) {
    const chatId = update.message.chat.id;
    console.log(`💬 [일반 메시지 수신] chatId=${chatId}, text=${update.message.text}`);
    res.sendStatus(200);
    await sendBotStatus(getTimeString(), '', chatId);
    return;
  }

  res.sendStatus(200);
};
