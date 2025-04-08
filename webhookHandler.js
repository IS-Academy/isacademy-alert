// ✅ webhookHandler.js
const axios = require('axios');
const moment = require('moment-timezone');
const config = require('./config');
const dummyHandler = require('./dummyHandler');
const langManager = require('./langConfigManager');
const { getUserLang } = require('./lang');
const {
  generateAlertMessage,
  getWaitingMessage,
  sendTextToTelegram,
  editTelegramMessage,
  saveBotState,
  getInlineKeyboard,
  getLangKeyboard,
  getReplyKeyboard,
  getTzKeyboard,
  getLastDummyTime,
  getTimeString,
  getEntryInfo,
  addEntry,
  clearEntries
} = require('./utils');

// 명령어 모듈
const handleSetLang = require('./commands/setlang');
const handleSetTz = require('./commands/settz');
const sendBotStatus = require('./commands/status');

// ✅ 줄임 타입 매핑
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

function getUserTimezone(chatId) {
  return langManager.getUserConfig(chatId)?.tz || config.DEFAULT_TIMEZONE;
}

module.exports = async function webhookHandler(req, res) {
  const update = req.body;

  // ✅ 더미 핸들링
  if (req.originalUrl === '/dummy') {
    await dummyHandler(req, res);
    return;
  }

  // ✅ 트레이딩뷰 웹훅 메시지 수신
  if (update.symbol || update.type) {
    try {
      const alert = update;
      const ts = Number(alert.ts) || Math.floor(Date.now() / 1000);
      const symbol = alert.symbol || 'Unknown';
      const timeframe = alert.timeframe || '⏳';
      let type = TYPE_MAP[alert.type] || alert.type;

      const parsedPrice = parseFloat(alert.price);
      const price = Number.isFinite(parsedPrice) ? parsedPrice.toFixed(2) : 'N/A';

      const langChoi = getUserLang(config.TELEGRAM_CHAT_ID);
      const langMing = getUserLang(config.TELEGRAM_CHAT_ID_A);

      if (['showSup', 'showRes', 'isBigSup', 'isBigRes'].includes(type)) {
        addEntry(symbol, type, parsedPrice, timeframe);
      }
      if (['exitLong', 'exitShort'].includes(type)) {
        clearEntries(symbol, type, timeframe);
      }

      const { entryCount, entryAvg } = getEntryInfo(symbol, type, timeframe);

      const msgChoi = type.startsWith('Ready_')
        ? getWaitingMessage(type, symbol, timeframe, config.DEFAULT_WEIGHT, config.DEFAULT_LEVERAGE, langChoi)
        : generateAlertMessage({ type, symbol, timeframe, price, ts, lang: langChoi, entryCount, entryAvg });

      const msgMing = type.startsWith('Ready_')
        ? getWaitingMessage(type, symbol, timeframe, config.DEFAULT_WEIGHT, config.DEFAULT_LEVERAGE, langMing)
        : generateAlertMessage({ type, symbol, timeframe, price, ts, lang: langMing, entryCount, entryAvg });

      if (global.choiEnabled) {
        await axios.post(`https://api.telegram.org/bot${config.TELEGRAM_BOT_TOKEN}/sendMessage`, {
          chat_id: config.TELEGRAM_CHAT_ID,
          text: msgChoi,
          parse_mode: 'HTML'
        });
      }

      if (global.mingEnabled) {
        await axios.post(`https://api.telegram.org/bot${config.TELEGRAM_BOT_TOKEN_A}/sendMessage`, {
          chat_id: config.TELEGRAM_CHAT_ID_A,
          text: msgMing,
          parse_mode: 'HTML'
        });
      }

      if (!res.headersSent) res.status(200).send('✅ 텔레그램 전송 성공');
    } catch (err) {
      console.error('❌ 텔레그램 전송 실패:', err.message);
      if (!res.headersSent) res.status(500).send('서버 오류');
    }
    return;
  }

  // ✅ 인라인 버튼 처리
  if (update.callback_query) {
    const cmd = update.callback_query.data;
    const chatId = update.callback_query.message.chat.id;
    const messageId = update.callback_query.message.message_id;
    const lang = getUserLang(chatId);
    const tz = getUserTimezone(chatId);
    const timeStr = getTimeString(tz);

    res.sendStatus(200);

    // 언어 선택 UI 요청
    if (cmd === 'lang_choi' || cmd === 'lang_ming') {
      const bot = cmd === 'lang_choi' ? 'choi' : 'ming';
      const target = bot === 'choi' ? '최실장' : '밍밍';
      await editTelegramMessage(chatId, messageId, `🌐 ${target} 봇의 언어를 선택하세요:`, getLangKeyboard(bot));
      return;
    }

    // 언어 설정 처리
    if (cmd.startsWith('lang_choi_') || cmd.startsWith('lang_ming_')) {
      const [_, bot, langCode] = cmd.split('_');
      const targetId = bot === 'choi' ? config.TELEGRAM_CHAT_ID : config.TELEGRAM_CHAT_ID_A;
      const success = langManager.setUserLang(targetId, langCode);
      const reply = success
        ? `✅ ${bot === 'choi' ? '최실장' : '밍밍'} 봇의 언어가 <b>${langCode}</b>로 설정되었습니다.`
        : `❌ 언어 설정에 실패했습니다.`;

      await editTelegramMessage(chatId, messageId, reply);
      await sendBotStatus(timeStr);
      return;
    }

    if (['choi_on', 'choi_off', 'ming_on', 'ming_off'].includes(cmd)) {
      global.choiEnabled = cmd === 'choi_on' ? true : global.choiEnabled;
      global.choiEnabled = cmd === 'choi_off' ? false : global.choiEnabled;
      global.mingEnabled = cmd === 'ming_on' ? true : global.mingEnabled;
      global.mingEnabled = cmd === 'ming_off' ? false : global.mingEnabled;

      saveBotState({ choiEnabled: global.choiEnabled, mingEnabled: global.mingEnabled });
      await sendBotStatus(timeStr);
      return;
    }

    if (cmd === 'status') {
      await sendBotStatus(timeStr);
      return;
    }

    if (cmd === 'dummy_status') {
      const lastDummy = getLastDummyTime();
      const nowFormatted = moment().tz(tz).format('YYYY.MM.DD (ddd) HH:mm:ss');
      const msg =
        `🔁 <b>더미 알림 수신 기록</b>\n` +
        `──────────────────────\n` +
        `📥 마지막 수신 시간: <code>${lastDummy}</code>\n` +
        `🕒 현재 시간: <code>${nowFormatted}</code>\n` +
        `──────────────────────`;
      await editTelegramMessage(chatId, messageId, msg, getInlineKeyboard());
      return;
    }
  }

  // ✅ 텍스트 명령어 처리
  if (update.message && update.message.text) {
    const command = update.message.text.trim();
    const chatId = update.message.chat.id;
    const lang = getUserLang(chatId);
    const tz = getUserTimezone(chatId);
    const timeStr = getTimeString(tz);

    res.sendStatus(200);

    // ✅ /help, /도움말 처리 (모든 사용자 허용)
    if (['/help', '/도움말'].includes(command)) {
      await sendTextToTelegram('🛠 명령어: /start /setlang /settz /choi_on /choi_off /ming_on /ming_off');
      return;
    }

    // ✅ 관리자 전용 명령어 차단 (도움말 제외)
    if (
      ['/start', '/settings', '/setlang', '/settz'].some(cmd => command.startsWith(cmd)) &&
      chatId.toString() !== config.ADMIN_CHAT_ID
    ) {
      await sendTextToTelegram('⛔ 관리자 전용 명령어입니다.');
      return;
    }

    // ✅ 언어 설정
    if (command.startsWith('/setlang')) {
      const input = command.split(' ')[1];
      await handleSetLang(chatId, input, lang, timeStr);
      return;
    }

    // ✅ 타임존 설정
    if (command.startsWith('/settz')) {
      const input = command.split(' ')[1];
      await handleSetTz(chatId, input, lang, timeStr);
      return;
    }

    // ✅ 관리자 패널
    if (['/start', '/settings'].includes(command)) {
      await sendTextToTelegram('🤖 <b>IS 관리자봇에 오신 것을 환영합니다!</b>');
      await sendBotStatus(timeStr);
      await sendTextToTelegram('🌐 <b>최실장 봇의 언어를 선택하세요:</b>', getLangKeyboard('choi'));
      await sendTextToTelegram('🌐 <b>밍밍 봇의 언어를 선택하세요:</b>', getLangKeyboard('ming'));
      return;
    }

    // ✅ 관리자 명령어 확장
    if (chatId.toString() === config.ADMIN_CHAT_ID) {
      switch (command) {
        case '/choi_on': global.choiEnabled = true; break;
        case '/choi_off': global.choiEnabled = false; break;
        case '/ming_on': global.mingEnabled = true; break;
        case '/ming_off': global.mingEnabled = false; break;
      }
      saveBotState({ choiEnabled: global.choiEnabled, mingEnabled: global.mingEnabled });
      await sendBotStatus(timeStr, `${command} 처리 완료`);
      return;
    }
  }

  // ✅ 기본 응답 처리
  res.sendStatus(200);
};
