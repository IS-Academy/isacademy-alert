// ✅👇 index.js

require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const dummyHandler = require('./dummyHandler');
const webhookHandler = require('./webhookHandler');
const { loadBotState } = require('./utils');
const sendBotStatus = require('./commands/status');

const app = express();
const PORT = process.env.PORT || 3000;

const { choiEnabled, mingEnabled } = loadBotState();
global.choiEnabled = choiEnabled;
global.mingEnabled = mingEnabled;

app.use(bodyParser.json());

app.use('/dummy', dummyHandler);
app.post('/webhook', webhookHandler);

app.get('/', (req, res) => {
  res.send('✅ IS Academy Webhook 서버 작동 중입니다.');
});

app.listen(PORT, async () => {
  console.log(`🚀 서버 실행 완료: http://localhost:${PORT}`);

  // 서버 시작 후 상태 패널을 자동으로 초기화합니다.
  try {
    const timeStr = new Date().toISOString();
    await sendBotStatus(timeStr);
    console.log('✅ 관리자 패널 자동 초기화 완료');
  } catch (err) {
    console.error('❌ 관리자 패널 초기화 실패:', err.message);
  }
});
