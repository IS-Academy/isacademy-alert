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
const axios = require('axios');
const config = require('./config');
const sendBotStatus = require('./commands/status');
const { getTimeString } = require('./utils');

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

// ✅ 서버 시작시 관리자 패널 자동 초기화 (상태 메시지 전송 및 키보드 생성)
async function initAdminPanel() {
  const ADMIN_CHAT_ID = config.ADMIN_CHAT_ID;
  const ADMIN_BOT_TOKEN = config.ADMIN_BOT_TOKEN;

  const url = `https://api.telegram.org/bot${ADMIN_BOT_TOKEN}/sendMessage`;
  
  const statusMsg = "📡 <b>IS 관리자봇 패널</b>\n서버가 시작되었습니다. 관리자 패널이 초기화됩니다.";
  
  try {
    // ✅ 초기 메시지 전송 (패널 생성 메시지)
    const response = await axios.post(url, {
      chat_id: ADMIN_CHAT_ID,
      text: statusMsg,
      parse_mode: 'HTML',
    });

    // ✅ 메시지 전송 성공 시 실제 패널 생성 (inline keyboard 메시지 전송)
    if (response.data.ok) {
      const timeStr = getTimeString();
      await sendBotStatus(timeStr, '', ADMIN_CHAT_ID);
      console.log("✅ 관리자 패널 초기화 완료");
    } else {
      throw new Error("메시지 결과 없음");
    }
  } catch (err) {
    console.error("❌ 관리자 패널 초기화 메시지 전송 실패:", err.message);
  }
}

// 서버 시작 직후 바로 실행
initAdminPanel();

// ✅ 서버 시작
app.listen(PORT, () => {
  console.log(`🚀 서버 실행 완료: http://localhost:${PORT}`);
});
