// ✅👇 index.js

require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const dummyHandler = require('./dummyHandler');
const webhookHandler = require('./webhookHandler');
const { loadBotState, setAdminMessageId } = require('./utils');
const { sendTextToBot, inlineKeyboard } = require('./botManager');
const sendBotStatus = require('./commands/status');
const config = require('./config');

const app = express();
const PORT = process.env.PORT || 3000;

// 봇 상태 로드
const { choiEnabled, mingEnabled } = loadBotState();
global.choiEnabled = choiEnabled;
global.mingEnabled = mingEnabled;

app.use(bodyParser.json());

// 라우팅 설정
app.use('/dummy', dummyHandler);
app.post('/webhook', webhookHandler);

app.get('/', (req, res) => res.send('✅ IS Academy Webhook 서버 작동 중입니다.'));

// 최초 메시지를 키보드 UI를 포함한 상태 메시지로 전송
async function initAdminPanel() {
  const ADMIN_CHAT_ID = config.ADMIN_CHAT_ID;

  try {
    // 최초 메시지를 상태 패널로 바로 보냄 (키보드 UI 포함)
    const sent = await sendBotStatus();

    if (sent?.data?.result?.message_id) {
      setAdminMessageId(sent.data.result.message_id);
      console.log("✅ 최초 관리자 패널 메시지 생성 성공:", sent.data.result.message_id);
    } else {
      throw new Error("상태 메시지 전송 결과 없음");
    }
  } catch (err) {
    console.error("❌ 관리자 패널 초기화 실패:", err.message);
  }
}

// 서버 시작 후 관리자 패널 초기화
app.listen(PORT, async () => {
  console.log(`🚀 서버 실행 완료: http://localhost:${PORT}`);
  await initAdminPanel();
});


