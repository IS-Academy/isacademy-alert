// ✅👇 index.js

require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const dummyHandler = require('./dummyHandler');
const webhookHandler = require('./webhookHandler');
const { loadBotState, setAdminMessageId } = require('./utils');
const { sendTextToBot } = require('./botManager');
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

// 최초 관리자 메시지 전송 로직 개선
async function initAdminPanel() {
  const ADMIN_CHAT_ID = config.ADMIN_CHAT_ID;
  const startMessage = "📡 <b>IS 관리자봇 패널</b>\n서버가 시작되었습니다. 관리자 패널이 초기화됩니다.";

  try {
    const sent = await sendTextToBot('admin', ADMIN_CHAT_ID, startMessage, null, { parse_mode: 'HTML' });
    
    if (sent?.data?.result?.message_id) {
      setAdminMessageId(sent.data.result.message_id);
      console.log("✅ 관리자 패널 초기화 완료:", sent.data.result.message_id);

      // 초기화된 메시지 ID를 기반으로 상태 패널로 즉시 업데이트
      await sendBotStatus();
    } else {
      console.warn("⚠️ 최초 메시지 전송 시 메시지 결과 없음, 상태 메시지로 즉시 대체합니다.");

      // 최초 메시지 전송 결과가 명확하지 않으면, 상태 메시지를 바로 보냄
      const fallbackSent = await sendBotStatus();

      if (fallbackSent?.data?.result?.message_id) {
        setAdminMessageId(fallbackSent.data.result.message_id);
        console.log("✅ 최초 상태 메시지로 대체하여 관리자 패널 초기화 성공:", fallbackSent.data.result.message_id);
      } else {
        throw new Error("관리자 메시지 전송 결과 없음 (상태 메시지로 대체 실패)");
      }
    }
  } catch (err) {
    console.error("❌ 관리자 패널 초기화 실패:", err.message);
  }
}

// 서버가 포트를 완전히 열고 나서 실행
app.listen(PORT, async () => {
  console.log(`🚀 서버 실행 완료: http://localhost:${PORT}`);
  await initAdminPanel();
});

