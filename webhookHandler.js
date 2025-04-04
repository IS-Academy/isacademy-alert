// webhookHandler.js
const dummyHandler = require('./dummyHandler');
const axios = require('axios');
const moment = require('moment-timezone');
const config = require('./config');
const langManager = require('./langConfigManager');
const langMessages = require('./langMessages');
const {
  generateAlertMessage,
  getWaitingMessage,
  sendToMingBot,
  sendTextToTelegram,
  editTelegramMessage,
  saveBotState,
  getInlineKeyboard,
  getLangKeyboard,
  getReplyKeyboard,
  getTzKeyboard,
  getLastDummyTime
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

module.exports = async function webhookHandler(req, res) {
  const update = req.body;

  // ✅ 0. 더미 헬스체크 핸들링
  if (req.originalUrl === '/dummy') {
    await dummyHandler(req, res);
    return;
  }
  
  // ✅ 1. 인라인 버튼 처리
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

      // 메인 패널 다시 출력
      const langChoi = getUserLang(config.TELEGRAM_CHAT_ID);
      const langMing = getUserLang(config.TELEGRAM_CHAT_ID_A);
      const statusMsg =
        `✅ 상태 (🕒 ${timeStr})\n` +
        `최실장: ${global.choiEnabled ? '✅ ON' : '⛔ OFF'} (${langChoi})\n` +
        `밍밍: ${global.mingEnabled ? '✅ ON' : '⛔ OFF'} (${langMing})`;

      await sendTextToTelegram(statusMsg, getInlineKeyboard());
      return;
    }

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
      const statusMsg =
        `✅ 상태 (🕒 ${timeStr})\n` +
        `최실장: ${global.choiEnabled ? '✅ ON' : '⛔ OFF'} (${langChoi})\n` +
        `밍밍: ${global.mingEnabled ? '✅ ON' : '⛔ OFF'} (${langMing})`;
      await editTelegramMessage(chatId, messageId, statusMsg, getInlineKeyboard());
      return;
    }
    if (cmd === 'dummy_status') {
      const timeStr = getTimeString(getUserTimezone(chatId));
      const lastDummy = getLastDummyTime();
      const msg = `🔁 마지막 더미 알림 수신 시간:\n${lastDummy} (🕒 현재시간: ${timeStr})`;
      await editTelegramMessage(chatId, messageId, msg, getInlineKeyboard());
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

    if (command.startsWith('/setlang')) {
      const input = command.split(' ')[1];
      if (!input) {
        await sendTextToTelegram('🌐 언어를 선택해주세요:', getReplyKeyboard('lang'));
        return;
      }
      const success = langManager.setUserLang(fromId, input);
      const msg = success
        ? langMessages.setLangSuccess[lang](input)
        : langMessages.setLangFail[lang];
      await sendTextToTelegram(`${msg} (🕒 ${timeStr})`);
      return;
    }

    if (command.startsWith('/settz')) {
      const input = command.split(' ')[1];
      if (!input) {
        await sendTextToTelegram('🕒 타임존을 선택해주세요:', getTzKeyboard());
        return;
      }
      const success = langManager.setUserTimezone(fromId, input);
      const msg = success
        ? langMessages.setTzSuccess[lang](input)
        : langMessages.setTzFail[lang];
      await sendTextToTelegram(`${msg} (🕒 ${timeStr})`);
      return;
    }

    // ✅ 관리자 명령어
    if (fromId.toString() === config.ADMIN_CHAT_ID) {
      const replyMap = {
        '/start': {
          ko: '🤖 IS 관리자봇에 오신 것을 환영합니다!',
          en: '🤖 Welcome to IS Admin Bot!',
          zh: '🤖 欢迎使用 IS 管理员机器人！',
          ja: '🤖 IS管理ボットへようこそ！'
        },
        '/help': {
          ko: '🛠 명령어: /최실장켜 /최실장꺼 /최실장상태 /밍밍켜 /밍밍꺼 /밍밍상태',
          en: '🛠 Commands: /choi_on /choi_off /choi_status /ming_on /ming_off /ming_status',
          zh: '🛠 命令: /choi_on /choi_off /choi_status /ming_on /ming_off /ming_status',
          ja: '🛠 コマンド: /choi_on /choi_off /choi_status /ming_on /ming_off /ming_status'
        }
      };

      const langStartMsg = replyMap['/start'][lang];
      const langHelpMsg = replyMap['/help'][lang];

      switch (command) {
        case '/start':
        case '/settings':
          const langChoi = getUserLang(config.TELEGRAM_CHAT_ID);
          const langMing = getUserLang(config.TELEGRAM_CHAT_ID_A);
          const statusMsg =
            `✅ 상태 (🕒 ${timeStr})\n` +
            `최실장: ${global.choiEnabled ? '✅ ON' : '⛔ OFF'} (${langChoi})\n` +
            `밍밍: ${global.mingEnabled ? '✅ ON' : '⛔ OFF'} (${langMing})`;
          await sendTextToTelegram(`${langStartMsg}\n\n${statusMsg}`, getInlineKeyboard());
          return;
        case '/help':
        case '/도움말':
          await sendTextToTelegram(langHelpMsg);
          return;
        case '/choi_on': global.choiEnabled = true; break;
        case '/choi_off': global.choiEnabled = false; break;
        case '/ming_on': global.mingEnabled = true; break;
        case '/ming_off': global.mingEnabled = false; break;
      }

      saveBotState({ choiEnabled: global.choiEnabled, mingEnabled: global.mingEnabled });

      if (command.includes('status')) {
        const statusMsg =
          `✅ 상태 (🕒 ${timeStr})\n` +
          `최실장: ${global.choiEnabled ? '✅ ON' : '⛔ OFF'}\n` +
          `밍밍: ${global.mingEnabled ? '✅ ON' : '⛔ OFF'}`;
        await sendTextToTelegram(statusMsg);
      } else {
        const statusMsg =
          `${command} 처리 완료 (🕒 ${timeStr})\n최실장: ${global.choiEnabled ? '✅ ON' : '⛔ OFF'}, 밍밍: ${global.mingEnabled ? '✅ ON' : '⛔ OFF'}`;
        await sendTextToTelegram(statusMsg);
      }
      return;
    }
  }

  // ✅ 3. 알림 메시지 처리
  try {
    const alert = req.body;
    const ts = Number(alert.ts);
    const isValidTs = Number.isFinite(ts) && ts > 0;
    const symbol = alert.symbol || 'Unknown';
    const timeframe = alert.timeframe || '⏳';
    const type = alert.type || '📢';
    const parsedPrice = parseFloat(alert.price);
    const price = Number.isFinite(parsedPrice) ? parsedPrice.toFixed(2) : 'N/A';
    const weight = alert.weight || '1%';
    const leverage = alert.leverage || '50×';
    const langChoi = getUserLang(config.TELEGRAM_CHAT_ID);
    const langMing = getUserLang(config.TELEGRAM_CHAT_ID_A);

    const msgChoi = type.startsWith('Ready_')
      ? getWaitingMessage(type, symbol, timeframe, weight, leverage, langChoi)
      : generateAlertMessage({ type, symbol, timeframe, price, ts, lang: langChoi });

    const msgMing = type.startsWith('Ready_')
      ? getWaitingMessage(type, symbol, timeframe, weight, leverage, langMing)
      : generateAlertMessage({ type, symbol, timeframe, price, ts, lang: langMing });

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
};
