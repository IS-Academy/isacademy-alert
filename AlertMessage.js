// AlertMessage.js

const moment = require('moment-timezone');

// ✅ 간단한 대기 메시지 (축약형, generateAlertMessage와 통일된 메시지명 사용)
function getWaitingMessage(type, symbol, timeframe, weight, leverage, lang = 'ko') {
  const translations = {
    ko: {
      symbols: {
        Ready_Support: "#🩵롱 대기 📈",
        Ready_Resistance: "#❤️숏 대기 📉",
        Ready_is_Big_Support: "#🚀강한 롱 대기 📈",
        Ready_is_Big_Resistance: "#🛸강한 숏 대기 📉",
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
        Ready_Support: "#🩵Long Setup 📈",
        Ready_Resistance: "#❤️Short Setup 📉",
        Ready_is_Big_Support: "#🚀Strong Long Setup 📈",
        Ready_is_Big_Resistance: "#🛸Strong Short Setup 📉",
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
        Ready_Support: "#🩵做多准备 📈",
        Ready_Resistance: "#❤️做空准备 📉",
        Ready_is_Big_Support: "#🚀强烈做多准备 📈",
        Ready_is_Big_Resistance: "#🛸强烈做空准备 📉",
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
        Ready_Support: "#🩵ロング準備 📈",
        Ready_Resistance: "#❤️ショート準備 📉",
        Ready_is_Big_Support: "#🚀強ロング準備 📈",
        Ready_is_Big_Resistance: "#🛸強ショート準備 📉",
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
  const signal = dict.symbols[type] || '#❓Unknown Signal';

  const tfStr = `${timeframe}⏱️`;
  const infoLine = `${label.symbol}: ${symbol}\n${label.weight}: ${weight} / ${label.leverage}: ${leverage}`;
  let message = `${signal} ${tfStr}\n\n${infoLine}`;
  return message;
}

// ✅ 알림 메시지 생성
function generateAlertMessage({ type, symbol, timeframe, price, date, clock, lang = 'ko', ts = null, timezone = 'Asia/Seoul', entryCount = 0, entryAvg = 'N/A', entryLimit = 30 }) {
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

  let msg = 'ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ\n';
  msg += `${signal}\n\n`;
  msg += `${L.symbol}: ${symbol}\n`;
  msg += `${L.timeframe}: ${timeframe}\n`;

  if (entryTypes.includes(type) && price !== 'N/A') {
    msg += `${L.price}: ${price}\n`;
  }

  if (entryTypes.includes(type) && entryCount > 0) {
    msg += `📊 진입 ${entryCount}% / 평균가 ${entryAvg}\n`;
    if (entryCount >= entryLimit) {
      msg += `⚠️ 롱 포지션 포화 상태입니다.\n`;
    }
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

  msg += '\nㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ';
  return msg;
}

module.exports = {
  generateAlertMessage,
  getWaitingMessage
};
