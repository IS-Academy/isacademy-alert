//✅👇 /trader-gate/positionManager.js

// 포지션 상태 저장소: 심볼 → 타임프레임 → 포지션 정보
const positions = {}; // 예: positions['BTC_USDT']['1'] = { side: 'long', entryPrice: 60000 }

function getPosition(symbol, timeframe) {
  return positions?.[symbol]?.[timeframe] || null;
}

function setPosition(symbol, timeframe, side, entryPrice) {
  positions[symbol] = positions[symbol] || {};
  positions[symbol][timeframe] = { side, entryPrice };
  console.log(`💾 포지션 저장됨: ${symbol} (${timeframe}분) → ${side} @ ${entryPrice}`);
}

function clearPosition(symbol, timeframe) {
  if (positions?.[symbol]?.[timeframe]) {
    positions[symbol][timeframe] = null;
    console.log(`🧹 포지션 해제됨: ${symbol} (${timeframe}분)`);
  }
}

function hasOpenPosition(symbol, timeframe) {
  return !!positions?.[symbol]?.[timeframe];
}

function getAllPositions() {
  return positions;
}

module.exports = {
  getPosition,
  setPosition,
  clearPosition,
  hasOpenPosition,
  getAllPositions
};
