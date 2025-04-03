// utils.js
const axios = require('axios');
const fs = require('fs');
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

// ✅ 알림 메시지 생성
function generateAlertMessage({ type, symbol, timeframe, price, date, clock, lang = 'ko', ts = null, timezone = 'Asia/Seoul' }) {
  const translations = {
    ko: {
      symbols: {
        Ready_Support: "#🩵롱 대기 📈관점공유",
        Ready_Resistance: "#❤️숏 대기 📉관점공유",
        Ready_is_Big_Support: "#🚀강한 롱 대기 📈관점공유",
        Ready_is_Big_Resistance: "#🛸강한 숏 대기 📉관점공유",
        show_Support: "#🩵롱 진입🩵관점공유🩵",
        show_Resistance: "#❤️숏 진입❤️관점공유❤️",
        is_Big_Support: "#🚀강한 롱 진입🚀관점공유🚀",
        is_Big_Resistance: "#🛸강한 숏 진입🛸관점공유🛸",
        Ready_exitLong: "#💲롱 청산 준비 📈관점공유",
        Ready_exitShort: "#💲숏 청산 준비 📉관점공유",
        exitLong: "#💰롱 청산📈관점공유💰",
        exitShort: "#💰숏 청산📉관점공유💰"
      },
      labels: {
        symbol: "📌 종목",
        timeframe: "⏱️ 타임프레임",
        price: "💲 가격",
        captured: "🕒 포착시간",
        weight: "🗝️ 비중: 1%",
        leverage: "🎲 배율: 50×",
        disclaimer_short: "⚠️관점은 자율적 참여입니다.",
        disclaimer_full: "⚠️관점공유는 언제나【자율적 참여】\n⚠️모든 투자와 판단은 본인의 몫입니다."
      },
      days: {
        Mon: "월", Tue: "화", Wed: "수", Thu: "목", Fri: "금", Sat: "토", Sun: "일"
      },
      am: "오전",
      pm: "오후"
    },
    en: {
      symbols: {
        Ready_Support: "#🩵Long Setup 📈Perspective",
        Ready_Resistance: "#❤️Short Setup 📉Perspective",
        Ready_is_Big_Support: "#🚀Strong Long Setup 📈Perspective",
        Ready_is_Big_Resistance: "#🛸Strong Short Setup 📉Perspective",
        show_Support: "#🩵Long Entry🩵Perspective🩵",
        show_Resistance: "#❤️Short Entry❤️Perspective❤️",
        is_Big_Support: "#🚀Strong Long Entry🚀Perspective🚀",
        is_Big_Resistance: "#🛸Strong Short Entry🛸Perspective🛸",
        Ready_exitLong: "#💲Exit Long Ready 📈Perspective",
        Ready_exitShort: "#💲Exit Short Ready 📉Perspective",
        exitLong: "#💰Exit Long📈Perspective💰",
        exitShort: "#💰Exit Short📉Perspective💰"
      },
      labels: {
        symbol: "📌 Symbol",
        timeframe: "⏱️ Timeframe",
        price: "💲 Price",
        captured: "🕒 Captured At",
        weight: "🗝️ Weight: 1%",
        leverage: "🎲 Leverage: 50×",
        disclaimer_short: "⚠️This view is voluntary.",
        disclaimer_full: "⚠️Participation is always voluntary.\n⚠️All decisions are your own responsibility."
      },
      days: {
        Mon: "Mon", Tue: "Tue", Wed: "Wed", Thu: "Thu", Fri: "Fri", Sat: "Sat", Sun: "Sun"
      },
      am: "AM",
      pm: "PM"
    },
    zh: {
      symbols: {
        Ready_Support: "#🩵做多准备 📈观点分享",
        Ready_Resistance: "#❤️做空准备 📉观点分享",
        Ready_is_Big_Support: "#🚀强烈做多准备 📈观点分享",
        Ready_is_Big_Resistance: "#🛸强烈做空准备 📉观点分享",
        show_Support: "#🩵做多进场🩵观点分享🩵",
        show_Resistance: "#❤️做空进场❤️观点分享❤️",
        is_Big_Support: "#🚀强烈做多进场🚀观点分享🚀",
        is_Big_Resistance: "#🛸强烈做空进场🛸观点分享🛸",
        Ready_exitLong: "#💲平多准备 📈观点分享",
        Ready_exitShort: "#💲平空准备 📉观点分享",
        exitLong: "#💰平多📈观点分享💰",
        exitShort: "#💰平空📉观点分享💰"
      },
      labels: {
        symbol: "📌 币种",
        timeframe: "⏱️ 周期",
        price: "💲 价格",
        captured: "🕒 捕捉时间",
        weight: "🗝️ 仓位: 1%",
        leverage: "🎲 杠杆: 50×",
        disclaimer_short: "⚠️观点为自愿参与。",
        disclaimer_full: "⚠️观点分享纯属自愿\n⚠️所有交易和决策需自行承担。"
      },
      days: {
        Mon: "周一", Tue: "周二", Wed: "周三", Thu: "周四", Fri: "周五", Sat: "周六", Sun: "周日"
      },
      am: "上午",
      pm: "下午"
    },
    ja: {
      symbols: {
        Ready_Support: "#🩵ロング準備 📈視点共有",
        Ready_Resistance: "#❤️ショート準備 📉視点共有",
        Ready_is_Big_Support: "#🚀強ロング準備 📈視点共有",
        Ready_is_Big_Resistance: "#🛸強ショート準備 📉視点共有",
        show_Support: "#🩵ロングエントリー🩵視点共有🩵",
        show_Resistance: "#❤️ショートエントリー❤️視点共有❤️",
        is_Big_Support: "#🚀強ロングエントリー🚀視点共有🚀",
        is_Big_Resistance: "#🛸強ショートエントリー🛸視点共有🛸",
        Ready_exitLong: "#💲ロング利確準備 📈視点共有",
        Ready_exitShort: "#💲ショート利確準備 📉視点共有",
        exitLong: "#💰ロング利確📈視点共有💰",
        exitShort: "#💰ショート利確📉視点共有💰"
      },
      labels: {
        symbol: "📌 シンボル",
        timeframe: "⏱️ 時間枠",
        price: "💲 価格",
        captured: "🕒 検出時間",
        weight: "🗝️ 比率: 1%",
        leverage: "🎲 レバレッジ: 50×",
        disclaimer_short: "⚠️視点は任意参加です。",
        disclaimer_full: "⚠️視点共有は常に任意です。\n⚠️投資判断は自己責任でお願いします。"
      },
      days: {
        Mon: "月", Tue: "火", Wed: "水", Thu: "木", Fri: "金", Sat: "土", Sun: "日"
      },
      am: "午前",
      pm: "午後"
    }
  };

  const dict = translations[lang] || translations.ko;
  const signal = dict.symbols[type] || '#📢알 수 없는 신호';
  const L = dict.labels;

  // 날짜 처리
const timestamp = Number(ts) || Math.floor(Date.now() / 1000);
const time = moment.unix(timestamp).tz(timezone);
const dayKey = time.format('ddd');
const dayTranslated = dict.days?.[dayKey] || dayKey;
const ampm = time.format('A') === 'AM' ? dict.am || 'AM' : dict.pm || 'PM';

const dateFormatted = time.format(`YY. MM. DD. (${dayTranslated})`);
const clockFormatted = lang === 'ko'
  ? `${ampm} ${time.format('hh:mm:ss')}`
  : time.format('hh:mm:ss A');

  const entryTypes = ['show_Support', 'show_Resistance', 'is_Big_Support', 'is_Big_Resistance', 'exitLong', 'exitShort'];
  const waitTypes = ['Ready_Support', 'Ready_Resistance', 'Ready_is_Big_Support', 'Ready_is_Big_Resistance'];
  const prepareTypes = ['Ready_exitLong', 'Ready_exitShort'];

  let msg = `${signal}\n\n`;
  msg += `${L.symbol}: ${symbol}\n`;
  msg += `${L.timeframe}: ${timeframe}\n`;

  if (entryTypes.includes(type) && price !== 'N/A') {
    msg += `${L.price}: ${price}\n`;
  }

  if (waitTypes.includes(type)) {
    msg += `${L.weight}\n${L.leverage}\n`;
  }

  if (entryTypes.includes(type)) {
    msg += `\n${L.captured}:\n${dateFormatted}\n${clockFormatted}\n`;
  }

  if (entryTypes.includes(type) || prepareTypes.includes(type)) {
    msg += `\n${L.disclaimer_full}`;
  } else {
    msg += `\n${L.disclaimer_short}`;
  }

  return msg;
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

function getLastDummyTime() {
  try {
    const time = fs.readFileSync('./last_dummy.txt', 'utf8');
    return time;
  } catch (e) {
    return '❌ 기록 없음';
  }
}

// ✅ 마지막 더미 수신 시간 업데이트
function updateLastDummyTime(time) {
  lastDummyTime = time;
}

// ✅ 마지막 더미 수신 시간 불러오기
function getLastDummyTime() {
  return lastDummyTime || '❌ 기록 없음';
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
  editTelegramMessage,
  updateLastDummyTime,
  getLastDummyTime
};
