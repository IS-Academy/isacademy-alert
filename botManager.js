// ✅ botManager.js
const axios = require('axios');
const config = require('./config');

// 🔧 키보드 정의
const inlineKeyboard = {
  inline_keyboard: [
    [
      { text: '▶️ 최실장 켜기', callback_data: 'choi_on' },
      { text: '⏹️ 최실장 끄기', callback_data: 'choi_off' }
    ],
    [
      { text: '▶️ 밍밍 켜기', callback_data: 'ming_on' },
      { text: '⏹️ 밍밍 끄기', callback_data: 'ming_off' }
    ],
    [
      { text: '🌐 최실장 언어선택', callback_data: 'lang_choi' },
      { text: '🌐 밍밍 언어선택', callback_data: 'lang_ming' }
    ],
    [
      { text: '📡 상태 확인', callback_data: 'status' },
      { text: '🔁 더미 상태', callback_data: 'dummy_status' }
    ]
  ]
};

const mainKeyboard = {
  keyboard: [
    ['🌐 최실장 언어선택', '🌐 밍밍 언어선택'],
    ['📡 상태 확인', '🔁 더미 상태']
  ],
  resize_keyboard: true
};

async function sendToAdmin(text, replyMarkup = mainKeyboard) {
  await sendTextToBot('admin', config.ADMIN_CHAT_ID, text, replyMarkup);
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

function getTzKeyboard() {
  return {
    keyboard: [
      ['Asia/Seoul', 'Asia/Tokyo'],
      ['UTC', 'America/New_York']
    ],
    resize_keyboard: true,
    one_time_keyboard: true
  };
}

// 🔧 전송기
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
  sendToAdmin,
  getLangKeyboard,
  getTzKeyboard,
  inlineKeyboard
};
