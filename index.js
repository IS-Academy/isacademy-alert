// ✅👇 index.js

require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const dummyHandler = require('./dummyHandler');
const webhookHandler = require('./webhookHandler');
const captureApi = require('./routes/captureApi');
const { loadBotState } = require('./utils');
const sendBotStatus = require('./commands/status');

const app = express();
const PORT = process.env.PORT || 3000;

const { choiEnabled, mingEnabled } = loadBotState();
global.choiEnabled = choiEnabled;
global.mingEnabled = mingEnabled;

app.use(bodyParser.json());

// ✅ 라우트 등록
app.use('/dummy', dummyHandler);
app.post('/webhook', webhookHandler);
app.use('/capture', captureApi);

// ✅ 기본 루트
app.get('/', (req, res) => res.send('✅ IS Academy Webhook 서버 작동 중입니다.'));

// ✅ 관리자 패널 초기화
async function initAdminPanel() {
  const sent = await sendBotStatus();
  if (sent && sent.data && sent.data.result) {
    console.log('✅ 관리자 패널 초기화 성공');
  } else {
    console.warn('⚠️ 관리자 패널 초기화 시 메시지 결과 없음');
  }
}

app.listen(PORT, async () => {
  console.log(`🚀 서버 실행 완료: http://localhost:${PORT}`);
  await initAdminPanel();
});

console.log("✅ index.js 실행 시작");
