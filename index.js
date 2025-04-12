// ✅👇 index.js - Express 서버 전용

require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const dummyHandler = require('./dummyHandler');
const webhookHandler = require('./webhookHandler');
const captureApi = require('./routes/captureApi');
const { initAdminBot } = require('./commands/status'); // ✅ 관리자봇 분리된 실행

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ 라우트 등록
app.use(bodyParser.json());
app.use('/dummy', dummyHandler);
app.post('/webhook', webhookHandler);
app.use('/capture', captureApi);

// ✅ 기본 루트
app.get('/', (req, res) => res.send('✅ IS Academy Webhook 서버 작동 중입니다.'));

app.listen(PORT, async () => {
  console.log(`🚀 서버 실행 완료: http://localhost:${PORT}`);
  await initAdminBot(); // ✅ 깔끔하게 실행만 연결
});

console.log('✅ index.js 실행 시작');
