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
  getAdminMessageId
} = require('../utils');
const { translations } = require('../lang');
const moment = require('moment-timezone');
const { getTemplate } = require('../MessageTemplates');
const { getEntryInfo } = require('../entryManager');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const symbolsPath = path.join(__dirname, '../trader-gate/symbols.js');
const testTemplate = require('../handlers/testTemplateHandler');

const cache = new Map();

const axiosInstance = axios.create({
  timeout: 5000, // 요청 제한시간 5초
  httpAgent: new (require('http').Agent)({ keepAlive: true }), // Keep-Alive 설정
});

async function answerCallback(callbackQueryId, text = '✅ 처리 완료!') {
  try {
    return await axiosInstance.post(`https://api.telegram.org/bot${config.ADMIN_BOT_TOKEN}/answerCallbackQuery`, {
      callback_query_id: callbackQueryId,
      text,
      cache_time: 1,
    });
  } catch (err) {
    const desc = err.response?.data?.description || err.message;
    console.warn('⚠️ answerCallbackQuery 무시됨:', desc);
    if (!desc.includes('query is too old') && !desc.includes('query ID is invalid')) {
      throw err;
    }
  }
}

async function handleAdminAction(data, ctx) {
  const chatId = config.ADMIN_CHAT_ID;
  const messageId = getAdminMessageId(); // 직접 불러오기 최적화
  const callbackQueryId = ctx.callbackQuery.id;

  let newText, newKeyboard, responseText;

  switch (data) {
    case 'choi_toggle':
    case 'ming_toggle':
      const isChoi = data === 'choi_toggle';
      global[isChoi ? 'choiEnabled' : 'mingEnabled'] = !global[isChoi ? 'choiEnabled' : 'mingEnabled'];
      responseText = `${isChoi ? '👨‍💼 최실장' : '👩‍💼 밍밍'} ${global[isChoi ? 'choiEnabled' : 'mingEnabled'] ? '✅ ON' : '❌ OFF'}`;
      await Promise.all([
        sendBotStatus(chatId, messageId),
        answerCallback(callbackQueryId, responseText),
      ]);
      return;

    case 'lang_menu':
      newText = '🌐 언어 설정 대상 선택';
      newKeyboard = getLangMenuKeyboard(); // ⚠️ 관리자 키보드 바꾸는 동작
      responseText = '✅ 언어 메뉴 열림';
      break;

    case 'lang_choi':
    case 'lang_ming':
      newText = `🌐 ${data === 'lang_choi' ? '최실장' : '밍밍'} 언어 선택`;
      newKeyboard = getLangKeyboard(data.split('_')[1]); // ⚠️ 관리자 키보드 바꾸는 동작 + data.split
      responseText = '✅ 언어 선택 메뉴';
      break;
      
    case 'status':
    case 'dummy_status':
      await Promise.all([
        sendBotStatus(chatId, messageId),
        answerCallback(callbackQueryId, data === 'status' ? '✅ 최신 상태로 업데이트 완료' : '♻️ 더미 상태 최신화 완료')
      ]);
      return;

    case 'test_menu':
      newText = '🧪 템플릿 테스트 메뉴입니다';
      newKeyboard = getTemplateTestKeyboard(); // ⚠️ 관리자 키보드 바꾸는 동작
      responseText = '✅ 테스트 메뉴 열림';
      break;      

    case 'symbol_toggle_menu':
      newText = '📊 자동매매 종목 설정 (ON/OFF)';
      newKeyboard = getSymbolToggleKeyboard(); // ⚠️ 관리자 키보드 바꾸는 동작
      responseText = '✅ 종목 설정 메뉴 열림';
      break;

    case 'back_main':
      await Promise.all([
        sendBotStatus(chatId, messageId),
        answerCallback(callbackQueryId, '↩️ 메인 메뉴로 돌아갑니다')
      ]);
      return;

    default:
      if (data.startsWith('lang_') && data.split('_').length === 3) {
        const [_, bot, langCode] = data.split('_');
        langManager.setUserLang(bot === 'choi' ? config.TELEGRAM_CHAT_ID : config.TELEGRAM_CHAT_ID_A, langCode);

        await Promise.all([
          sendBotStatus(chatId, messageId),
          answerCallback(callbackQueryId, `✅ ${bot.toUpperCase()} 언어가 ${langCode.toUpperCase()}로 변경됨`)
        ]);
        return;
      }

      if (data.startsWith('test_template_')) {
        const type = data.replace('test_template_', '');

        try {
          await testTemplate(type); // ✅ 새로 만든 핸들러로 처리
          await answerCallback(callbackQueryId, '✅ 웹훅 방식 테스트 완료');
        } catch (err) {
          console.error('❌ 템플릿 테스트 오류:', err.message);
          await sendTextToBot('admin', config.ADMIN_CHAT_ID, `❌ 템플릿 오류: ${err.message}`);
          await answerCallback(callbackQueryId, '❌ 템플릿 테스트 실패');          
        }
        return;
      }

      if (data.startsWith('toggle_symbol_')) {
        const symbolKey = data.replace('toggle_symbol_', '').toLowerCase();
        const symbols = require('../trader-gate/symbols');
        if (symbols[symbolKey]) {
          symbols[symbolKey].enabled = !symbols[symbolKey].enabled;
          fs.writeFileSync(symbolsPath, `module.exports=${JSON.stringify(symbols,null,2)}`);
          await Promise.all([
            editMessage('admin', chatId, messageId, '📊 자동매매 종목 설정 (ON/OFF)', getSymbolToggleKeyboard()),
            answerCallback(callbackQueryId, `✅ ${symbolKey.toUpperCase()} 상태 변경됨`)
          ]);
        }
        return;
      }
  }

  if (newText && newKeyboard) {
    await Promise.all([
      editMessage('admin', chatId, messageId, newText, newKeyboard),
      answerCallback(callbackQueryId, responseText)
    ]);
  }
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

  const dummyMoment = moment(lastDummy, moment.ISO_8601, true).isValid()
    ? moment.tz(lastDummy, tz)
    : null;
  const elapsed = dummyMoment ? moment().diff(dummyMoment, 'minutes') : null;
  const dummyTimeFormatted = dummyMoment
    ? dummyMoment.format(`YY.MM.DD (${dayTranslated}) HH:mm:ss`)
    : '기록 없음';
  const elapsedText = elapsed !== null
    ? elapsed < 1
      ? '방금 전'
      : `+${elapsed}분 전`
    : '';

  if (options.callbackQueryId) {
    try {
      await axios.post(
        `https://api.telegram.org/bot${config.ADMIN_BOT_TOKEN}/answerCallbackQuery`,
        {
          callback_query_id: options.callbackQueryId,
          text: options.callbackResponse || '✅ 처리 완료!',
          show_alert: false,
          cache_time: 1, // 빠른 응답 속도 최적화
        }
      );
    } catch (err) {
      const desc = err.response?.data?.description || err.message;
      console.warn('⚠️ answerCallbackQuery 무시됨:', desc);
      if (
        !desc.includes('query is too old') &&
        !desc.includes('query ID is invalid')
      ) {
        throw err; // 다른 오류라면 다시 throw
      }
    }
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
    `──────────────────────`,
  ].join('\n');

  try {
    const sent = await editMessage(
      'admin',
      chatId,
      messageId || getAdminMessageId(),
      statusMsg,
      getDynamicInlineKeyboard(),
      { parse_mode: 'HTML' }
    );
    if (sent?.data?.result?.message_id) setAdminMessageId(sent.data.result.message_id);
    return sent;
  } catch (err) {
    console.error('⚠️ 관리자 패널 오류:', err.message);
  }
}

// ✅ 전역 인터벌 관리
let statusInterval; // ✅ 전역변수로 인터벌 저장

module.exports = {
  sendBotStatus,  
  initAdminPanel: async () => {
    if (statusInterval) clearInterval(statusInterval); // ✅ 기존 인터벌 제거
    const sent = await sendBotStatus();
    if (sent?.data?.result) {
      statusInterval = setInterval(sendBotStatus, 60000); // ✅ 1분마다 갱신
    }
  },
  handleAdminAction
};
