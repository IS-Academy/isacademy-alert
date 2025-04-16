// ✅👇 commands/status.js

const {
  editMessage,
  getLangKeyboard,
  getLangMenuKeyboard,
  getUserToggleKeyboard,
  getSymbolToggleKeyboard,
  getTemplateTestKeyboard,
  sendTextToBot,
  getDynamicInlineKeyboard
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

async function answerCallback(callbackQueryId, text) {
  await axios.post(`https://api.telegram.org/bot${config.ADMIN_BOT_TOKEN}/answerCallbackQuery`, {
    callback_query_id: callbackQueryId,
    text,
    show_alert: false
  });
}

async function handleAdminAction(data, ctx) {
  const chatId = config.ADMIN_CHAT_ID;
  const messageId = ctx.callbackQuery.message.message_id;
  const callbackQueryId = ctx.callbackQuery.id;

  let newText, newKeyboard, responseText, shouldSendStatus = false;

  switch (data) {
    case 'choi_toggle':
      global.choiEnabled = !global.choiEnabled;
      responseText = `👨‍💼 최실장 ${global.choiEnabled ? '✅ ON' : '❌ OFF'}`;
      await sendBotStatus(chatId, getAdminMessageId(), { callbackQueryId, callbackResponse: responseText });
      break;

    case 'ming_toggle':
      global.mingEnabled = !global.mingEnabled;
      responseText = `👩‍💼 밍밍 ${global.mingEnabled ? '✅ ON' : '❌ OFF'}`;
      await sendBotStatus(chatId, getAdminMessageId(), { callbackQueryId, callbackResponse: responseText });
      break;

    case 'lang_menu':
      newText = '🌐 언어 설정 대상 선택';
      newKeyboard = getLangMenuKeyboard();
      responseText = '✅ 언어 메뉴 열림';
      break;

    case 'lang_choi':
    case 'lang_ming':
      newText = `🌐 ${data === 'lang_choi' ? '최실장' : '밍밍'} 언어 선택`;
      newKeyboard = getLangKeyboard(data.split('_')[1]);
      responseText = '✅ 언어 선택 메뉴';
      break;
      
    case 'status':
      await sendBotStatus(chatId, getAdminMessageId(), {
        callbackQueryId,
        callbackResponse: '✅ 최신 상태로 업데이트 완료'
      });
      break;

    case 'dummy_status':
      await sendBotStatus(chatId, getAdminMessageId(), {
        callbackQueryId,
        callbackResponse: '♻️ 더미 상태 최신화 완료'
      });
      break;

    case 'test_menu':
      newText = '🧪 템플릿 테스트 메뉴입니다';
      newKeyboard = getTemplateTestKeyboard();
      responseText = '✅ 테스트 메뉴 열림';
      break;      

    case 'symbol_toggle_menu':
      newText = '📊 자동매매 종목 설정 (ON/OFF)';
      newKeyboard = getSymbolToggleKeyboard();
      responseText = '✅ 종목 설정 메뉴 열림';
      break;

    case 'back_main':
      newText = '📋 관리자 메뉴로 돌아갑니다';
      newKeyboard = getDynamicInlineKeyboard(); // ✅ 명확히 수정
      responseText = '↩️ 메인 메뉴로 이동';
      shouldSendStatus = true;
      break;

    default:
      if (data.startsWith('lang_') && data.split('_').length === 3) {
        const [_, bot, langCode] = data.split('_');
        const targetId = bot === 'choi' ? config.TELEGRAM_CHAT_ID : config.TELEGRAM_CHAT_ID_A;
        langManager.setUserLang(targetId, langCode);

        await sendBotStatus(chatId, getAdminMessageId(), {
          callbackQueryId,
          callbackResponse: `✅ ${bot.toUpperCase()} 언어가 ${langCode.toUpperCase()}로 변경됨`
        });
        return;
      }

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

          // ✅ 메시지만 전송하고, 키보드나 패널 상태는 절대 바꾸지 않음
          await sendTextToBot('admin', chatId, `📨 템플릿 테스트 결과 (${type})\n\n${msg}`);

          // 🔑 추가: 콜백 응답 처리 (빠르게 깜빡임 종료)
          await axios.post(`https://api.telegram.org/bot${config.ADMIN_BOT_TOKEN}/answerCallbackQuery`, {
            callback_query_id: callbackQueryId,
            text: '✅ 템플릿 테스트 완료',
            show_alert: false,
            cache_time: 1
          });

        } catch (err) {
          await sendTextToBot('admin', chatId, `❌ 템플릿 오류: ${err.message}`);
        }
        return; // 🔥 필수 추가: 여기서 처리 종료하여 키보드 상태 변경을 차단
      }

      if (data.startsWith('toggle_symbol_')) {
        const symbolKey = data.replace('toggle_symbol_', '').toLowerCase();
        const symbols = require('../trader-gate/symbols');
        if (symbols[symbolKey]) {
          symbols[symbolKey].enabled = !symbols[symbolKey].enabled;
          fs.writeFileSync(symbolsPath, `module.exports = ${JSON.stringify(symbols, null, 2)}`);
          newText = '📊 자동매매 종목 설정 (ON/OFF)';
          newKeyboard = getSymbolToggleKeyboard();
          await editMessage('admin', config.ADMIN_CHAT_ID, messageId, newText, newKeyboard);
          await answerCallback(callbackQueryId, `✅ ${symbolKey.toUpperCase()} 상태 변경됨`);
        }
        return;
      }
  }

  if (typeof newText !== 'undefined' && typeof newKeyboard !== 'undefined') {
    await editMessage('admin', chatId, getAdminMessageId(), newText, newKeyboard, { // ✅ 여기도 반드시 getAdminMessageId()
      callbackQueryId, 
      callbackResponse: responseText
    });
  }

  if (shouldSendStatus) await sendBotStatus(undefined, data, chatId, getAdminMessageId(), { // ✅ 여기도 반드시 getAdminMessageId()
    callbackQueryId,
    callbackResponse: responseText
  });
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

  if (options.callbackQueryId) {
    await axios.post(`https://api.telegram.org/bot${config.ADMIN_BOT_TOKEN}/answerCallbackQuery`, {
      callback_query_id: options.callbackQueryId,
      text: options.callbackResponse || '✅ 처리 완료!',
      show_alert: false,
      cache_time: 1  // 빠른 응답 속도 최적화
    });
  }
  
  cache.set(key, nowTime);

  const langEmojiMap = { ko: '🇰🇷', en: '🇺🇸', jp: '🇯🇵', zh: '🇨🇳' };
  const langTzChoi = translations[langChoi]?.timezone || config.DEFAULT_TIMEZONE;
  const langTzMing = translations[langMing]?.timezone || config.DEFAULT_TIMEZONE;

  const langDisplay = (lang, tz) => {
    const emoji = langEmojiMap[lang] || '';
    return `<code>${lang}</code> ${emoji} | ${tz}`;
  };

  // ✅ 패널 메시지 조립
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
    const sent = await editMessage(
      'admin',
      chatId,
      messageId || getAdminMessageId(),
      statusMsg,
      getDynamicInlineKeyboard(), // ✅ 실시간 상태가 반영된 키보드 적용
      { parse_mode: 'HTML', ...options }
    );
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
