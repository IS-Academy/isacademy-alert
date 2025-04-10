// ✅ index.js

// ✅ 환경설정 로드 (.env)
require('dotenv').config();

// ✅ 모듈 불러오기
const express = require('express');
const bodyParser = require('body-parser');
const dummyHandler = require('./dummyHandler');
const webhookHandler = require('./webhookHandler');
const { loadBotState } = require('./utils');

// ✅ 앱 초기화
const app = express();
const PORT = process.env.PORT || 3000;

// ✅ 전역 봇 상태 로드
const { choiEnabled, mingEnabled } = loadBotState();
global.choiEnabled = choiEnabled;
global.mingEnabled = mingEnabled;

// ✅ JSON 파싱 미들웨어
app.use(bodyParser.json());

// ✅ 라우팅 설정
// 📡 더미 수신 엔드포인트
app.use('/dummy', dummyHandler);

// 📬 트레이딩뷰 웹훅 수신
app.post('/webhook', webhookHandler);

// ✅ 헬스체크용 루트 엔드포인트
app.get('/', (req, res) => {
  res.send('✅ IS Academy Webhook 서버 작동 중입니다.');
});

// ✅ 서버 시작
app.listen(PORT, () => {
  console.log(`🚀 서버 실행 완료: http://localhost:${PORT}`);
});
