// lang.js

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


const translations = {
  ko: {
    symbols: {
      Ready_showSup: "#🩵롱 대기 📈관점공유",
      Ready_showRes: "#❤️숏 대기 📉관점공유",
      Ready_isBigSup: "#🚀강한 롱 대기 📈관점공유",
      Ready_isBigRes: "#🛸강한 숏 대기 📉관점공유",
      showSup: "#🩵롱 진입🩵관점공유🩵",
      showRes: "#❤️숏 진입❤️관점공유❤️",
      isBigSup: "#🚀강한 롱 진입🚀관점공유🚀",
      isBigRes: "#🛸강한 숏 진입🛸관점공유🛸",
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
    am: "오전",
    pm: "오후"
  },
  en: {
    symbols: {
      Ready_showSup: "#🩵Long Setup 📈Perspective",
      Ready_showRes: "#❤️Short Setup 📉Perspective",
      Ready_isBigSup: "#🚀Strong Long Setup 📈Perspective",
      Ready_isBigRes: "#🛸Strong Short Setup 📉Perspective",
      showSup: "#🩵Long Entry🩵Perspective🩵",
      showRes: "#❤️Short Entry❤️Perspective❤️",
      isBigSup: "#🚀Strong Long Entry🚀Perspective🚀",
      isBigRes: "#🛸Strong Short Entry🛸Perspective🛸",
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
    am: "AM",
    pm: "PM"
  },
  zh: {
    symbols: {
      Ready_showSup: "#🩵做多准备 📈观点分享",
      Ready_showRes: "#❤️做空准备 📉观点分享",
      Ready_isBigSup: "#🚀强烈做多准备 📈观点分享",
      Ready_isBigRes: "#🛸强烈做空准备 📉观点分享",
      showSup: "#🩵做多进场🩵观点分享🩵",
      showRes: "#❤️做空进场❤️观点分享❤️",
      isBigSup: "#🚀强烈做多进场🚀观点分享🚀",
      isBigRes: "#🛸强烈做空进场🛸观点分享🛸",
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
    am: "上午",
    pm: "下午"
  },
  ja: {
    symbols: {
      Ready_showSup: "#🩵ロング準備 📈視点共有",
      Ready_showRes: "#❤️ショート準備 📉視点共有",
      Ready_isBigSup: "#🚀強ロング準備 📈視点共有",
      Ready_isBigRes: "#🛸強ショート準備 📉視点共有",
      showSup: "#🩵ロングエントリー🩵視点共有🩵",
      showRes: "#❤️ショートエントリー❤️視点共有❤️",
      isBigSup: "#🚀強ロングエントリー🚀視点共有🚀",
      isBigRes: "#🛸強ショートエントリー🛸視点共有🛸",
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
    am: "午前",
    pm: "午後"
  }
};

module.exports = { translations };
