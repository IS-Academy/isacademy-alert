// AlertMessage.js

const config = require('./config');
const moment = require('moment-timezone');

// HTML escape 유틸 함수
function escapeHTML(str) {
  return String(str).replace(/[&<>"']/g, function (s) {
    return ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[s];
  });
}

// ✅ 타입 매핑 (기본 타입 ➜ 줄임 타입)
const TYPE_MAP = {
  show_Support: 'showSup',
  show_Resistance: 'showRes',
  is_Big_Support: 'isBigSup',
  is_Big_Resistance: 'isBigRes',
  Ready_show_Support: 'Ready_showSup',
  Ready_show_Resistance: 'Ready_showRes',
  Ready_is_Big_Support: 'Ready_isBigSup',
  Ready_is_Big_Resistance: 'Ready_isBigRes'
};

function normalizeType(type) {
  return TYPE_MAP[type] || type;
}

// ✅ 간단한 대기 메시지 (축약형, generateAlertMessage와 통일된 메시지명 사용)
function getWaitingMessage(type, symbol, timeframe, weight, leverage, lang = 'ko') {
  const normalizedType = normalizeType(type);

  const translations = {
    ko: {
      symbols: {
        Ready_showSup: "#🩵롱 대기 📈",
        Ready_showRes: "#❤️숏 대기 📉",
        Ready_isBigSup: "#🚀강한 롱 대기 📈",
        Ready_isBigRes: "#🛸강한 숏 대기 📉",
        Ready_exitLong: "#💲롱 청산 준비 📈",
        Ready_exitShort: "#💲숏 청산 준비 📉"
      },
      labels: {
        symbol: "📌 종목",
        weight: "🗝️ 비중",
        leverage: "🎲 배율"
      }
    },
    en: {
      symbols: {
        Ready_showSup: "#🩵Long Setup 📈",
        Ready_showRes: "#❤️Short Setup 📉",
        Ready_isBigSup: "#🚀Strong Long Setup 📈",
        Ready_isBigRes: "#🛸Strong Short Setup 📉",
        Ready_exitLong: "#💲Exit Long Ready 📈",
        Ready_exitShort: "#💲Exit Short Ready 📉"
      },
      labels: {
        symbol: "📌 Symbol",
        weight: "🗝️ Weight",
        leverage: "🎲 Leverage"
      }
    },
    zh: {
      symbols: {
        Ready_showSup: "#🩵做多准备 📈",
        Ready_showRes: "#❤️做空准备 📉",
        Ready_isBigSup: "#🚀强烈做多准备 📈",
        Ready_isBigRes: "#🛸强烈做空准备 📉",
        Ready_exitLong: "#💲平多准备 📈",
        Ready_exitShort: "#💲平空准备 📉"
      },
      labels: {
        symbol: "📌 币种",
        weight: "🗝️ 仓位",
        leverage: "🎲 杠杆"
      }
    },
    ja: {
      symbols: {
        Ready_showSup: "#🩵ロング準備 📈",
        Ready_showRes: "#❤️ショート準備 📉",
        Ready_isBigSup: "#🚀強ロング準備 📈",
        Ready_isBigRes: "#🛸強ショート準備 📉",
        Ready_exitLong: "#💲ロング利確準備 📈",
        Ready_exitShort: "#💲ショート利確準備 📉"
      },
      labels: {
        symbol: "📌 シンボル",
        weight: "🗝️ 比率",
        leverage: "🎲 レバレッジ"
      }
    }
  };

  const dict = translations[lang] || translations.ko;
  const label = dict.labels;
  const signal = dict.symbols[normalizedType] || '#❓Unknown Signal';

  const tfStr = `${timeframe}⏱️`;
  const infoLine = `${label.symbol}: ${symbol}\n${label.weight}: ${weight} / ${label.leverage}: ${leverage}`;
  return `${signal} ${tfStr}\n\n${infoLine}`;
}

