//✅👇 MessageTemplates.test.js

const { getTemplate } = require('../MessageTemplates');
const { translations } = require('../lang');

const ts = Math.floor(Date.now() / 1000);
const langs = ['ko', 'en', 'zh', 'jp'];

const baseData = {
  symbol: 'BTCUSDT.P',
  timeframe: '1',
  price: 62500,
  ts,
  entryCount: 1,
  entryAvg: '60000',
  leverage: 50
};

const signalTypes = [
  'showSup', 'showRes', 'isBigSup', 'isBigRes',
  'exitLong', 'exitShort',
  'Ready_showSup', 'Ready_showRes', 'Ready_isBigSup', 'Ready_isBigRes',
  'Ready_exitLong', 'Ready_exitShort'
];

console.log(`🧪 MessageTemplates 다국어 테스트 시작...\n`);

langs.forEach(lang => {
  console.log(`\n===== 🌐 [${lang.toUpperCase()}] 언어 =====\n`);
  signalTypes.forEach(type => {
    try {
      const message = getTemplate({ ...baseData, type, lang });
      console.log(`✅ ${type}\n${message}\n`);
    } catch (err) {
      console.error(`❌ ${type} 에러 (${lang}):`, err.message);
    }
  });
});
