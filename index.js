// ✅👇 index.js

// 환경설정 로드 (.env)
require('dotenv').config();

// 모듈 불러오기
const express = require('express');
const bodyParser = require('body-parser');
const dummyHandler = require('./dummyHandler');
const webhookHandler = require('./webhookHandler');
const { loadBotState, setAdminMessageId } = require('./utils');
const { sendToAdmin, mainKeyboard } = require('./botManager');
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

// 루트 엔드포인트
app.get('/', (req, res) => {
  res.send('✅ IS Academy Webhook 서버 작동 중입니다.');
});

// 서버 시작
app.listen(PORT, async () => {
  console.log(`🚀 서버 실행 완료: http://localhost:${PORT}`);

  // 관리자 패널 초기화 메시지 전송
  try {
    const initMsg = "📡 <b>IS 관리자봇 패널</b>\n서버가 시작되었습니다. 상태 초기화합니다.";

    // 관리자 메시지 보내기 (메인 키보드 포함)
    const sent = await sendToAdmin(initMsg, mainKeyboard);

    // 메시지 ID 저장
    if (sent?.data?.result) {
      setAdminMessageId(sent.data.result.message_id);
      console.log('✅ 관리자 패널 초기화 성공');
      
      // 기존 관리자 패널 형태로 메시지 즉시 갱신
      await sendBotStatus('', '', sent.data.result.chat.id, sent.data.result.message_id);
    } else {
      throw new Error('메시지 전송 실패');
    }
  } catch (err) {
    console.error('❌ 관리자 패널 초기화 실패:', err);
    await sendToAdmin("📡 <b>IS 관리자봇 패널</b>\n서버가 시작되었으나 관리자 패널 초기화가 실패했습니다.", mainKeyboard);
  }
});
