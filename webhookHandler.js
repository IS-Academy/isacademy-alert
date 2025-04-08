// ✅ webhookHandler.js (완성본)
const moment = require("moment-timezone");
const config = require("./config");
const langManager = require("./langConfigManager");
const dummyHandler = require("./dummyHandler");
const {
  generateAlertMessage,
  getWaitingMessage,
  generateSummaryMessage,
  generatePnLMessage,
  addEntry,
  clearEntries,
  getEntryInfo,
  getTimeString,
  getLastDummyTime,
  saveBotState
} = require("./utils");

const {
  sendToAdmin,
  editMessage,
  sendToChoi,
  sendToMing,
  getLangKeyboard,
  inlineKeyboard
} = require("./botManager");

const handleSetLang = require("./commands/setlang");
const handleSetTz = require("./commands/settz");
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

  // ✅ 더미 헬스체크
  if (req.originalUrl === "/dummy") {
    await dummyHandler(req, res);
    return;
  }

  // ✅ 트레이딩뷰 알림 처리
  if (update.symbol || update.type) {
    try {
      const alert = update;
      const ts = Number(alert.ts) || Math.floor(Date.now() / 1000);
      const symbol = alert.symbol || "Unknown";
      const timeframe = alert.timeframe || "⏳";
      const type = TYPE_MAP[alert.type] || alert.type;
      const price = parseFloat(alert.price) || "N/A";

      const langChoi = getUserLang(config.TELEGRAM_CHAT_ID);
      const langMing = getUserLang(config.TELEGRAM_CHAT_ID_A);

      if (["showSup", "showRes", "isBigSup", "isBigRes"].includes(type)) {
        addEntry(symbol, type, price, timeframe);
      }
      if (["exitLong", "exitShort"].includes(type)) {
        clearEntries(symbol, type, timeframe);
      }

      const { entryCount, entryAvg } = getEntryInfo(symbol, type, timeframe);

      const msgChoi = type.startsWith("Ready_")
        ? getWaitingMessage(type, symbol, timeframe, config.DEFAULT_WEIGHT, config.DEFAULT_LEVERAGE, langChoi)
        : generateAlertMessage({ type, symbol, timeframe, price, ts, lang: langChoi, entryCount, entryAvg });

      const msgMing = type.startsWith("Ready_")
        ? getWaitingMessage(type, symbol, timeframe, config.DEFAULT_WEIGHT, config.DEFAULT_LEVERAGE, langMing)
        : generateAlertMessage({ type, symbol, timeframe, price, ts, lang: langMing, entryCount, entryAvg });

      if (global.choiEnabled) await sendToChoi(msgChoi);
      if (global.mingEnabled) await sendToMing(msgMing);

      if (!res.headersSent) res.status(200).send("✅ 텔레그램 전송 성공");
    } catch (err) {
      console.error("❌ 텔레그램 전송 실패:", err.message);
      if (!res.headersSent) res.status(500).send("서버 오류");
    }
    return;
  }

  // ✅ 인라인 버튼 처리
  if (update.callback_query) {
    const cmd = update.callback_query.data;
    const chatId = update.callback_query.message.chat.id;
    const messageId = update.callback_query.message.message_id;
    const tz = getUserTimezone(chatId);
    const timeStr = getTimeString(tz);

    res.sendStatus(200);

    try {
      if (cmd === "lang_choi" || cmd === "lang_ming") {
        await sendBotStatus(timeStr, '', chatId, messageId, cmd); // 언어 선택 UI 추가
        return;
      }

      if (cmd.startsWith("lang_choi_") || cmd.startsWith("lang_ming_")) {
        const [_, bot, langCode] = cmd.split("_");
        const targetId = bot === "choi" ? config.TELEGRAM_CHAT_ID : config.TELEGRAM_CHAT_ID_A;
        langManager.setUserLang(targetId, langCode);
        await sendBotStatus(timeStr, '', chatId, messageId); // 설정 후 갱신
        return;
      }

      if (["choi_on", "choi_off", "ming_on", "ming_off"].includes(cmd)) {
        global.choiEnabled = cmd === "choi_on" ? true : global.choiEnabled;
        global.choiEnabled = cmd === "choi_off" ? false : global.choiEnabled;
        global.mingEnabled = cmd === "ming_on" ? true : global.mingEnabled;
        global.mingEnabled = cmd === "ming_off" ? false : global.mingEnabled;
        saveBotState({ choiEnabled: global.choiEnabled, mingEnabled: global.mingEnabled });
        await sendBotStatus(timeStr, '', chatId, messageId);
        return;
      }

      if (["status", "dummy_status"].includes(cmd)) {
        await sendBotStatus(timeStr, '', chatId, messageId);
        return;
      }
    } catch (e) {
      console.error('❌ 인라인 명령 처리 오류:', e.message);
    }
    return;
  }

  // ✅ 텍스트 명령어 처리
  if (update.message && update.message.text) {
    const command = update.message.text.trim();
    const chatId = update.message.chat.id;
    const lang = getUserLang(chatId);
    const tz = getUserTimezone(chatId);
    const timeStr = getTimeString(tz);

    res.sendStatus(200);

    if (["/start", "/settings"].includes(command)) {
      await sendBotStatus(timeStr);
      return;
    }

    if (command.startsWith("/setlang")) {
      const input = command.split(" ")[1];
      await handleSetLang(chatId, input, lang, timeStr);
      return;
    }

    if (command.startsWith("/settz")) {
      const input = command.split(" ")[1];
      await handleSetTz(chatId, input, lang, timeStr);
      return;
    }

    if (command === "/summary") {
      const entryList = require("./utils").getAllEntries?.() || [];
      const summary = generateSummaryMessage(entryList, lang);
      await sendToAdmin(summary);
      return;
    }

    if (command.startsWith("/pnl")) {
      const args = command.split(" ");
      const symbol = args[1] || "BTCUSDT.P";
      const pnl = parseFloat(args[2] || 0);
      const avg = args[3] || 'N/A';
      const msg = generatePnLMessage({ symbol, pnlPercent: pnl, entryAvg: avg, lang });
      await sendToAdmin(msg);
      return;
    }

    if (chatId.toString() === config.ADMIN_CHAT_ID) {
      switch (command) {
        case "/choi_on": global.choiEnabled = true; break;
        case "/choi_off": global.choiEnabled = false; break;
        case "/ming_on": global.mingEnabled = true; break;
        case "/ming_off": global.mingEnabled = false; break;
      }
      saveBotState({ choiEnabled: global.choiEnabled, mingEnabled: global.mingEnabled });
      await sendBotStatus(timeStr);
      return;
    }
  }

  res.sendStatus(200);
};
