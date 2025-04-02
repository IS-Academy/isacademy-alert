// index.js
const express = require('express');
const bodyParser = require('body-parser');
const webhookHandler = require('./webhookHandler');
const { loadBotState } = require('./utils');

const app = express();
app.use(bodyParser.json());

// ✅ 글로벌 상태 초기화
const { choiEnabled, mingEnabled } = loadBotState();
global.choiEnabled = choiEnabled;
global.mingEnabled = mingEnabled;

// ✅ 라우팅 설정
app.post('/webhook', webhookHandler);

app.get('/', (req, res) => {
  res.send('✅ IS Academy Webhook 서버 작동 중');
});

// ✅ 서버 실행
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 서버 실행 중: 포트 ${PORT}`);
});
