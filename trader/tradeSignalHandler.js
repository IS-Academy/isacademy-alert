// ✅ /trader/tradeSignalHandler.js

const { placeLongOrder } = require('./gateExecutor');
// 🔜 placeShortOrder도 나중에 추가 예정

/**
 * 자동매매 신호를 받아 실행하는 핸들러
 * @param {Object} signal - 신호 객체
 * @param {string} signal.side - 'long' 또는 'short'
 * @param {string} signal.symbol - 거래 페어 (예: BTC_USDT)
 * @param {number} signal.entryAvg - 진입 기준가
 * @param {number} signal.amount - 주문 수량
 */
async function handleTradeSignal({ side, symbol, entryAvg, amount }) {
  try {
    if (side === 'long') {
      console.log(`🚀 롱 진입 실행: ${symbol} @ ${entryAvg}`);
      await placeLongOrder({ pair: symbol, price: entryAvg, amount });
    } else if (side === 'short') {
      console.log(`🔻 숏 진입 실행: ${symbol} @ ${entryAvg}`);
      // placeShortOrder() 나중에 추가
      console.warn('⚠️ 숏 주문 기능은 아직 준비 중입니다.');
    } else {
      console.warn('❗알 수 없는 신호 방향:', side);
    }
  } catch (err) {
    console.error('❌ 자동매매 실행 중 오류 발생:', err.message);
  }
}

module.exports = {
  handleTradeSignal
};
