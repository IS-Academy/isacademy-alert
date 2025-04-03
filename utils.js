// utils.js
const axios = require('axios');
const fs = require('fs');
const config = require('./config');

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
        { text: '📡 상태 확인', callback_data: 'status' }
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

// ✅ 알림 메시지 생성
function generateAlertMessage({ type, symbol, timeframe, price, date, clock, lang }) {
  const signalMap = {
    Ready_Support:           { emoji: '🩵', ko: '롱 진입 대기', en: 'Ready Long', zh: '准备做多', ja: 'ロングエントリー準備' },
    Ready_Resistance:        { emoji: '❤️', ko: '숏 진입 대기', en: 'Ready Short', zh: '准备做空', ja: 'ショートエントリー準備' },
    Ready_is_Big_Support:    { emoji: '🚀', ko: '강한 롱 진입 대기', en: 'Strong Ready Long', zh: '强烈准备做多', ja: '強力ロング準備' },
    Ready_is_Big_Resistance: { emoji: '🛸', ko: '강한 숏 진입 대기', en: 'Strong Ready Short', zh: '强烈准备做空', ja: '強力ショート準備' },
    show_Support:            { emoji: '🩵', ko: '롱 진입', en: 'Long Entry', zh: '做多进场', ja: 'ロングエントリー' },
    show_Resistance:         { emoji: '❤️', ko: '숏 진입', en: 'Short Entry', zh: '做空进场', ja: 'ショートエントリー' },
    is_Big_Support:          { emoji: '🚀', ko: '강한 롱 진입', en: 'Strong Long', zh: '强烈做多', ja: '強力ロング' },
    is_Big_Resistance:       { emoji: '🛸', ko: '강한 숏 진입', en: 'Strong Short', zh: '强烈做空', ja: '強力ショート' },
    Ready_exitLong:          { emoji: '💲', ko: '롱 청산 준비', en: 'Ready Exit Long', zh: '准备平多仓', ja: 'ロング決済準備' },
    Ready_exitShort:         { emoji: '💲', ko: '숏 청산 준비', en: 'Ready Exit Short', zh: '准备平空仓', ja: 'ショート決済準備' },
    exitLong:                { emoji: '💰', ko: '롱 청산', en: 'Exit Long', zh: '平多仓', ja: 'ロング決済' },
    exitShort:               { emoji: '💰', ko: '숏 청산', en: 'Exit Short', zh: '平空仓', ja: 'ショート決済' }
  };

  const signal = signalMap[type] || { emoji: '🔔', ko: type };
  const title = signal[lang] || signal.ko;

  let message = `${signal.emoji} <b>${title}</b>\n\n📌 종목: <b>${symbol}</b>\n⏱️ 타임프레임: ${timeframe}`;
  if (price && price !== 'N/A') message += `\n💲 가격: <b>${price}</b>`;
  message += `\n🕒 포착시간:\n${date}\n${clock}`;
  return message;
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

module.exports = {
  loadBotState,
  saveBotState,
  getInlineKeyboard,
  getLangKeyboard,
  getReplyKeyboard,
  getTzKeyboard: () => getReplyKeyboard('tz'),
  sendTextToTelegram,
  sendToMingBot,
  generateAlertMessage,
  editTelegramMessage
};