// ✅ 알림 메시지 생성
function generateAlertMessage({ type, symbol, timeframe, price, date, clock, lang = 'ko', ts = null, timezone = 'Asia/Seoul', entryCount = 0, entryAvg = null, entryLimit = config.MAX_ENTRY_PERCENT, htmlEscape = false }) {
  const normalizedType = normalizeType(type);

  const translations = {
    ko: {
      symbols: {
        Ready_showSup: "#🩵롱 대기 📈관점공유",
        Ready_showRes: "#❤️숏 대기 📉관점공유",
        Ready_isBigSup: "#🚀강한 롱 대기 📈관점공유",
        Ready_isBigRes: "#🛸강한 숏 대기 📉관점공유",
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
        entryInfo: "📊 진입 {entryCount}% / 평균가 {entryAvg}",
        entryLimitReached: "⚠️ 롱 포지션 포화 상태입니다.",
        captured: "🕒 포착시간",
        weight: "🗝️ 비중: 1%",
        leverage: "🎲 배율: 50×",
        pnl: "📈 손익: {value}%",
        disclaimer_short: "⚠️관점은 자율적 참여입니다.",
        disclaimer_full: "⚠️관점공유는 언제나【자율적 참여】\n⚠️모든 투자와 판단은 본인의 몫입니다."
      },
      days: {
        Mon: "월", Tue: "화", Wed: "수", Thu: "목", Fri: "금", Sat: "토", Sun: "일"
      },
      am: "오전", pm: "오후"
    },
    en: {
      symbols: {
        Ready_showSup: "#🩵Long Setup 📈Perspective",
        Ready_showRes: "#❤️Short Setup 📉Perspective",
        Ready_isBigSup: "#🚀Strong Long Setup 📈Perspective",
        Ready_isBigRes: "#🛸Strong Short Setup 📉Perspective",
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
        entryInfo: "📊 Entry {entryCount}% / Avg {entryAvg}",
        entryLimitReached: "⚠️ Long position is saturated.",
        captured: "🕒 Captured At",
        weight: "🗝️ Weight: 1%",
        leverage: "🎲 Leverage: 50×",
        pnl: "📈 PnL: {value}%",
        disclaimer_short: "⚠️This view is voluntary.",
        disclaimer_full: "⚠️Participation is always voluntary.\n⚠️All decisions are your own responsibility."
      },
      days: {
        Mon: "Mon", Tue: "Tue", Wed: "Wed", Thu: "Thu", Fri: "Fri", Sat: "Sat", Sun: "Sun"
      },
      am: "AM", pm: "PM"
    },
    zh: {
      symbols: {
        Ready_showSup: "#🩵做多准备 📈观点分享",
        Ready_showRes: "#❤️做空准备 📉观点分享",
        Ready_isBigSup: "#🚀强烈做多准备 📈观点分享",
        Ready_isBigRes: "#🛸强烈做空准备 📉观点分享",
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
        entryInfo: "📊 已进场 {entryCount}% / 均价 {entryAvg}",
        entryLimitReached: "⚠️ 多头持仓已饱和。",
        captured: "🕒 捕捉时间",
        weight: "🗝️ 仓位: 1%",
        leverage: "🎲 杠杆: 50×",
        pnl: "📈 盈亏: {value}%",
        disclaimer_short: "⚠️观点为自愿参与。",
        disclaimer_full: "⚠️观点分享纯属自愿\n⚠️所有交易和决策需自行承担。"
      },
      days: {
        Mon: "周一", Tue: "周二", Wed: "周三", Thu: "周四", Fri: "周五", Sat: "周六", Sun: "周日"
      },
      am: "上午", pm: "下午"
    },
    ja: {
      symbols: {
        Ready_showSup: "#🩵ロング準備 📈視点共有",
        Ready_showRes: "#❤️ショート準備 📉視点共有",
        Ready_isBigSup: "#🚀強ロング準備 📈視点共有",
        Ready_isBigRes: "#🛸強ショート準備 📉視点共有",
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
        entryInfo: "📊 エントリー {entryCount}% / 平均価格 {entryAvg}",
        entryLimitReached: "⚠️ ロングポジションが飽和状態です。",
        captured: "🕒 検出時間",
        weight: "🗝️ 比率: 1%",
        leverage: "🎲 レバレッジ: 50×",
        pnl: "📈 損益: {value}%",
        disclaimer_short: "⚠️視点は任意参加です。",
        disclaimer_full: "⚠️視点共有は常に任意です。\n⚠️投資判断は自己責任でお願いします。"
      },
      days: {
        Mon: "月", Tue: "火", Wed: "水", Thu: "木", Fri: "金", Sat: "土", Sun: "日"
      },
      am: "午前", pm: "午後"
    }
  };

  const dict = translations[lang] || translations.ko;
  const normalizedType = normalizeType(type);
  const signal = dict.symbols[normalizedType] || '#📢알 수 없는 신호';
  const L = dict.labels;

  // 날짜 처리
  const timestamp = Number(ts) || Math.floor(Date.now() / 1000);
  const time = moment.unix(timestamp).tz(timezone);
  const dayKey = time.format('ddd');
  const ampm = time.format('A') === 'AM' ? dict.am : dict.pm;

  const dateFormatted = time.format(`YY. MM. DD. (${dict.days?.[dayKey] || dayKey})`);
  const clockFormatted = lang === 'ko' ? `${ampm} ${time.format('hh:mm:ss')}` : time.format('hh:mm:ss A');

  const entryTypes = ['showSup', 'showRes', 'isBigSup', 'isBigRes', 'exitLong', 'exitShort'];
  const waitTypes = ['Ready_showSup', 'Ready_showRes', 'Ready_isBigSup', 'Ready_isBigRes'];
  const prepareTypes = ['Ready_exitLong', 'Ready_exitShort'];

  const isEntry = entryTypes.includes(normalizedType);
  const isWait = waitTypes.includes(normalizedType);
  const isPrepare = prepareTypes.includes(normalizedType);

  // HTML 이스케이프 적용
  const safe = (str) => htmlEscape ? escapeHTML(str) : str;

  let msg = 'ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ\n';
  msg += `${signal}\n\n`;
  msg += `${L.symbol}: ${safe(symbol)}\n`;
  msg += `${L.timeframe}: ${safe(timeframe)}\n`;

  if (isEntry && price !== null) {
    msg += `${L.price}: ${safe(Number(price).toLocaleString())}\n`;
  }

  if (isEntry && entryCount > 0) {
    const entryText = L.entryInfo
      .replace('{entryCount}', entryCount)
      .replace('{entryAvg}', entryAvg && !isNaN(entryAvg) ? Number(entryAvg).toLocaleString() : 'N/A');
    msg += `${entryText}\n`;
    if (entryCount >= entryLimit) {
      msg += `${L.entryLimitReached}\n`;
    }
  }

  if (isWait) {
    msg += `${L.weight}\n${L.leverage}\n`;
  }

  if (isEntry) {
    msg += `\n${L.captured}:\n${dateFormatted}\n${clockFormatted}\n`;
  }

  msg += `\n${(isEntry || isPrepare) ? L.disclaimer_full : L.disclaimer_short}`;
  msg += '\nㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ';

  return msg;
}

module.exports = {
  generateAlertMessage,
  getWaitingMessage
};

