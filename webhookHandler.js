// webhookHandler.js
const axios = require('axios');
const moment = require('moment-timezone');
const config = require('./config');
const langManager = require('./langConfigManager');
const langMessages = require('./langMessages');
const {
  generateAlertMessage,
  sendToMingBot,
  sendTextToTelegram,
  editTelegramMessage,
  saveBotState,
  getInlineKeyboard,
  getLangKeyboard,
  getReplyKeyboard,
  getTzKeyboard
} = require('./utils');

const LANGUAGE_MAP = { ko: 'ko', en: 'en', zh: 'zh-cn', ja: 'ja' };

// ✅ 사용자 ID로 언어 가져오기 (기본값은 'ko')
function getUserLang(chatId) {
  const lang = langManager.getUserConfig(chatId)?.lang;
  return Object.keys(LANGUAGE_MAP).includes(lang) ? lang : 'ko';
}

function getUserTimezone(chatId) {
  return langManager.getUserConfig(chatId)?.tz || 'Asia/Seoul';
}

function getTimeString(timezone = 'Asia/Seoul') {
  return moment().tz(timezone).format('HH:mm:ss');
}

function formatTimestamp(ts, lang = 'ko', timezone = 'Asia/Seoul') {
  const locale = LANGUAGE_MAP[lang] || 'ko';
  moment.locale(locale);
  const time = moment.unix(ts).tz(timezone);
  return {
    date: time.format('YY. MM. DD. (ddd)'),
    clock: time.format('A hh:mm:ss')
      .replace('AM', locale === 'ko' ? '오전' : 'AM')
      .replace('PM', locale === 'ko' ? '오후' : 'PM')
  };
}

