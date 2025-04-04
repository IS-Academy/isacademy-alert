// utils.js
const axios = require('axios');
const fs = require('fs');
const { generateAlertMessage } = require('./AlertMessage');
const moment = require('moment-timezone');
const config = require('./config');

let lastDummyTime = null;

// ✅ 상태 저장 & 불러오기
const STATE_FILE = './bot_state.json';

// ✅ 상태 불러오기
function loadBotState() {
  try {
    const raw = fs.readFileSync(STATE_FILE);
    return JSON.parse(raw);
  } catch (err) {
    return { choiEnabled: true, mingEnabled: true };
  }
}

// ✅ 상태 저장
function saveBotState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

// ✅ 인라인 키보드 UI
function getInlineKeyboard() {
  return {
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
}

// ✅ 언어 선택용 인라인 키보드
function getLangKeyboard(bot) {
  return {
    inline_keyboard: [
      [
        { text: '🇰🇷 한국어', callback_data: `lang_${bot}_ko` },
        { text: '🇺🇸 English', callback_data: `lang_${bot}_en` },
        { text: '🇨🇳 中文', callback_data: `lang_${bot}_zh` },
        { text: '🇯🇵 日本語', callback_data: `lang_${bot}_ja` }
      ]
    ]
  };
}

// ✅ 일반 키보드 (ReplyKeyboardMarkup)
function getReplyKeyboard(type = 'lang') {
  if (type === 'tz') {
    return {
      keyboard: [
        ['Asia/Seoul', 'Asia/Tokyo'],
        ['UTC', 'America/New_York']
      ],
      resize_keyboard: true,
      one_time_keyboard: true
    };
  }
  return {
    keyboard: [['ko', 'en', 'zh', 'ja']],
    resize_keyboard: true,
    one_time_keyboard: true
  };
}

// ✅ 텔레그램 메시지 전송 (관리자용)
async function sendTextToTelegram(text, keyboard = null) {
  try {
    await axios.post(`https://api.telegram.org/bot${config.ADMIN_BOT_TOKEN}/sendMessage`, {
      chat_id: config.ADMIN_CHAT_ID,
      text,
      parse_mode: 'HTML',
      reply_markup: keyboard || undefined
    });
  } catch (err) {
    console.error('❌ 관리자 메시지 전송 실패:', err.response?.data || err.message);
  }
}

// ✅ 텍스트 수정 (인라인 키보드 포함)
async function editTelegramMessage(chatId, messageId, text, keyboard = null) {
  try {
    await axios.post(`https://api.telegram.org/bot${config.ADMIN_BOT_TOKEN}/editMessageText`, {
      chat_id: chatId,
      message_id: messageId,
      text,
      parse_mode: 'HTML',
      reply_markup: keyboard?.inline_keyboard ? keyboard : { inline_keyboard: [] }
    });
  } catch (err) {
    const isNotModified = err.response?.data?.description?.includes("message is not modified");
    if (!isNotModified) {
      console.error('❌ editMessageText 실패:', err.response?.data || err.message);
    }
  }
}


// ✅ 밍밍 봇 전송
async function sendToMingBot(message) {
  if (!global.mingEnabled) return;
  try {
    await axios.post(`https://api.telegram.org/bot${config.TELEGRAM_BOT_TOKEN_A}/sendMessage`, {
      chat_id: config.TELEGRAM_CHAT_ID_A,
      text: message,
      parse_mode: 'HTML'
    });
  } catch (err) {
    console.error('❌ 밍밍 전송 실패:', err.response?.data || err.message);
  }
}

// ✅ 마지막 더미 수신 시간 - 메모리 기반
function updateLastDummyTime(time) {
  lastDummyTime = time;
}

function getLastDummyTime() {
  return lastDummyTime || '❌ 기록 없음';
}

// ✅ 파일에서 마지막 더미 수신 시간 읽기
function readLastDummyTimeFromFile() {
  try {
    const time = fs.readFileSync('./last_dummy.txt', 'utf8');
    return time;
  } catch (e) {
    return '❌ 기록 없음';
  }
}

module.exports = {
  loadBotState,
  saveBotState,
  getInlineKeyboard,
  getLangKeyboard,
  getReplyKeyboard,
  getTzKeyboard: () => getReplyKeyboard('tz'),
  sendTextToTelegram,
  sendToMingBot,
  editTelegramMessage,
  updateLastDummyTime,
  getLastDummyTime,
  readLastDummyTimeFromFile,
  generateAlertMessage
};
