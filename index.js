//✅👇 index.js (최종 수정본)

require('dotenv').config();
const express = require('express');

// 🔹 telegram 폴더에서 모듈 불러오기
const dummyHandler = require('./telegram/dummyHandler');
const webhookHandler = require('./telegram/webhookHandler');
const captureApi = require('./telegram/routes/captureApi');
const { loadBotState } = require('./telegram/utils');
const { initAdminPanel } = require('./telegram/commands/status');

const app = express();
const PORT = process.env.PORT || 3000;

// 🌍 글로벌 상태 로딩
const { choiEnabled, mingEnabled } = loadBotState();
global.choiEnabled = choiEnabled;
global.mingEnabled = mingEnabled;

// 📦 Middleware
app.use(express.json()); // 🚨 이 부분을 express.json()으로 변경 (필수)

// ✅ 라우트 등록 (변경된 파일 경로에 맞게)
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
