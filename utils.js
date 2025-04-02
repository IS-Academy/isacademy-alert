// utils.js
const fs = require('fs');
const axios = require('axios');
const config = require('./config');

// 상태 파일 경로
const STATE_FILE = './bot_state.json';

// ✅ 상태 불러오기
function loadBotState() {
  try {
    const raw = fs.readFileSync(STATE_FILE);
    return JSON.parse(raw);
  } catch (err) {
    return {
      choiEnabled: config.CHOI_ENABLED === true || config.CHOI_ENABLED === 'true',
      mingEnabled: config.MINGMING_ENABLED === true || config.MINGMING_ENABLED === 'true'
    };
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

// ✅ 관리자에게 메시지 전송
async function sendTextToTelegram(text, keyboard) {
  try {
    const url = `https://api.telegram.org/bot${config.ADMIN_BOT_TOKEN}/sendMessage`;
    await axios.post(url, {
      chat_id: config.ADMIN_CHAT_ID,
      text,
      parse_mode: 'HTML',
      reply_markup: keyboard
    });
  } catch (err) {
    if (!err?.response?.data?.description?.includes('message is not modified'))
      console.error('❌ 관리자 메시지 전송 실패:', err.response?.data || err.message);
  }
}

// ✅ 메시지 수정
async function editTelegramMessage(chatId, messageId, text, keyboard) {
  try {
    const replyMarkup = keyboard?.inline_keyboard
      ? { inline_keyboard: keyboard.inline_keyboard }
      : { inline_keyboard: [] }; // 빈 키보드로 처리

    await axios.post(`https://api.telegram.org/bot${config.ADMIN_BOT_TOKEN}/editMessageText`, {
      chat_id: chatId,
      message_id: messageId,
      text,
      parse_mode: 'HTML',
      reply_markup: replyMarkup
    });
  } catch (err) {
    const isNotModified = err.response?.data?.description?.includes("message is not modified");
    if (!isNotModified) {
      console.error('❌ 메시지 수정 실패:', err.response?.data || err.message);
    }
  }
}

// ✅ 밍밍 봇 전송
async function sendToMingBot(message) {
  if (!global.mingEnabled) return;
  try {
    const url = `https://api.telegram.org/bot${config.TELEGRAM_BOT_TOKEN_A}/sendMessage`;
    await axios.post(url, {
      chat_id: config.TELEGRAM_CHAT_ID_A,
      text: message,
      parse_mode: 'HTML'
    });
  } catch (err) {
    await sendTextToTelegram(`❌ 밍밍 전송 실패\n\n${err.response?.data?.description || err.message}`);
  }
}

// ✅ Alert 메시지 생성
function generateAlertMessage({ type, symbol, timeframe, price, date, clock, lang = 'ko' }) {
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
  const signal = signalMap[type] || { emoji: '🔔' };
  const title = signal[lang] || type;
  let message = `${signal.emoji} <b>${title}</b>\n\n📌 종목: <b>${symbol}</b>\n⏱️ 타임프레임: ${timeframe}`;
  const fullInfoTypes = ['show_Support', 'show_Resistance', 'is_Big_Support', 'is_Big_Resistance', 'exitLong', 'exitShort'];
  if (fullInfoTypes.includes(type)) {
    if (price !== 'N/A') message += `\n💲 가격: <b>${price}</b>`;
    message += `\n🕒 포착시간:\n${date}\n${clock}`;
  }
  return message;
}

module.exports = {
  loadBotState,
  saveBotState,
  getInlineKeyboard,
  sendTextToTelegram,
  sendToMingBot,
  generateAlertMessage,
  editTelegramMessage
};
