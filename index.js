//✅👇 index.js (최종 수정본)

require('dotenv').config();
const express = require('express');
const dummyHandler = require('./dummyHandler');
const webhookHandler = require('./webhookHandler');
const captureApi = require('./routes/captureApi');
const { loadBotState } = require('./utils');
const { initAdminPanel } = require('./commands/status');

const app = express();
const PORT = process.env.PORT || 3000;

const { choiEnabled, mingEnabled } = loadBotState();
global.choiEnabled = choiEnabled;
global.mingEnabled = mingEnabled;

app.use(express.json()); // 🚨 이 부분을 express.json()으로 변경 (필수)

// ✅ 라우트 등록
app.use('/dummy', dummyHandler);
app.post('/webhook', webhookHandler);
app.use('/capture', captureApi);

// ✅ 기본 루트
app.get('/', (req, res) => res.send('✅ IS Academy Webhook 서버 작동 중입니다.'));

app.listen(PORT, async () => {
  console.log(`🚀 서버 실행 완료: http://localhost:${PORT}`);
  await initAdminPanel();
});

console.log("✅ index.js 실행 시작");

// ✅ 서버 재시작용 라우트 (관리자용)
app.get('/restart', (req, res) => {
  res.send('♻️ 서버가 곧 재시작됩니다...');
  console.log('🌀 /restart 호출됨 → 서버 종료 후 재시작 예정');
  setTimeout(() => process.exit(0), 500); // 0.5초 뒤 안전하게 종료
});
