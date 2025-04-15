// ✅ /trader-gate/tradeSignalHandler.js

const { placeLongOrder, placeShortOrder } = require('./gateExecutor');
const {
  getPosition,
  setPosition,
  clearPosition,
  hasOpenPosition
} = require('./positionManager');
const { logTrade } = require('./tradeLogger');

/**
 * 자동매매 신호를 받아 실행하는 핸들러
 * @param {Object} signal - 신호 객체
 * @param {string} signal.side - 'long' 또는 'short'
 * @param {string} signal.symbol - 거래 페어 (예: BTC_USDT)
 * @param {string} signal.timeframe - 타임프레임 (예: '1', '5')
 * @param {number} signal.entryAvg - 진입 기준가
 * @param {number} signal.amount - 주문 수량
 * @param {boolean} signal.isExit - true이면 청산, 아니면 진입
 * @param {string} signal.orderType - 'market' | 'limit'
 */
async function handleTradeSignal({ side, symbol, timeframe, entryAvg, amount = 0.001, isExit = false, orderType = 'limit' }) {
  try {
    const hasPosition = hasOpenPosition(symbol, timeframe);

    if (isExit) {
      if (hasPosition) {
        console.log(`🧯 청산 실행: ${symbol} (${timeframe}분) ${side.toUpperCase()}`);
        clearPosition(symbol, timeframe);
        logTrade({
          symbol,
          side,
          price: entryAvg,
          amount,
          type: 'exit',
          status: 'success'
        });
      } else {
        console.log(`⛔ 청산 요청 무시됨: ${symbol} (${timeframe}분) → 포지션 없음`);
      }
    } else {
      if (hasPosition) {
        console.log(`⛔ 이미 포지션 보유중: ${symbol} (${timeframe}분)`);
        return;
      }

      let result = null;
      if (side === 'long') {
        console.log(`🚀 롱 진입 실행: ${symbol} @ ${entryAvg}`);
        result = await placeLongOrder({ pair: symbol, price: entryAvg, amount, orderType });
      } else if (side === 'short') {
        console.log(`🔻 숏 진입 실행: ${symbol} @ ${entryAvg}`);
        result = await placeShortOrder({ pair: symbol, price: entryAvg, amount, orderType });
      } else {
        console.warn('❗알 수 없는 신호 방향:', side);
      }

      logTrade({
        symbol,
        side,
        price: entryAvg,
        amount,
        type: 'entry',
        status: result ? 'success' : 'fail'
      });

      if (result) setPosition(symbol, timeframe, side, entryAvg);
    }
  } catch (err) {
    console.error('❌ 자동매매 실행 중 오류 발생:', err.message);
  }
}

module.exports = {
  handleTradeSignal
};
