const { getTemplate } = require('./MessageTemplates');

const testData = {
  type: 'exitShort',
  symbol: 'BTCUSDT.P',
  timeframe: '5min',
  price: '86365.40',
  ts: Math.floor(Date.now() / 1000),
  entryCount: 1,
  entryAvg: '75138.70',
};

const langs = ['ko', 'en', 'zh', 'jp'];

langs.forEach(lang => {
  const message = getTemplate({ ...testData, lang });
  console.log(`\n===== [${lang.toUpperCase()}] 메시지 출력 =====\n`);
  console.log(message);
});
