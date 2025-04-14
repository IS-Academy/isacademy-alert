// ✅👇 commands/status.js

const { editMessage, inlineKeyboard, getLangKeyboard, getTemplateTestKeyboard, sendTextToBot, sendToAdmin } = require('../botManager');
const langManager = require('../langConfigManager');
const config = require('../config');
const {
  getLastDummyTime,
  setAdminMessageId,
  getAdminMessageId,
  getTimeString
} = require('../utils');
const { translations } = require('../lang');
const moment = require('moment-timezone');
const { getTemplate } = require('../MessageTemplates');

const cache = new Map();

const logMap = {
  'choi_on': '▶️ [상태 갱신: 최실장 ON]',
  'choi_off': '⏹️ [상태 갱신: 최실장 OFF]',
  'ming_on': '▶️ [상태 갱신: 밍밍 ON]',
  'ming_off': '⏹️ [상태 갱신: 밍밍 OFF]',
  'status': '📡 [상태 확인 요청]',
  'dummy_status': '🔁 [더미 상태 확인 요청]'
};

// ✅ 버튼 처리
async function handleAdminAction(data, ctx) {
  const chatId = ctx.chat.id;
  const messageId = ctx.callbackQuery.message.message_id;
  const callbackQueryId = ctx.callbackQuery.id;

  // ✅ 템플릿 테스트용 신호 선택 처리
  if (data.startsWith("test_template_")) {
    const type = data.replace("test_template_", "");
    const lang = langManager.getUserConfig(chatId)?.lang || 'ko';
    try {
      const msg = getTemplate({
        type,
        symbol: 'BTCUSDT.P',
        timeframe: '1',
        price: 62500,
        ts: Math.floor(Date.now() / 1000),
        entryCount: 1,
        entryAvg: '60000',
        leverage: 50,
        lang
      });
      await sendTextToBot('admin', chatId, `📨 템플릿 테스트 결과 (${type})\n\n${msg}`, null);
    } catch (err) {
      await sendTextToBot('admin', chatId, `❌ 템플릿 오류: ${err.message}`, null);
    }
    return;
  }
  
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

// ✅ 패널 전송
async function sendBotStatus(timeStr = getTimeString(), suffix = '', chatId = config.ADMIN_CHAT_ID, messageId = null, options = {}) {
  const now = moment().tz(config.DEFAULT_TIMEZONE);
  const nowTime = now.format('HH:mm:ss');

  const { choiEnabled, mingEnabled } = global;
  const configChoi = langManager.getUserConfig(config.TELEGRAM_CHAT_ID) || {};
  const configMing = langManager.getUserConfig(config.TELEGRAM_CHAT_ID_A) || {};
  const userConfig = langManager.getUserConfig(chatId) || {};

  const langChoi = configChoi.lang || 'ko';
  const langMing = configMing.lang || 'ko';
  const userLang = userConfig.lang || 'ko';
  const tz = userConfig.tz || config.DEFAULT_TIMEZONE;

  const key = `${chatId}_${suffix}_${choiEnabled}_${mingEnabled}_${langChoi}_${langMing}`;
  if (cache.get(key) === nowTime) {
    if (options.callbackQueryId) {
      const axios = require('axios');
      await axios.post(`https://api.telegram.org/bot${config.ADMIN_BOT_TOKEN}/answerCallbackQuery`, {
        callback_query_id: options.callbackQueryId,
        text: '⏱️ 최신 정보입니다.',
        show_alert: false
      });
    }

    if (suffix.startsWith('lang_choi')) {
      console.log('🌐 최실장 언어선택 패널 중복 생략');
    } else if (suffix.startsWith('lang_ming')) {
      console.log('🌐 밍밍 언어선택 패널 중복 생략');
    } else if (options.logMessage) {
      const cleaned = options.logMessage.replace(/^.*\[\s?|\s?\]$/g, '').trim();
      console.log(`⚠️ ${cleaned} 중복 생략`);
    } else {
      console.log('⚠️ 상태 메시지 중복 생략');
    }

    return;
  }

  cache.set(key, nowTime);

  // ✅ 언어별 타임존 + 이모지 매핑
  const langEmojiMap = { ko: '🇰🇷', en: '🇺🇸', jp: '🇯🇵', zh: '🇨🇳' };
  const langTzChoi = translations[langChoi]?.timezone || config.DEFAULT_TIMEZONE;
  const langTzMing = translations[langMing]?.timezone || config.DEFAULT_TIMEZONE;

  const langDisplay = (lang, tz) => {
    const emoji = langEmojiMap[lang] || '';
    return `<code>${lang}</code> ${emoji} | ${tz}`;
  };

  const dayTranslated = translations[userLang]?.days[now.day()] || now.format('ddd');
  const lastDummy = getLastDummyTime();
  console.log('🔍 getLastDummyTime():', lastDummy);
  
  const dummyMoment = moment(lastDummy, moment.ISO_8601, true).isValid() ? moment.tz(lastDummy, tz) : null;
  const elapsed = dummyMoment ? moment().diff(dummyMoment, 'minutes') : null;
  const dummyTimeFormatted = dummyMoment ? dummyMoment.format(`YY.MM.DD (${dayTranslated}) HH:mm:ss`) : '기록 없음';
  const elapsedText = elapsed !== null ? (elapsed < 1 ? '방금 전' : `+${elapsed}분 전`) : '';

  const keyboard = suffix === 'lang_choi' ? getLangKeyboard('choi') :
                   suffix === 'lang_ming' ? getLangKeyboard('ming') :
                   suffix === 'test_menu' ? getTemplateTestKeyboard() :
                   inlineKeyboard;

  const statusMsg = [
    `📡 <b>IS 관리자봇 패널</b>`,
    `──────────────────────`,
    `📍 <b>현재 상태:</b> 🕐 <code>${nowTime}</code>`,
    ``,
    `👨‍💼 최실장: ${choiEnabled ? '✅ ON' : '❌ OFF'} (${langDisplay(langChoi, langTzChoi)})`,
    `👩‍💼 밍밍: ${mingEnabled ? '✅ ON' : '❌ OFF'} (${langDisplay(langMing, langTzMing)})`,
    ``,
    `📅 <b>${now.format(`YY.MM.DD (${dayTranslated})`)}</b>`,
    `🛰 <b>더미 수신:</b> ${dummyMoment ? '♻️' : '❌'} <code>${dummyTimeFormatted}</code> ${elapsedText}`,
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
