// ✅👇 index.js

// 환경설정 로드 (.env)
require('dotenv').config();

// 모듈 불러오기
const express = require('express');
const bodyParser = require('body-parser');
const dummyHandler = require('./dummyHandler');
const webhookHandler = require('./webhookHandler');
const { loadBotState, setAdminMessageId, getAdminMessageId } = require('./utils');
const { sendToAdmin } = require('./botManager');
const sendBotStatus = require('./commands/status');

// 앱 초기화
const app = express();
const PORT = process.env.PORT || 3000;

// 전역 봇 상태 로드
const { choiEnabled, mingEnabled } = loadBotState();
global.choiEnabled = choiEnabled;
global.mingEnabled = mingEnabled;

// JSON 파싱 미들웨어
app.use(bodyParser.json());

// 라우팅 설정
app.use('/dummy', dummyHandler);
app.post('/webhook', webhookHandler);
app.get('/', (req, res) => {
  res.send('✅ IS Academy Webhook 서버 작동 중입니다.');
});

// 서버 시작
app.listen(PORT, async () => {
  console.log(`🚀 서버 실행 완료: http://localhost:${PORT}`);

  // ✅ 서버가 완전히 시작된 후 관리자 패널 초기화
  const statusMsg = "📡 <b>IS 관리자봇 패널</b>\n───────────────\n✅ 서버가 시작되었습니다. 관리자 패널이 초기화됩니다.";
  try {
    const sent = await sendToAdmin(statusMsg);
    if (sent?.data?.result) {
      setAdminMessageId(sent.data.result.message_id);
      console.log('✅ 관리자 패널 자동 초기화 완료');
    } else {
      console.warn('⚠️ 관리자 패널 자동 초기화 메시지 전송 실패: 메시지 결과 없음');
    }
  } catch (err) {
    console.error('❌ 관리자 패널 초기화 실패:', err.message);
  }

  // 상태패널 바로 초기화
  const timeStr = new Date().toISOString();
  await sendBotStatus(timeStr, '', process.env.ADMIN_CHAT_ID, getAdminMessageId());
});
