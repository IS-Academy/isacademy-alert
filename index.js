// ✅ index.js

require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const dummyHandler = require('./dummyHandler');
const webhookHandler = require('./webhookHandler');
const { loadBotState } = require('./utils');

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ 봇 상태 로드
const { choiEnabled, mingEnabled } = loadBotState();
global.choiEnabled = choiEnabled;
global.mingEnabled = mingEnabled;

// ✅ 미들웨어 등록
app.use(bodyParser.json());

// ✅ 라우팅
app.use('/dummy', dummyHandler);
app.post('/webhook', webhookHandler);

// ✅ 헬스체크
app.get('/', (req, res) => {
  res.send('✅ IS Academy Webhook 서버 작동 중입니다.');
});

// ✅ 서버 시작
app.listen(PORT, () => {
  console.log(`🚀 서버 실행 완료: http://localhost:${PORT}`);
});
