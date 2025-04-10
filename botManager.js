// ✅ botManager.js

const axios = require('axios');
const config = require('./config');

// 텔레그램 키보드 정의
const inlineKeyboard = {
  inline_keyboard: [
    [{ text: '▶️ 최실장 켜기', callback_data: 'choi_on' }, { text: '⏹️ 최실장 끄기', callback_data: 'choi_off' }],
    [{ text: '▶️ 밍밍 켜기', callback_data: 'ming_on' }, { text: '⏹️ 밍밍 끄기', callback_data: 'ming_off' }],
    [{ text: '🌐 최실장 언어선택', callback_data: 'lang_choi' }, { text: '🌐 밍밍 언어선택', callback_data: 'lang_ming' }],
    [{ text: '📡 상태 확인', callback_data: 'status' }, { text: '🔁 더미 상태', callback_data: 'dummy_status' }]
  ]
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

// ✅ 키보드, 고정 메시지 기능 모두 제거한 순수 메시지 전송
async function sendTextToBot(botType, chatId, text) {
  let token;

  if (botType === 'choi') {
    token = config.TELEGRAM_BOT_TOKEN;
  } else if (botType === 'ming') {
    token = config.TELEGRAM_BOT_TOKEN_A;
  } else {
    token = config.ADMIN_BOT_TOKEN;
  }

  console.log(`📤 [sendTextToBot 호출됨] botType=${botType}, chatId=${chatId}`);
  try {
    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
      chat_id: chatId,
      text,
      parse_mode: 'HTML'
    });
  } catch (err) {
    console.error(`❌ sendTextToBot 실패 (botType=${botType}, chatId=${chatId}):`, err.response?.data || err.message);
  }
}

// 🧩 모듈 내보내기 (editMessage 제거됨)
const sendToAdmin = (text) => sendTextToBot('admin', config.ADMIN_CHAT_ID, text);
const sendToChoi = (text) => sendTextToBot('choi', config.TELEGRAM_CHAT_ID, text);
const sendToMing = (text) => sendTextToBot('ming', config.TELEGRAM_CHAT_ID_A, text);

module.exports = {
  sendToAdmin,
  sendToChoi,
  sendToMing,
  inlineKeyboard,
  getLangKeyboard
};
