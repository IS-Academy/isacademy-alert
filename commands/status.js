// ✅👇 commands/status.js (최종 안정화 버전 - 모든 내용 복원 + UI 유지 패치)

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
let isMenuOpened = false;

// ✅ 콜백 응답 전용 함수 (중복 제거용)
async function answerCallback(callbackQueryId, text) {
  await axios.post(`https://api.telegram.org/bot${config.ADMIN_BOT_TOKEN}/answerCallbackQuery`, {
    callback_query_id: callbackQueryId,
    text,
    show_alert: false
  });
}

// ✅ 관리자 액션 처리 (버튼 클릭 시 실행)
async function handleAdminAction(data, ctx) {
  const chatId = ctx.chat.id;
  const messageId = ctx.callbackQuery.message.message_id;
  const callbackQueryId = ctx.callbackQuery.id;

  let newText, newKeyboard, responseText;
  let shouldSendStatus = false;

  // ✅ 메뉴 전용 처리 (상태 토글 외)
  switch (data) {
    case 'lang_menu':
      newText = '🌐 언어 설정 대상 선택';
      newKeyboard = getLangMenuKeyboard();
      responseText = '✅ 언어 메뉴 열림';
      isMenuOpened = true;
      break;

    case 'choi_toggle':
      newText = '👨‍💼 최실장 켜기/끄기 선택';
      newKeyboard = getUserToggleKeyboard('choi');
      responseText = '✅ 최실장 설정 메뉴';
      isMenuOpened = true;
      break;

    case 'ming_toggle':
      newText = '👩‍💼 밍밍 켜기/끄기 선택';
      newKeyboard = getUserToggleKeyboard('ming');
      responseText = '✅ 밍밍 설정 메뉴';
      isMenuOpened = true;
      break;

    case 'symbol_toggle_menu':
      newText = '📊 자동매매 종목 설정 (ON/OFF)';
      newKeyboard = getSymbolToggleKeyboard();
      responseText = '✅ 종목 설정 메뉴 열림';
      isMenuOpened = true;
      break;

    case 'test_menu':
      newText = '🧪 템플릿 테스트 메뉴입니다';
      newKeyboard = getTemplateTestKeyboard();
      responseText = '✅ 테스트 메뉴 열림';
      isMenuOpened = true;
      break;

    case 'back_main':
      newText = '📋 관리자 메뉴로 돌아갑니다';
      newKeyboard = inlineKeyboard;
      responseText = '↩️ 메인 메뉴로 이동';
      isMenuOpened = false;
      shouldSendStatus = true;
      break;

    case 'choi_on':
      global.choiEnabled = true;
      responseText = '✅ 최실장 ON';
      isMenuOpened = false;
      shouldSendStatus = true;
      break;

    case 'choi_off':
      global.choiEnabled = false;
      responseText = '❌ 최실장 OFF';
      isMenuOpened = false;
      shouldSendStatus = true;
      break;

    case 'ming_on':
      global.mingEnabled = true;
      responseText = '✅ 밍밍 ON';
      isMenuOpened = false;
      shouldSendStatus = true;
      break;

    case 'ming_off':
      global.mingEnabled = false;
      responseText = '❌ 밍밍 OFF';
      isMenuOpened = false;
      shouldSendStatus = true;
      break;

    default:
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
          const msg = getTemplate({ type, symbol, timeframe, price, ts, entryCount: ratio || 0, entryAvg: avg || 'N/A', leverage, lang, direction });
          await sendTextToBot('admin', chatId, `📨 템플릿 테스트 결과 (${type})\n\n${msg}`);
        } catch (err) {
          await sendTextToBot('admin', chatId, `❌ 템플릿 오류: ${err.message}`);
        }
        return;
      }

      if (data.startsWith('lang_')) {
        const [_, bot, langCode] = data.split('_');
        const targetId = bot === 'choi' ? config.TELEGRAM_CHAT_ID : config.TELEGRAM_CHAT_ID_A;
        langManager.setUserLang(targetId, langCode);
        await sendTextToBot('admin', chatId, `✅ ${bot.toUpperCase()} 언어가 <b>${langCode}</b>로 변경되었습니다`);
        await answerCallback(callbackQueryId, '✅ 언어 설정 완료');
        return;
      }
  }

  if (newText && newKeyboard) {
    await editMessage('admin', chatId, messageId, newText, newKeyboard);
    await answerCallback(callbackQueryId, responseText);
  }

  if (shouldSendStatus) await sendBotStatus();
}

// ✅ 상태 메시지 전송
async function sendBotStatus(chatId = config.ADMIN_CHAT_ID, messageId = null, options = {}) {
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
  const key = `${chatId}_${choiEnabled}_${mingEnabled}_${langChoi}_${langMing}_${dummyKey}`;

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
    const sent = await editMessage('admin', chatId, messageId || getAdminMessageId(), statusMsg, inlineKeyboard, {
      parse_mode: 'HTML', ...options
    });
    if (sent?.data?.result?.message_id) setAdminMessageId(sent.data.result.message_id);
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