module.exports = async function webhookHandler(req, res) {
  const update = req.body;

  // ✅ 1. 인라인 버튼 처리
  if (update.callback_query) {
    const cmd = update.callback_query.data;
    const chatId = update.callback_query.message.chat.id;
    const messageId = update.callback_query.message.message_id;
    const tz = getUserTimezone(chatId);
    const timeStr = getTimeString(tz);

    res.sendStatus(200);

    // ✅ 언어 선택 메뉴 요청
    if (cmd === 'lang_choi' || cmd === 'lang_ming') {
      const bot = cmd === 'lang_choi' ? 'choi' : 'ming';
      const target = bot === 'choi' ? '최실장' : '밍밍';
      await editTelegramMessage(chatId, messageId, `🌐 ${target} 봇의 언어를 선택하세요:`, getLangKeyboard(bot));
      return;
    }

    // ✅ 실제 언어 설정 처리
    if (cmd.startsWith('lang_choi_') || cmd.startsWith('lang_ming_')) {
      const [_, bot, langCode] = cmd.split('_');
      const targetId = bot === 'choi' ? config.TELEGRAM_CHAT_ID : config.TELEGRAM_CHAT_ID_A;
      const success = langManager.setUserLang(targetId, langCode);
      const reply = success
        ? `✅ ${bot === 'choi' ? '최실장' : '밍밍'} 봇의 언어가 <b>${langCode}</b>로 설정되었습니다.`
        : `❌ 언어 설정에 실패했습니다.`;
      await editTelegramMessage(chatId, messageId, reply);
      return;
    }

    // ✅ ON/OFF 상태 변경 처리
    switch (cmd) {
      case 'choi_on': global.choiEnabled = true; break;
      case 'choi_off': global.choiEnabled = false; break;
      case 'ming_on': global.mingEnabled = true; break;
      case 'ming_off': global.mingEnabled = false; break;
    }

    if (['choi_on', 'choi_off', 'ming_on', 'ming_off'].includes(cmd)) {
      saveBotState({ choiEnabled: global.choiEnabled, mingEnabled: global.mingEnabled });
    }

    if (cmd === 'status' || cmd.includes('_on') || cmd.includes('_off')) {
      const langChoi = getUserLang(config.TELEGRAM_CHAT_ID);
      const langMing = getUserLang(config.TELEGRAM_CHAT_ID_A);
      const statusMsg = `✅ 현재 상태: (🕒 ${timeStr})\n최실장: ${global.choiEnabled ? '✅ ON' : '⛔ OFF'} (${langChoi})\n밍밍: ${global.mingEnabled ? '✅ ON' : '⛔ OFF'} (${langMing})`;
      await editTelegramMessage(chatId, messageId, statusMsg, getInlineKeyboard());
      return;
    }
  }

  // ✅ 2. 텍스트 명령어 처리
  if (update.message && update.message.text) {
    const command = update.message.text.trim();
    const fromId = update.message.chat.id;
    const lang = getUserLang(fromId);
    const tz = getUserTimezone(fromId);
    const timeStr = getTimeString(tz);
    res.sendStatus(200);

    // ✅ /setlang
    if (command.startsWith('/setlang')) {
      const input = command.split(' ')[1];
      if (!input) {
        await sendTextToTelegram('🌐 언어를 선택해주세요:', getReplyKeyboard('lang'));
        return;
      }
      const success = langManager.setUserLang(fromId, input);
      const msg = success ? langMessages.setLangSuccess[lang](input) : langMessages.setLangFail[lang];
      await sendTextToTelegram(`${msg} (🕒 ${timeStr})`);
      return;
    }

    // ✅ /settz
    if (command.startsWith('/settz')) {
      const input = command.split(' ')[1];
      if (!input) {
        await sendTextToTelegram('🕒 타임존을 선택해주세요:', getTzKeyboard());
        return;
      }
      const success = langManager.setUserTimezone(fromId, input);
      const msg = success ? langMessages.setTzSuccess[lang](input) : langMessages.setTzFail[lang];
      await sendTextToTelegram(`${msg} (🕒 ${timeStr})`);
      return;
    }

    // ✅ 관리자 명령어
    if (fromId.toString() === config.ADMIN_CHAT_ID) {
      const replyMap = {
        '/start': '🤖 IS 관리자봇에 오신 것을 환영합니다!',
        '/settings': '🤖 설정 패널을 불러옵니다...',
        '/help': '🛠 명령어: /최실장켜 /최실장꺼 /최실장상태 /밍밍켜 /밍밍꺼 /밍밍상태',
        '/도움말': '🛠 명령어: /최실장켜 /최실장꺼 /최실장상태 /밍밍켜 /밍밍꺼 /밍밍상태',
        '/choi_on': '✅ 최실장 전송 활성화',
        '/choi_off': '⛔ 최실장 전송 중단',
        '/choi_status': `📡 최실장 상태: ${global.choiEnabled ? '✅ ON' : '⛔ OFF'}`,
        '/ming_on': '✅ 밍밍 전송 활성화',
        '/ming_off': '⛔ 밍밍 전송 중단',
        '/ming_status': `📡 밍밍 상태: ${global.mingEnabled ? '✅ ON' : '⛔ OFF'}`
      };

  // ✅ /settings 명령어도 /start 처리로 연결
      const normalizedCommand = command === '/settings' ? '/start' : command;

      if (replyMap[normalizedCommand]) {
        if (normalizedCommand.includes('choi_on')) global.choiEnabled = true;
        if (normalizedCommand.includes('choi_off')) global.choiEnabled = false;
        if (normalizedCommand.includes('ming_on')) global.mingEnabled = true;
        if (normalizedCommand.includes('ming_off')) global.mingEnabled = false;
        saveBotState({ choiEnabled: global.choiEnabled, mingEnabled: global.mingEnabled });

        const langChoi = getUserLang(config.TELEGRAM_CHAT_ID);
        const langMing = getUserLang(config.TELEGRAM_CHAT_ID_A);
        const statusMsg = `✅ 현재 상태: (🕒 ${timeStr})\n최실장: ${global.choiEnabled ? '✅ ON' : '⛔ OFF'} (${langChoi})\n밍밍: ${global.mingEnabled ? '✅ ON' : '⛔ OFF'} (${langMing})`;

        const finalText = normalizedCommand === '/start'
          ? `${replyMap[normalizedCommand]}\n\n${statusMsg}`
          : `${replyMap[normalizedCommand]} (🕒 ${timeStr})`;

        await sendTextToTelegram(finalText, normalizedCommand === '/start' ? getInlineKeyboard() : undefined);
        return;
      }
    }
  }

  // ✅ 3. 일반 Alert 메시지 처리
  try {
    const alert = req.body;
    const ts = Number(alert.ts);
    const isValidTs = Number.isFinite(ts) && ts > 0;
    const symbol = alert.symbol || 'Unknown';
    const timeframe = alert.timeframe || '⏳';
    const type = alert.type || '📢';
    const parsedPrice = parseFloat(alert.price);
    const price = Number.isFinite(parsedPrice) ? parsedPrice.toFixed(2) : 'N/A';

    const chatId = global.choiEnabled ? config.TELEGRAM_CHAT_ID : config.TELEGRAM_CHAT_ID_A;
    const lang = getUserLang(chatId);
    const tz = getUserTimezone(chatId);

    const { date, clock } = isValidTs
      ? formatTimestamp(ts, lang, tz)
      : formatTimestamp(Math.floor(Date.now() / 1000), lang, tz);

    const message = generateAlertMessage({ type, symbol, timeframe, price, date, clock, lang });
    console.log('📥 Alert 수신:', { type, symbol, timeframe, price, ts, date, clock, lang });

    if (global.choiEnabled) {
      await axios.post(`https://api.telegram.org/bot${config.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        chat_id: config.TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML'
      });
    }

    await sendToMingBot(message);
    if (!res.headersSent) res.status(200).send('✅ 텔레그램 전송 성공');
  } catch (err) {
    console.error('❌ 텔레그램 전송 실패:', err.message);
    if (!res.headersSent) res.status(500).send('서버 오류');
  }
};
