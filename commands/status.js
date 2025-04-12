// ✅👇 commands/status.js

const { editMessage, inlineKeyboard, getLangKeyboard, sendTextToBot } = require('../botManager');
const langManager = require('../langConfigManager');
const config = require('../config');
const {
  getLastDummyTime,
  setAdminMessageId,
  getAdminMessageId,
  getTimeString,
  loadBotState
} = require('../utils');
const { translations } = require('../lang');
const moment = require('moment-timezone');

const cache = new Map();

// ✅ 버튼별 로그 메시지 매핑
const logMap = {
  'choi_on': '▶️ [상태 갱신: 최실장 ON]',
  'choi_off': '⏹️ [상태 갱신: 최실장 OFF]',
  'ming_on': '▶️ [상태 갱신: 밍밍 ON]',
  'ming_off': '⏹️ [상태 갱신: 밍밍 OFF]',
  'status': '📡 [상태 확인 요청]',
  'dummy_status': '🔁 [더미 상태 확인 요청]'
};

// ✅ 버튼 처리 핸들러
async function handleAdminAction(data, ctx) {
  const chatId = ctx.chat.id;
  const messageId = ctx.callbackQuery.message.message_id;
  const callbackQueryId = ctx.callbackQuery.id;

  let changed = false;

  switch (data) {
    case 'choi_on':
      if (!global.choiEnabled) { global.choiEnabled = true; changed = true; }
      break;
    case 'choi_off':
      if (global.choiEnabled) { global.choiEnabled = false; changed = true; }
      break;
    case 'ming_on':
      if (!global.mingEnabled) { global.mingEnabled = true; changed = true; }
      break;
    case 'ming_off':
      if (global.mingEnabled) { global.mingEnabled = false; changed = true; }
      break;
    default:
      changed = true;
      break;
  }

  if (!changed) {
    await editMessage('admin', chatId, messageId, '⏱️ 현재와 동일한 상태입니다.', null, {
      callbackQueryId,
      callbackResponse: '동일한 상태입니다.',
      logMessage: `${logMap[data] || '🧩 버튼'}`
    });
    return;
  }

  await sendBotStatus(undefined, data, chatId, messageId, {
    callbackQueryId,
    callbackResponse: '✅ 상태 갱신 완료',
    logMessage: logMap[data]
  });
}

// ✅ 상태 메시지 전송
async function sendBotStatus(timeStr = getTimeString(), suffix = '', chatId = config.ADMIN_CHAT_ID, messageId = null, options = {}) {
  const now = moment().tz(config.DEFAULT_TIMEZONE);
  const nowTime = now.format('HH:mm:ss');

  const key = `${chatId}_${suffix}_${global.choiEnabled}_${global.mingEnabled}`;

  if (cache.get(key) === nowTime) {
    // ✅ 캐시로 중복 생략 시 응답은 반드시 보냄 (버퍼링 방지)
    if (options.callbackQueryId) {
      const axios = require('axios');
      await axios.post(`https://api.telegram.org/bot${config.ADMIN_BOT_TOKEN}/answerCallbackQuery`, {
        callback_query_id: options.callbackQueryId,
        text: '⏱️ 이미 최신 상태입니다.',
        show_alert: false
      });
    }

    // ✅ 커스텀 로그 메시지
    if (options.logMessage) {
      const cleaned = options.logMessage.replace(/^.*\[\s?|\s?\]$/g, '').trim();
      console.log(`⚠️ ${cleaned} 중복 생략`);
    } else {
      console.log('⚠️ 상태 메시지 중복 생략');
    }

    return;
  }

  cache.set(key, nowTime);

  const { choiEnabled, mingEnabled } = global;

  const langChoi = langManager.getUserConfig(config.TELEGRAM_CHAT_ID)?.lang || 'ko';
  const langMing = langManager.getUserConfig(config.TELEGRAM_CHAT_ID_A)?.lang || 'ko';
  const userLang = langManager.getUserConfig(chatId)?.lang || 'ko';
  const tz = langManager.getUserConfig(chatId)?.tz || config.DEFAULT_TIMEZONE;

  const dayTranslated = translations[userLang]?.days[now.format('ddd')] || now.format('ddd');
  const lastDummy = getLastDummyTime();
  const dummyMoment = moment(lastDummy, moment.ISO_8601, true).isValid() ? moment.tz(lastDummy, tz) : null;
  const elapsed = dummyMoment ? moment().diff(dummyMoment, 'minutes') : null;
  const dummyTimeFormatted = dummyMoment ? dummyMoment.format(`YY.MM.DD (${dayTranslated}) HH:mm:ss`) : '기록 없음';
  const elapsedText = elapsed !== null ? (elapsed < 1 ? '방금 전' : `+${elapsed}분 전`) : '';

  const keyboard = suffix === 'lang_choi' ? getLangKeyboard('choi') :
                   suffix === 'lang_ming' ? getLangKeyboard('ming') :
                   inlineKeyboard;

  const statusMsg = [
    `📡 <b>IS 관리자봇 패널</b>`,
    `──────────────────────`,
    `📍 <b>현재 상태:</b> 🕐 <code>${nowTime}</code>`,
    ``,
    `👨‍💼 최실장: ${choiEnabled ? '✅ ON' : '❌ OFF'} (<code>${langChoi}</code>)`,
    `👩‍💼 밍밍: ${mingEnabled ? '✅ ON' : '❌ OFF'} (<code>${langMing}</code>)`,
    ``,
    `📅 <b>${now.format(`YY.MM.DD (${dayTranslated})`)}</b>`,
    `🛰 <b>더미 수신:</b> ${dummyMoment ? '✅' : '❌'} <code>${dummyTimeFormatted}</code> ${elapsedText}`,
    `──────────────────────`
  ].join('\n');

  try {
    const existingMessageId = messageId || getAdminMessageId();
    let sent;

    if (existingMessageId) {
      sent = await editMessage('admin', chatId, existingMessageId, statusMsg, keyboard, {
        ...options, parse_mode: 'HTML'
      });
      if (sent?.data?.result?.message_id) setAdminMessageId(sent.data.result.message_id);
    } else {
      sent = await sendTextToBot('admin', chatId, statusMsg, keyboard, {
        ...options, parse_mode: 'HTML'
      });
      if (sent?.data?.result?.message_id) setAdminMessageId(sent.data.result.message_id);
    }

    return sent;
  } catch (err) {
    console.error('⚠️ 관리자 패널 오류:', err.message);
    return null;
  }
}

// ✅ 초기화 함수
async function initAdminPanel() {
  const sent = await sendBotStatus();
  if (sent && sent.data?.result) {
    console.log('✅ 관리자 패널 초기화 성공');
  } else {
    console.warn('⚠️ 관리자 패널 초기화 시 메시지 결과 없음');
  }
}

module.exports = {
  sendBotStatus,
  initAdminPanel,
  handleAdminAction
};
