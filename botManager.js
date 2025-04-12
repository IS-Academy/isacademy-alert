// ✅👇 botManager.js

const axios = require('axios');
const config = require('./config');

const inlineKeyboard = {
  inline_keyboard: [
    [{ text: '▶️ 최실장 켜기', callback_data: 'choi_on' }, { text: '⏹️ 최실장 끄기', callback_data: 'choi_off' }],
    [{ text: '▶️ 밍밍 켜기', callback_data: 'ming_on' }, { text: '⏹️ 밍밍 끄기', callback_data: 'ming_off' }],
    [{ text: '🌐 최실장 언어선택', callback_data: 'lang_choi' }, { text: '🌐 밍밍 언어선택', callback_data: 'lang_ming' }],
    [{ text: '📡 상태 확인', callback_data: 'status' }, { text: '🔁 더미 상태', callback_data: 'dummy_status' }]
  ]
};

const mainKeyboard = {
  keyboard: [['🌐 최실장 언어선택', '🌐 밍밍 언어선택'], ['📡 상태 확인', '🔁 더미 상태']],
  resize_keyboard: true
};

function addInvisibleNoise(text) {
  return text + '\u200B';
}

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

  try {
    const response = await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
      chat_id: chatId,
      text,
      parse_mode: options.parse_mode || 'HTML',
      reply_markup: replyMarkup || undefined
    });

    return response;
  } catch (err) {
    console.error(`❌ sendTextToBot 실패 (${botType}):`, err.response?.data || err.message);
    throw err;
  }
}

async function editMessage(botType, chatId, messageId, text, replyMarkup = null, options = {}) {
  const token = config.ADMIN_BOT_TOKEN;
  const renderedText = `${text}\u200B`; // zero-width space 추가
  const markup = replyMarkup || getDynamicInlineKeyboard();

  try {
    const response = await axios.post(`https://api.telegram.org/bot${token}/editMessageText`, {
      chat_id: chatId,
      message_id: messageId,
      text: renderedText,
      parse_mode: options.parse_mode || 'HTML',
      reply_markup: markup
    });

    // ✅ 버튼 응답
    if (options.callbackQueryId) {
      await axios.post(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
        callback_query_id: options.callbackQueryId,
        text: options.callbackResponse || '✅ 상태가 갱신되었습니다.',
        show_alert: false
      });
    }

    // ✅ 사용자 지정 로그만 출력
    if (options.logMessage) {
      console.log(`📌 ${options.logMessage}`);
    }

    return response;

  } catch (err) {
    const errorMsg = err.response?.data?.description || err.message;

    if (errorMsg.includes('message is not modified')) {
      if (options.callbackQueryId) {
        await axios.post(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
          callback_query_id: options.callbackQueryId,
          text: '⏱️ 이미 최신 상태입니다.',
          show_alert: false
        });
      }

      if (options.logMessage) {
        console.log(`📌 ${options.logMessage} (중복 생략됨)`);
      }

      return { data: { result: true } };
    }

    if (errorMsg.includes('message to edit not found')) {
      return await sendTextToBot(botType, chatId, text, markup, options);
    }

    throw err;
  }
}

const sendToAdmin = (text, keyboard = mainKeyboard) => sendTextToBot('admin', config.ADMIN_CHAT_ID, text, keyboard);
const sendToAdminInline = (text, keyboard = inlineKeyboard) => sendTextToBot('admin', config.ADMIN_CHAT_ID, text, keyboard);
const sendToChoi = (text) => sendTextToBot('choi', config.TELEGRAM_CHAT_ID, text);
const sendToMing = (text) => sendTextToBot('ming', config.TELEGRAM_CHAT_ID_A, text);

module.exports = {
  sendToAdmin,
  sendToAdminInline,
  sendToChoi,
  sendToMing,
  editMessage,
  inlineKeyboard,
  mainKeyboard,
  getLangKeyboard,
  getDynamicInlineKeyboard,
  sendTextToBot
};

