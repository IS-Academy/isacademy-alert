// ✅👇 botManager.js

const axios = require('axios');
const config = require('./config');

// invisible noise 문자 (zero-width space)
function addInvisibleNoise(text) {
  return text + '\u200B';
}

// 매 호출마다 변경되는 키보드 생성
function getDynamicInlineKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: addInvisibleNoise('▶️ 최실장 켜기'), callback_data: 'choi_on' },
        { text: addInvisibleNoise('⏹️ 최실장 끄기'), callback_data: 'choi_off' }
      ],
      [
        { text: addInvisibleNoise('▶️ 밍밍 켜기'), callback_data: 'ming_on' },
        { text: addInvisibleNoise('⏹️ 밍밍 끄기'), callback_data: 'ming_off' }
      ],
      [
        { text: addInvisibleNoise('🌐 최실장 언어선택'), callback_data: 'lang_choi' },
        { text: addInvisibleNoise('🌐 밍밍 언어선택'), callback_data: 'lang_ming' }
      ],
      [
        { text: addInvisibleNoise('📡 상태 확인'), callback_data: 'status' },
        { text: addInvisibleNoise('🔁 더미 상태'), callback_data: 'dummy_status' }
      ]
    ]
  };
}

const mainKeyboard = {
  keyboard: [['🌐 최실장 언어선택', '🌐 밍밍 언어선택'], ['📡 상태 확인', '🔁 더미 상태']],
  resize_keyboard: true
};

function getLangKeyboard(bot) {
  return {
    inline_keyboard: [[
      { text: '🇰🇷 한국어', callback_data: `lang_${bot}_ko` },
      { text: '🇺🇸 English', callback_data: `lang_${bot}_en` },
      { text: '🇨🇳 中文', callback_data: `lang_${bot}_zh` },
      { text: '🇯🇵 日本語', callback_data: `lang_${bot}_ja` }
    ]]
  };
}

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
    throw err;
  }
}

async function editMessage(botType, chatId, messageId, text, replyMarkup = null, options = {}) {
  const token = config.ADMIN_BOT_TOKEN;
  const now = new Date().toLocaleTimeString('ko-KR', { hour12: false });

  // 텍스트 뒤에 HTML 주석 추가
  const renderedText = `${text}\n<!-- updated: ${now} -->`;

  // replyMarkup이 없으면 동적 키보드 사용
  const dynamicKeyboard = replyMarkup || getDynamicInlineKeyboard();

  console.log(`✏️ [editMessage 호출됨] botType=${botType}, chatId=${chatId}, messageId=${messageId}`);

  try {
    const response = await axios.post(`https://api.telegram.org/bot${token}/editMessageText`, {
      chat_id: chatId,
      message_id: messageId,
      text: renderedText,
      parse_mode: options.parse_mode || 'HTML',
      reply_markup: dynamicKeyboard
    });

    if (!response.data.ok) {
      throw new Error(`Telegram 수정 응답 오류: ${response.data.error_code} - ${response.data.description}`);
    }

    return response;
  } catch (err) {
    const errorMsg = err.response?.data?.description || err.message;

    if (errorMsg.includes('message is not modified')) {
      console.log('🔹 editMessage: 변경 사항 없음');
      return { data: { result: true } };
    } else if (errorMsg.includes('message to edit not found')) {
      console.warn('🔸 editMessage: 메시지 없음, 신규 메시지 전송');
      return await sendTextToBot(botType, chatId, text, replyMarkup, options);
    } else {
      console.error('❌ editMessage 실패:', errorMsg);
      throw err;
    }
  }
}

const sendToAdmin = (text, keyboard = mainKeyboard) => sendTextToBot('admin', config.ADMIN_CHAT_ID, text, keyboard);
const sendToChoi = (text) => sendTextToBot('choi', config.TELEGRAM_CHAT_ID, text);
const sendToMing = (text) => sendTextToBot('ming', config.TELEGRAM_CHAT_ID_A, text);

module.exports = {
  sendToAdmin,
  sendToChoi,
  sendToMing,
  editMessage,
  mainKeyboard,
  getLangKeyboard,
  getDynamicInlineKeyboard,
  sendTextToBot
};
