const {
  editMessage,
  inlineKeyboard,
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
const axios = require('axios');

const cache = new Map();
let isMenuOpened = false;

// ✅ 콜백 응답 단순화 함수
async function answerCallback(callbackQueryId, text) {
  await axios.post(`https://api.telegram.org/bot${config.ADMIN_BOT_TOKEN}/answerCallbackQuery`, {
    callback_query_id: callbackQueryId,
    text,
    show_alert: false
  });
}

async function handleAdminAction(data, ctx) {
  const chatId = ctx.chat.id;
  const messageId = ctx.callbackQuery.message.message_id;
  const callbackQueryId = ctx.callbackQuery.id;

  let newText, newKeyboard, responseText;
  let shouldSendStatus = false;

  switch (data) {
    case 'lang_menu':
      isMenuOpened = true;
      newText = '🌐 언어 설정 대상 선택';
      newKeyboard = getLangMenuKeyboard();
      responseText = '✅ 언어 메뉴 열림';
      break;

    case 'choi_toggle':
      isMenuOpened = true;
      newText = '👨‍💼 최실장 켜기/끄기 선택';
      newKeyboard = getUserToggleKeyboard('choi');
      responseText = '✅ 최실장 설정 메뉴';
      break;

    case 'ming_toggle':
      isMenuOpened = true;
      newText = '👩‍💼 밍밍 켜기/끄기 선택';
      newKeyboard = getUserToggleKeyboard('ming');
      responseText = '✅ 밍밍 설정 메뉴';
      break;

    case 'symbol_toggle_menu':
      isMenuOpened = true;
      newText = '📊 자동매매 종목 설정 (ON/OFF)';
      newKeyboard = getSymbolToggleKeyboard();
      responseText = '✅ 종목 설정 메뉴 열림';
      break;

    case 'test_menu':
      isMenuOpened = true;
      newText = '🧪 템플릿 테스트 메뉴입니다';
      newKeyboard = getTemplateTestKeyboard();
      responseText = '✅ 테스트 메뉴 열림';
      break;

    case 'back_main':
      isMenuOpened = false;
      newText = '📋 관리자 메뉴로 돌아갑니다';
      newKeyboard = inlineKeyboard;
      responseText = '↩️ 메인 메뉴로 이동';
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
          const msg = getTemplate({
            type, symbol, timeframe, price, ts,
            entryCount: typeof ratio === 'number' ? ratio : 0,
            entryAvg: typeof avg === 'number' ? avg : 'N/A',
            leverage, lang, direction
          });
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
    if (!shouldSendStatus) return;
  }

  if (shouldSendStatus) {
    await sendBotStatus(getTimeString(), data, chatId, messageId, {
      callbackQueryId,
      callbackResponse: responseText
    });
  }
}

async function initAdminPanel() {
  const sent = await sendBotStatus();
  if (sent && sent.data?.result) {
    console.log('✅ 관리자 패널 초기화 성공');
    setInterval(() => {
      if (!isMenuOpened) sendBotStatus();
    }, 60 * 1000);
  } else {
    console.warn('⚠️ 관리자 패널 초기화 시 메시지 결과 없음');
  }
}

module.exports = {
  sendBotStatus,
  initAdminPanel,
  handleAdminAction
};
