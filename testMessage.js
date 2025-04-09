// testMessage.js

const { formatSignalMessage } = require('./handlers/messageTemplateManager');

const testData = {
  symbol: 'BTCUSDT.P',
  timeframe: '5min',
  price: '86365.40',
  entry: { percent: 1, avgPrice: '75138.70' },
  result: { pnl: '+14.95%', roe: '+0.74%' },
  time: '2025. 04. 09. (수)\n오전 09:00:00'
};

const langs = ['ko', 'en', 'zh', 'jp'];

langs.forEach(lang => {
  const message = formatSignalMessage('exitShort', testData, lang);
  console.log(`\n===== [${lang.toUpperCase()}] 메시지 출력 =====\n`);
  console.log(message);
});

