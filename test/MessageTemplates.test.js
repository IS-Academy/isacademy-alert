// ✅ MessageTemplates.test.js

const { getTemplate } = require('../MessageTemplates');
const { translations } = require('../lang');

const testData = {
  type: 'exitShort',
  symbol: 'BTCUSDT.P',
  timeframe: '5min',
  price: '86365.40',
  ts: Math.floor(Date.now() / 1000),
  entryCount: 1,
  entryAvg: '75138.70'
};

const langs = ['ko', 'en', 'zh', 'jp'];

langs.forEach(lang => {
  // 실전 방식 그대로 적용
  const message = getTemplate({ ...testData, lang });
  console.log(`\n===== [${lang.toUpperCase()}] 메시지 출력 =====\n`);
  console.log(message);
});

