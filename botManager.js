//✅👇 botManager.js

const axios = require('axios');
const config = require('./config');
const axiosInstance = axios.create({
  timeout: 5000,
  httpAgent: new (require('http').Agent)({ keepAlive: true }),
});

// ✅ 콜백 응답
async function answerCallback(callbackQueryId, text = '✅ 처리 완료!') {
  return axiosInstance.post(`https://api.telegram.org/bot${config.ADMIN_BOT_TOKEN}/answerCallbackQuery`, {
    callback_query_id: callbackQueryId,
    text,
    cache_time: 1,
  });
}

// ✅ 동적 관리자 인라인 키보드 패널
function getDynamicInlineKeyboard() {
  const choiState = global.choiEnabled ? '✅' : '❌';
  const mingState = global.mingEnabled ? '✅' : '❌';
  const engState  = global.englishEnabled ? '✅' : '❌';
  const cnState   = global.chinaEnabled ? '✅' : '❌';
  const jpState   = global.japanEnabled ? '✅' : '❌';

  return {
    inline_keyboard: [
      [{ text: `👨‍💼 최실장 ${choiState}`, callback_data: 'choi_toggle' }, { text: `👩‍💼 밍밍 ${mingState}`, callback_data: 'ming_toggle' }],
      [{ text: `🌍 영어 ${engState}`, callback_data: 'english_toggle' }, { text: `🇨🇳 중국 ${cnState}`, callback_data: 'china_toggle' }, { text: `🇯🇵 일본 ${jpState}`, callback_data: 'japan_toggle' }],
      [{ text: '🌐 언어선택', callback_data: 'lang_menu' }],
      [{ text: '📡 상태 확인', callback_data: 'status' }, { text: '🔁 더미 상태', callback_data: 'dummy_status' }],
      [{ text: '🧪 템플릿 테스트', callback_data: 'test_menu' }],
      [{ text: '📊 종목 ON/OFF 관리', callback_data: 'symbol_toggle_menu' }]
    ]
  };
}

// ✅ 언어 선택 하위 메뉴
function getLangMenuKeyboard() {
  return {
    inline_keyboard: [
      [{ text: '🌐 최실장 언어', callback_data: 'lang_choi' }, { text: '🌐 밍밍 언어', callback_data: 'lang_ming' }],
      [{ text: '🔙 돌아가기', callback_data: 'back_main' }]
    ]
  };
}

// 🌐 언어 선택 키보드 (최실장 or 밍밍)
function getLangKeyboard(bot) {
  return {
    inline_keyboard: [[
      { text: '🇰🇷 한국어', callback_data: `lang_${bot}_ko` },
      { text: '🇺🇸 English', callback_data: `lang_${bot}_en` },
      { text: '🇨🇳 中文', callback_data: `lang_${bot}_zh` },
      { text: '🇯🇵 日本語', callback_data: `lang_${bot}_jp` }
    ], [{ text: '🔙 돌아가기', callback_data: 'lang_menu' }]]
  };
}

// ✅ 사용자 토글 메뉴 (ON/OFF)
function getUserToggleKeyboard(target) {
  return {
    inline_keyboard: [[
      { text: '▶️ 켜기', callback_data: `${target}_on` },
      { text: '⏹️ 끄기', callback_data: `${target}_off` }
    ], [{ text: '🔙 돌아가기', callback_data: 'back_main' }]]
  };
}

// ✅ 종목 ON/OFF 전환용 인라인 키보드 생성
function getSymbolToggleKeyboard() {
  const symbols = require('./trader-gate/symbols');
  const buttons = Object.entries(symbols).map(([symbol, info]) => ([{
    text: `${info.enabled ? '✅' : '❌'} ${symbol.toUpperCase()}`,
    callback_data: `toggle_symbol_${symbol}`
  }]));
  buttons.push([{ text: '🔙 돌아가기', callback_data: 'back_main' }]);
  return { inline_keyboard: buttons };
}

// ✅ 템플릿 테스트용 인라인 키보드
function getTemplateTestKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: '💰롱 청산📈', callback_data: 'test_template_exitLong' },
        { text: '💰숏 청산📉', callback_data: 'test_template_exitShort' }
      ],
      [
        { text: '💲롱 청산 준비📈', callback_data: 'test_template_Ready_exitLong' },
        { text: '💲숏 청산 준비📉', callback_data: 'test_template_Ready_exitShort' }
      ],
      [
        { text: '🚀강한 롱 진입📈', callback_data: 'test_template_isBigSup' },
        { text: '🛸강한 숏 진입📉', callback_data: 'test_template_isBigRes' }
      ],
      [
        { text: '🩵롱 진입📈', callback_data: 'test_template_showSup' },
        { text: '❤️숏 진입📉', callback_data: 'test_template_showRes' }
      ],
      [
        { text: '🚀강한 롱 대기📈', callback_data: 'test_template_Ready_isBigSup' },
        { text: '🛸강한 숏 대기📉', callback_data: 'test_template_Ready_isBigRes' }
      ],
      [
        { text: '🩵롱 대기📈', callback_data: 'test_template_Ready_showSup' },
        { text: '❤️숏 대기📉', callback_data: 'test_template_Ready_showRes' }
      ],
      // 👇 돌아가기 버튼 추가
      [
        { text: '🔙 돌아가기', callback_data: 'back_main' }
      ]
    ]
  };
}

