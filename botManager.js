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

async function sendTextToBot(botType, chatId, text, replyMarkup = null) {
  const token = config.ADMIN_BOT_TOKEN;
  try {
    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      reply_markup: replyMarkup || undefined
    });
  } catch (err) {
    console.error(`❌ sendTextToBot 실패:`, err.message);
  }
}

async function editMessage(botType, chatId, messageId, text, replyMarkup = null) {
  const token = config.ADMIN_BOT_TOKEN;
  try {
    await axios.post(`https://api.telegram.org/bot${token}/editMessageText`, {
      chat_id: chatId,
      message_id: messageId,
      text,
      parse_mode: 'HTML',
      reply_markup: replyMarkup || inlineKeyboard
    });
  } catch (err) {
    const errorMsg = err.response?.data?.description || '';
    if (errorMsg.includes('message is not modified')) {
      // ✅ 메시지 변경사항 없으면 무시
      console.log('🔹 editMessage: 메시지 변경 없음.');
    } else if (errorMsg.includes('message to edit not found')) {
      // ✅ 메시지 없으면 재발송
      console.log('🔹 editMessage: 기존 메시지 없음, 새 메시지 발송.');
      await sendTextToBot(botType, chatId, text, replyMarkup);
    } else {
      console.error(`❌ editMessage 실패:`, errorMsg);
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
  inlineKeyboard,
  mainKeyboard,
  getLangKeyboard
};
