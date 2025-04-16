// ✅👇 locales/ko.js

module.exports = {
  symbols: {
    Ready_showSup: "#🩵롱 대기 📈",
    Ready_showRes: "#❤️숏 대기 📉",
    Ready_isBigSup: "#🚀강한 롱 대기 📈",
    Ready_isBigRes: "#🛸강한 숏 대기 📉",
    Ready_exitLong: "#💲롱 청산 준비 📈",
    Ready_exitShort: "#💲숏 청산 준비 📉",
    showSup: "#🩵롱 진입 📈 관점공유🩵",
    showRes: "#❤️숏 진입 📉 관점공유❤️",
    isBigSup: "#🚀강한 롱 진입 📈 관점공유🚀",
    isBigRes: "#🛸강한 숏 진입 📉 관점공유🛸",
    exitLong: "#💰롱 청산 📈 관점공유💰",
    exitShort: "#💰숏 청산 📉 관점공유💰"
  },
  labels: {
    symbol: "📌 종목",
    timeframe: "⏱️ 타임프레임",
    timeframeUnit: "분",
    price: "💲 가격",
    entryInfo: "📊 진입 {entryCount}% / 평균단가 {entryAvg}",
    noEntryInfo: "📊 진입 비율 정보 없음 / 평균단가 계산 불가",
    pnlCalculationError: "📈수익률 +-% / 원금대비 +-%📉 계산 불가",    
    entrySummary: "⏱️ 진입 현황:",
    entryInfoByTF: "• {tf}분 → ✅ {percent}% / 평균단가 {avg}",

    // ✅ 청산 방향별 메시지
    expectedCloseLong: "예상 청산가: {price} ⬆️",
    expectedCloseShort: "예상 청산가: {price} ⬇️",
    // ✅ 수익률 단독
    pnlOnlyProfit: "📈수익률 +{pnl}% 예상",
    pnlOnlyLoss: "📉수익률 -{pnl}% 예상",
    // ✅ 원금대비 단독 (ROE)
    roeOnlyProfit: "💹 원금대비 +{capital}%",
    roeOnlyLoss: "💹 원금대비 -{capital}%",
    // ✅ 수익률 + ROE 전체 버전
    pnlLineProfit: "📈수익률 {pnl}% / 원금대비 {capital}%",
    pnlLineLoss: "📉수익률 {pnl}% / 원금대비 {capital}%",
    noPnL: "📉수익률 계산 불가",
    
    entryLimitReachedLong: "⚠️ 롱 포지션 포화 상태입니다.",
    entryLimitReachedShort: "⚠️ 숏 포지션 포화 상태입니다.",
    captured: "🕒 포착시간",
    weight: "🗝️ 비중: {weight}",
    leverage: "🎲 배율: {leverage}",
    pnl: "📈 손익: {value}%",
    disclaimer_short: "⚠️관점은 자율적 참여입니다.",
    disclaimer_full: "⚠️관점공유는 언제나【자율적 참여】\n⚠️모든 투자와 판단은 본인의 몫입니다."
  },
  days: {
    0: "일", 1: "월", 2: "화", 3: "수", 4: "목", 5: "금", 6: "토"
  },
  am: "오전", pm: "오후", timezone: "Asia/Seoul"
};
