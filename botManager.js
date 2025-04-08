// ✅ botManager.js
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

async function editMessage(botType, chatId, messageId, text, replyMarkup = null) {
  try {
    const token = config.ADMIN_BOT_TOKEN;
    await axios.post(`https://api.telegram.org/bot${token}/editMessageText`, {
      chat_id: chatId,
      message_id: messageId,
      text,
      parse_mode: 'HTML',
      reply_markup: replyMarkup || inlineKeyboard // 확실한 기본값 설정
    });
  } catch (err) {
    if (!err.response?.data?.description.includes("message is not modified"))
      console.error(`❌ edit 실패:`, err.stack || err.message);
  }
}

module.exports = {
  sendToAdmin: (text, keyboard = mainKeyboard) => sendTextToBot('admin', config.ADMIN_CHAT_ID, text, keyboard),
  sendToChoi: (text) => sendTextToBot('choi', config.TELEGRAM_CHAT_ID, text),
  sendToMing: (text) => sendTextToBot('ming', config.TELEGRAM_CHAT_ID_A, text),
  editMessage,
  inlineKeyboard,
  mainKeyboard
};
