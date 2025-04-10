// ✅👇 index.js

require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const dummyHandler = require('./dummyHandler');
const webhookHandler = require('./webhookHandler');
const { loadBotState, setAdminMessageId, getAdminMessageId } = require('./utils');
const { sendTextToBot } = require('./botManager');
const config = require('./config');

const app = express();
const PORT = process.env.PORT || 3000;

const { choiEnabled, mingEnabled } = loadBotState();
global.choiEnabled = choiEnabled;
global.mingEnabled = mingEnabled;

app.use(bodyParser.json());

app.use('/dummy', dummyHandler);
app.post('/webhook', webhookHandler);
app.get('/', (req, res) => res.send('✅ IS Academy Webhook 서버 작동 중입니다.'));

async function initAdminPanel() {
  const statusMsg = "📡 <b>IS 관리자봇 패널</b>\n서버가 시작되었습니다. 관리자 패널을 자동 초기화합니다.";

  try {
    const sent = await sendTextToBot('admin', config.ADMIN_CHAT_ID, statusMsg, null, { parse_mode: 'HTML' });

    if (sent && sent.data && sent.data.result && sent.data.result.message_id) {
      const messageId = sent.data.result.message_id;
      setAdminMessageId(messageId);
      console.log("✅ 관리자 패널 초기화 성공, messageId 저장:", messageId);
    } else {
      throw new Error("관리자 메시지 전송 결과 없음");
    }
  } catch (err) {
    console.error("❌ 관리자 패널 초기화 실패:", err.message);
  }
}

// 서버 시작 후 관리자 패널을 완벽히 자동 초기화
initAdminPanel().then(() => {
  // 메시지 생성 완료 후 서버 실행
  app.listen(PORT, () => {
    console.log(`🚀 서버 실행 완료: http://localhost:${PORT}`);
  });
});
