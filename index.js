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

// 🔁 Render 재시작 트리거용 의미 없는 변경
console.log("♻️ 커밋 트리거용 로그 - 서버 재시작 유도");
