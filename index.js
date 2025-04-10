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
const sendBotStatus = require('./commands/status');

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
app.use('/dummy', dummyHandler);
app.post('/webhook', webhookHandler);

// ✅ 루트 헬스체크
app.get('/', (req, res) => {
  res.send('✅ IS Academy Webhook 서버 작동 중입니다.');
});

// ✅ 서버 시작 및 자동 /start 명령어 실행
app.listen(PORT, async () => {
  console.log(`🚀 서버 실행 완료: http://localhost:${PORT}`);

  const fakeUpdate = {
    message: {
      chat: { id: process.env.ADMIN_CHAT_ID },
      text: '/start'
    }
  };

  try {
    // /start 명령어와 같은 효과를 내도록 webhookHandler 호출
    await webhookHandler({ body: fakeUpdate }, { sendStatus: () => {} });
    console.log('✅ 관리자 패널 (/start) 자동 초기화 완료');
  } catch (err) {
    console.error('❌ 관리자 패널 초기화 실패:', err);
    const errorMsg = "📡 <b>IS 관리자봇 패널</b>\n서버가 시작되었습니다만, 자동 초기화가 실패했습니다.";
    const sent = await sendToAdmin(errorMsg);
    if (sent?.data?.result) setAdminMessageId(sent.data.result.message_id);
  }
});
