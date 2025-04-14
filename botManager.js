// ✅👇 botManager.js

const axios = require('axios');
const config = require('./config');

// ✅ 관리자 인라인 키보드 패널
const inlineKeyboard = {
  inline_keyboard: [
    [{ text: '▶️ 최실장 켜기', callback_data: 'choi_on' }, { text: '⏹️ 최실장 끄기', callback_data: 'choi_off' }],
    [{ text: '▶️ 밍밍 켜기', callback_data: 'ming_on' }, { text: '⏹️ 밍밍 끄기', callback_data: 'ming_off' }],
    [{ text: '🌐 최실장 언어선택', callback_data: 'lang_choi' }, { text: '🌐 밍밍 언어선택', callback_data: 'lang_ming' }],
    [{ text: '📡 상태 확인', callback_data: 'status' }, { text: '🔁 더미 상태', callback_data: 'dummy_status' }]
    [{ text: '🧪 템플릿 테스트 메뉴', callback_data: 'test_menu' }]
  ]
};

// ✅ 하단 키보드
const mainKeyboard = {
  keyboard: [['🌐 최실장 언어선택', '🌐 밍밍 언어선택'], ['📡 상태 확인', '🔁 더미 상태']],
  resize_keyboard: true
};

// 🌐 언어선택용 키보드
function getLangKeyboard(bot) {
  return {
    inline_keyboard: [[
      { text: '🇰🇷 한국어', callback_data: `lang_${bot}_ko` },
      { text: '🇺🇸 English', callback_data: `lang_${bot}_en` },
      { text: '🇨🇳 中文', callback_data: `lang_${bot}_zh` },
      { text: '🇯🇵 日本語', callback_data: `lang_${bot}_jp` }
    ]]
  };
}

// ✅ 템플릿 테스트용 인라인 키보드
function getTemplateTestKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: '🟢 showSup', callback_data: 'test_template_showSup' },
        { text: '🔴 showRes', callback_data: 'test_template_showRes' },
        { text: '🚀 isBigSup', callback_data: 'test_template_isBigSup' },
        { text: '🛸 isBigRes', callback_data: 'test_template_isBigRes' }
      ],
      [
        { text: '💰 exitLong', callback_data: 'test_template_exitLong' },
        { text: '💰 exitShort', callback_data: 'test_template_exitShort' }
      ],
      [
        { text: '🟢 Ready_showSup', callback_data: 'test_template_Ready_showSup' },
        { text: '🔴 Ready_showRes', callback_data: 'test_template_Ready_showRes' }
      ],
      [
        { text: '🚀 Ready_isBigSup', callback_data: 'test_template_Ready_isBigSup' },
        { text: '🛸 Ready_isBigRes', callback_data: 'test_template_Ready_isBigRes' }
      ],
      [
        { text: '💲 Ready_exitLong', callback_data: 'test_template_Ready_exitLong' },
        { text: '💲 Ready_exitShort', callback_data: 'test_template_Ready_exitShort' }
      ]
    ]
  };
}

// 📨 메시지 전송
async function sendTextToBot(botType, chatId, text, replyMarkup = null, options = {}) {
  const token = botType === 'choi' ? config.TELEGRAM_BOT_TOKEN :
                botType === 'ming' ? config.TELEGRAM_BOT_TOKEN_A :
                config.ADMIN_BOT_TOKEN;

  console.log(`📤 [sendTextToBot 호출됨] botType=${botType}, chatId=${chatId}`);

  try {
    const response = await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
      chat_id: chatId,
      text,
      parse_mode: options.parse_mode || 'HTML',
      reply_markup: replyMarkup || undefined
    });

    if (!response.data.ok) {
      throw new Error(`Telegram 응답 오류: ${response.data.error_code} - ${response.data.description}`);
    }

    return response;
  } catch (err) {
    console.error(`❌ sendTextToBot 실패 (${botType}):`, err.response?.data || err.message);
    throw err; // 반드시 에러를 상위로 전달
  }
}

// ✏️ 메시지 수정
async function editMessage(botType, chatId, messageId, text, replyMarkup = null, options = {}) {
  const token = config.ADMIN_BOT_TOKEN;

  if (options.verbose) {
    console.log(`✏️ [editMessage 호출됨] botType=${botType}, chatId=${chatId}, messageId=${messageId}`);
  }

  try {
    const response = await axios.post(`https://api.telegram.org/bot${token}/editMessageText`, {
      chat_id: chatId,
      message_id: messageId,
      text,
      parse_mode: options.parse_mode || 'HTML',
      reply_markup: replyMarkup || inlineKeyboard
    });

    if (!response.data.ok) {
      throw new Error(`Telegram 수정 응답 오류: ${response.data.error_code} - ${response.data.description}`);
    }

    // ✅ 로그 메시지 출력
    if (options.logMessage) {
      console.log(options.logMessage);
    }

    return response;
  } catch (err) {
    const errorMsg = err.response?.data?.description || err.message;

    if (errorMsg.includes('message is not modified')) {
      console.log('🔹 editMessage: 변경 사항 없음');
      return { data: { result: true } }; // 이 경우는 오류가 아님.
    } else if (errorMsg.includes('message to edit not found')) {
      console.warn('🔸 editMessage: 메시지 없음, 신규 메시지 전송');
      return await sendTextToBot(botType, chatId, text, replyMarkup, options);
    } else {
      console.error('❌ editMessage 실패:', errorMsg);
      throw err; // 명확한 에러는 전달
    }
  }
}

// 📤 각 대상별 메시지 전송
const sendToAdmin = (text, keyboard = mainKeyboard) => sendTextToBot('admin', config.ADMIN_CHAT_ID, text, keyboard);
const sendToChoi = (text) => sendTextToBot('choi', config.TELEGRAM_CHAT_ID, text);
const sendToMing = (text) => sendTextToBot('ming', config.TELEGRAM_CHAT_ID_A, text);

// 🧩 export 모듈
module.exports = {
  sendToAdmin,
  sendToChoi,
  sendToMing,
  editMessage,
  inlineKeyboard,
  mainKeyboard,
  getLangKeyboard,
  getTemplateTestKeyboard,
  sendTextToBot
};