// ✅ botType에 따라 토큰과 chatId 자동 분기
function getTokenAndChatId(botType) {
  return {
    token: botType === 'choi'   ? config.TELEGRAM_BOT_TOKEN :
           botType === 'ming'   ? config.TELEGRAM_BOT_TOKEN_A :
           botType === 'global' ? config.TELEGRAM_BOT_TOKEN_GLOBAL :
           botType === 'china'  ? config.TELEGRAM_BOT_TOKEN_CHINA :
           botType === 'japan'  ? config.TELEGRAM_BOT_TOKEN_JAPAN :
           config.ADMIN_BOT_TOKEN,

    chatId: botType === 'choi'   ? config.TELEGRAM_CHAT_ID :
            botType === 'ming'   ? config.TELEGRAM_CHAT_ID_A :
            botType === 'global' ? config.TELEGRAM_CHAT_ID_GLOBAL :
            botType === 'china'  ? config.TELEGRAM_CHAT_ID_CHINA :
            botType === 'japan'  ? config.TELEGRAM_CHAT_ID_JAPAN :
            config.ADMIN_CHAT_ID
  };
}

// ✅ 텔레그램 메시지 전송
async function sendTextToBot(botType, _, text, replyMarkup = null, options = {}) {
  const { token, chatId } = getTokenAndChatId(botType);

  try {
    const response = await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
      chat_id: chatId,
      text,
      parse_mode: options.parse_mode || 'HTML',
      reply_markup: replyMarkup || undefined
    });

    if (options.callbackQueryId) {
      await axios.post(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
        callback_query_id: options.callbackQueryId,
        text: options.callbackResponse || '',
        show_alert: false
      });
    }

    return response;
  } catch (err) {
    console.error(`❌ sendTextToBot 실패 (${botType}):`, err.response?.data || err.message);
    throw err;
  }
}

// ✅ 메시지 수정
async function editMessage(botType, chatId, messageId, text, replyMarkup = null, options = {}) {
  const token = config.ADMIN_BOT_TOKEN;

  try {
    const response = await axios.post(`https://api.telegram.org/bot${token}/editMessageText`, {
      chat_id: chatId,
      message_id: messageId,
      text,
      parse_mode: options.parse_mode || 'HTML',
      reply_markup: replyMarkup || undefined
    });

    if (options.callbackQueryId) {
      await axios.post(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
        callback_query_id: options.callbackQueryId,
        text: options.callbackResponse || '',
        show_alert: false
      });
    }

    return response;
  } catch (err) {
    const errorMsg = err.response?.data?.description || err.message;
    if (errorMsg.includes('message is not modified')) {
      return { data: { result: true } };
    } else if (errorMsg.includes('message to edit not found')) {
      const { chatId: fallbackChatId } = getTokenAndChatId(botType);
      return await sendTextToBot(botType, fallbackChatId, text, replyMarkup, options);
    } else {
      console.error('❌ editMessage 실패:', errorMsg);
      throw err;
    }
  }
}

// ✅ 역할별 전송 함수
const sendToAdmin   = (text, replyMarkup = null, options = {}) => sendTextToBot('admin', null, text, replyMarkup, options);
const sendToChoi    = (text, replyMarkup = null, options = {}) => sendTextToBot('choi', null, text, replyMarkup, options);
const sendToMing    = (text, replyMarkup = null, options = {}) => sendTextToBot('ming', null, text, replyMarkup, options);
const sendToEnglish = (text, replyMarkup = null, options = {}) => sendTextToBot('global', null, text, replyMarkup, options);
const sendToChina   = (text, replyMarkup = null, options = {}) => sendTextToBot('china', null, text, replyMarkup, options);
const sendToJapan   = (text, replyMarkup = null, options = {}) => sendTextToBot('japan', null, text, replyMarkup, options);

//🧩 export 모듈
module.exports = {
  editMessage,
  sendTextToBot,
  sendToChoi,
  sendToMing,
  sendToAdmin,
  sendToEnglish,
  sendToChina,
  sendToJapan,
  getSymbolToggleKeyboard,
  getDynamicInlineKeyboard,
  getLangKeyboard,
  getLangMenuKeyboard,
  getTemplateTestKeyboard,
  getUserToggleKeyboard,
  answerCallback
};
