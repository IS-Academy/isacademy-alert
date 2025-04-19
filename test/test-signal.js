//✅👇 test-signal.js

require('dotenv').config();
const { handleTradeSignal } = require('../trader-gate/tradeSignalHandler');

// 예제 시그널
const testSignal = {
  side: 'short',
  symbol: process.env.TRADE_SYMBOL || 'BTC_USDT',
  timeframe: '5',
  entryAvg: 59000,
  amount: 0.002,
  isExit: false,
  orderType: 'market'
};

(async () => {
  await handleTradeSignal(testSignal);
})();
