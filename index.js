// ✅👇 index.js

// ✅ 환경설정 로드 (.env)
require('dotenv').config();

// ✅ 모듈 불러오기
const express = require('express');
const bodyParser = require('body-parser');
const dummyHandler = require('./dummyHandler');
const webhookHandler = require('./webhookHandler');
const { loadBotState, setAdminMessageId } = require('./utils');
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
app.get('/', (req, res) => {
  res.send('✅ IS Academy Webhook 서버 작동 중입니다.');
});

// ✅ 서버 시작
app.listen(PORT, async () => {
  console.log(`🚀 서버 실행 완료: http://localhost:${PORT}`);

  // ✅ 서버 시작 후 자동으로 관리자 채팅에 초기 패널 활성화
  const statusMsg = "📡 <b>IS 관리자봇 패널</b>\n서버가 시작되었습니다. /start 명령이 자동실행됩니다.";
  
  try {
    const sent = await sendToAdmin(statusMsg);
    if (sent?.data?.result) setAdminMessageId(sent.data.result.message_id);
    console.log('✅ 관리자 패널 자동 초기화 완료');
  } catch (err) {
    console.error('❌ 관리자 패널 초기화 실패:', err);
  }
});
