// ✅👇 commands/status.js (메뉴 처리 후 즉시 return 추가 완료)

const {
  editMessage,
  inlineKeyboard,
  getLangKeyboard,
  getLangMenuKeyboard,
  getUserToggleKeyboard,
  getSymbolToggleKeyboard,
  getTemplateTestKeyboard,
  sendTextToBot
} = require('../botManager');
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
const { getEntryInfo } = require('../entryManager');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const symbolsPath = path.join(__dirname, '../trader-gate/symbols.js');

const cache = new Map();

async function handleAdminAction(data, ctx) {
  const chatId = ctx.chat.id;
  const messageId = ctx.callbackQuery.message.message_id;
  const callbackQueryId = ctx.callbackQuery.id;

  // ✅ 메뉴 전용 처리 (상태 토글 외)
  if (data === 'lang_menu') {
    await editMessage('admin', chatId, messageId, '🌐 언어 설정 대상 선택', getLangMenuKeyboard());
    await axios.post(`https://api.telegram.org/bot${config.ADMIN_BOT_TOKEN}/answerCallbackQuery`, {
      callback_query_id: callbackQueryId,
      text: '✅ 언어 메뉴 열림', show_alert: false
    });
    return;
  }
  if (data === 'choi_toggle') {
    await editMessage('admin', chatId, messageId, '👨‍💼 최실장 켜기/끄기 선택', getUserToggleKeyboard('choi'));
    await axios.post(`https://api.telegram.org/bot${config.ADMIN_BOT_TOKEN}/answerCallbackQuery`, {
      callback_query_id: callbackQueryId,
      text: '✅ 최실장 설정 메뉴', show_alert: false
    });
    return;
  }
  if (data === 'ming_toggle') {
    await editMessage('admin', chatId, messageId, '👩‍💼 밍밍 켜기/끄기 선택', getUserToggleKeyboard('ming'));
    await axios.post(`https://api.telegram.org/bot${config.ADMIN_BOT_TOKEN}/answerCallbackQuery`, {
      callback_query_id: callbackQueryId,
      text: '✅ 밍밍 설정 메뉴', show_alert: false
    });
    return;
  }
  if (data === 'symbol_toggle_menu') {
    await editMessage('admin', chatId, messageId, '📊 자동매매 종목 설정 (ON/OFF)', getSymbolToggleKeyboard());
    await axios.post(`https://api.telegram.org/bot${config.ADMIN_BOT_TOKEN}/answerCallbackQuery`, {
      callback_query_id: callbackQueryId,
      text: '✅ 종목 설정 메뉴 열림', show_alert: false
    });
    return;
  }
  if (data === 'test_menu') {
    await editMessage('admin', chatId, messageId, '🧪 템플릿 테스트 메뉴입니다', getTemplateTestKeyboard());
    await axios.post(`https://api.telegram.org/bot${config.ADMIN_BOT_TOKEN}/answerCallbackQuery`, {
      callback_query_id: callbackQueryId,
      text: '✅ 테스트 메뉴 열림', show_alert: false
    });
    return;
  }
  if (data === 'back_main') {
    await editMessage('admin', chatId, messageId, '📋 관리자 메뉴로 돌아갑니다', inlineKeyboard);
    await axios.post(`https://api.telegram.org/bot${config.ADMIN_BOT_TOKEN}/answerCallbackQuery`, {
      callback_query_id: callbackQueryId,
      text: '↩️ 메인 메뉴로 이동', show_alert: false
    });
    return;
  }

  // ✅ 템플릿 테스트 처리
  if (data.startsWith('test_template_')) {
    const type = data.replace('test_template_', '');
    const lang = langManager.getUserConfig(chatId)?.lang || 'ko';
    const isShort = type.endsWith('Short');
    const direction = isShort ? 'short' : 'long';
    const symbol = 'btcusdt.p';
    const timeframe = '1';
    const ts = Math.floor(Date.now() / 1000);
    const price = 62500;
    const leverage = 50;
    const { entryAvg: avg, entryCount: ratio } = getEntryInfo(symbol, type, timeframe);

    try {
      const msg = getTemplate({
        type,
        symbol,
        timeframe,
        price,
        ts,
        entryCount: typeof ratio === 'number' ? ratio : 0,
        entryAvg: typeof avg === 'number' ? avg : 'N/A',
        leverage,
        lang,
        direction
      });
      await sendTextToBot('admin', chatId, `📨 템플릿 테스트 결과 (${type})\n\n${msg}`, null);
    } catch (err) {
      await sendTextToBot('admin', chatId, `❌ 템플릿 오류: ${err.message}`, null);
    }
    return;
  }

  // ✅ 언어 변경
  if (data.startsWith('lang_')) {
    const [_, bot, langCode] = data.split('_');
    const targetId = bot === 'choi' ? config.TELEGRAM_CHAT_ID : config.TELEGRAM_CHAT_ID_A;
    langManager.setUserLang(targetId, langCode);
    await sendTextToBot('admin', chatId, `✅ ${bot.toUpperCase()} 언어가 <b>${langCode}</b>로 변경되었습니다`, null);
    return;
  }

  // ✅ 상태 토글
  if (data === 'choi_on') global.choiEnabled = true;
  if (data === 'choi_off') global.choiEnabled = false;
  if (data === 'ming_on') global.mingEnabled = true;
  if (data === 'ming_off') global.mingEnabled = false;

  await sendBotStatus(getTimeString(), data, chatId, messageId, {
    callbackQueryId,
    callbackResponse: '✅ 상태 갱신 완료'
  });
}

