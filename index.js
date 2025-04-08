// index.js
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');

const dummyHandler = require('./dummyHandler');
const webhookHandler = require('./webhookHandler');
const { loadBotState } = require('./utils');

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ JSON 요청 파싱
app.use(bodyParser.json());

// ✅ 글로벌 봇 상태 초기화
const { choiEnabled, mingEnabled } = loadBotState();
global.choiEnabled = choiEnabled;
global.mingEnabled = mingEnabled;

// ✅ 라우팅
app.use('/dummy', dummyHandler);
app.post('/webhook', webhookHandler);

app.get('/', (req, res) => {
  res.send('✅ IS Academy Webhook 서버 작동 중입니다.');
});

// ✅ 서버 시작
app.listen(PORT, () => {
  console.log(`🚀 서버 실행 완료: http://localhost:${PORT}`);
});
