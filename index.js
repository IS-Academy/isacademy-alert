// ✅👇 index.js

// ✅ 환경설정 로드 (.env)
require('dotenv').config();

// ✅ 모듈 불러오기
const express = require('express');
const bodyParser = require('body-parser');
const dummyHandler = require('./dummyHandler');
const webhookHandler = require('./webhookHandler');
const { loadBotState } = require('./utils');
const { sendToAdmin } = require('./botManager');

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
app.get('/', (req, res) => res.send('✅ IS Academy Webhook 서버 작동 중입니다.'));

// ✅ 서버 시작시 관리자에게 명확히 '/start' 메시지 전송 (초기화)
app.listen(PORT, async () => {
  console.log(`🚀 서버 실행 완료: http://localhost:${PORT}`);
  try {
    const sent = await sendToAdmin("/start");
    if (sent?.data?.result) {
      console.log('✅ 관리자 패널 초기화 완료');
    } else {
      console.error('❌ 관리자 패널 초기화 메시지 전송 실패: 메시지 결과 없음');
    }
  } catch (err) {
    console.error('❌ 관리자 패널 초기화 오류:', err.message);
  }
});