// ✅ 상태 패널 메시지 전송 함수
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

  const dayTranslated = translations[userLang]?.days[now.day()] || now.format('ddd');
  const lastDummy = getLastDummyTime();
  const dummyKey = lastDummy || 'no-dummy';
  const key = `${chatId}_${suffix}_${choiEnabled}_${mingEnabled}_${langChoi}_${langMing}_${dummyKey}`;

  const dummyMoment = moment(lastDummy, moment.ISO_8601, true).isValid() ? moment.tz(lastDummy, tz) : null;
  const elapsed = dummyMoment ? moment().diff(dummyMoment, 'minutes') : null;
  const dummyTimeFormatted = dummyMoment ? dummyMoment.format(`YY.MM.DD (${dayTranslated}) HH:mm:ss`) : '기록 없음';
  const elapsedText = elapsed !== null ? (elapsed < 1 ? '방금 전' : `+${elapsed}분 전`) : '';

  if (cache.get(key) === nowTime) {
    if (options.callbackQueryId) {
      await axios.post(`https://api.telegram.org/bot${config.ADMIN_BOT_TOKEN}/answerCallbackQuery`, {
        callback_query_id: options.callbackQueryId,
        text: '⏱️ 최신 정보입니다.',
        show_alert: false
      });
    }
    return;
  }

  cache.set(key, nowTime);

  const langEmojiMap = { ko: '🇰🇷', en: '🇺🇸', jp: '🇯🇵', zh: '🇨🇳' };
  const langTzChoi = translations[langChoi]?.timezone || config.DEFAULT_TIMEZONE;
  const langTzMing = translations[langMing]?.timezone || config.DEFAULT_TIMEZONE;

  const langDisplay = (lang, tz) => {
    const emoji = langEmojiMap[lang] || '';
    return `<code>${lang}</code> ${emoji} | ${tz}`;
  };

  const keyboard = inlineKeyboard;

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

module.exports = {
  sendBotStatus,
  initAdminPanel: async () => {
    const sent = await sendBotStatus();
    if (sent && sent.data?.result) {
      console.log('✅ 관리자 패널 초기화 성공');
      setInterval(() => {
        sendBotStatus(undefined, '', config.ADMIN_CHAT_ID);
      }, 60 * 1000);
    } else {
      console.warn('⚠️ 관리자 패널 초기화 시 메시지 결과 없음');
    }
  },
  handleAdminAction
};
