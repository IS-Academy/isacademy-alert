const axios = require('axios');
const config = require('./config');

function getBotToken(botType) {
  switch (botType) {
    case 'choi': return config.TELEGRAM_BOT_TOKEN;
    case 'ming': return config.TELEGRAM_BOT_TOKEN_A;
    case 'admin': return config.ADMIN_BOT_TOKEN;
    default: throw new Error(`Unknown botType: ${botType}`);
  }
}

function getChatId(botType) {
  switch (botType) {
    case 'choi': return config.TELEGRAM_CHAT_ID;
    case 'ming': return config.TELEGRAM_CHAT_ID_A;
    case 'admin': return config.ADMIN_CHAT_ID;
    default: throw new Error(`Unknown botType: ${botType}`);
  }
}

async function sendTextToBot(botType, chatId, text, replyMarkup = null) {
  try {
    const token = getBotToken(botType);
    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      reply_markup: replyMarkup || undefined
    });
  } catch (err) {
    console.error(`❌ ${botType} 전송 실패:`, err.stack || err.message);
  }
}

async function editMessage(botType, chatId, messageId, text, replyMarkup = null) {
  try {
    const token = getBotToken(botType);
    await axios.post(`https://api.telegram.org/bot${token}/editMessageText`, {
      chat_id: chatId,
      message_id: messageId,
      text,
      parse_mode: 'HTML',
      reply_markup: replyMarkup?.inline_keyboard ? replyMarkup : { inline_keyboard: [] }
    });
  } catch (err) {
    const ignore = err.response?.data?.description?.includes("message is not modified");
    if (!ignore) console.error(`❌ ${botType} edit 실패:`, err.stack || err.message);
  }
}

// 단축 함수
const sendToChoi = (text, keyboard = null) => sendTextToBot('choi', config.TELEGRAM_CHAT_ID, text, keyboard);
const sendToMing = (text, keyboard = null) => sendTextToBot('ming', config.TELEGRAM_CHAT_ID_A, text, keyboard);
const sendToAdmin = (text, keyboard = null) => sendTextToBot('admin', config.ADMIN_CHAT_ID, text, keyboard);

module.exports = {
  sendTextToBot,
  editMessage,
  sendToChoi,
  sendToMing,
  sendToAdmin
};
