// ✅👇 index.js

require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const dummyHandler = require('./dummyHandler');
const webhookHandler = require('./webhookHandler');
const { loadBotState, setAdminMessageId, getAdminMessageId } = require('./utils');
const { sendToAdmin } = require('./botManager');
const sendBotStatus = require('./commands/status');

const app = express();
const PORT = process.env.PORT || 3000;

const { choiEnabled, mingEnabled } = loadBotState();
global.choiEnabled = choiEnabled;
global.mingEnabled = mingEnabled;

app.use(bodyParser.json());
app.use('/dummy', dummyHandler);
app.post('/webhook', webhookHandler);
app.get('/', (req, res) => res.send('✅ IS Academy Webhook 서버 작동 중입니다.'));

app.listen(PORT, async () => {
  console.log(`🚀 서버 실행 완료: http://localhost:${PORT}`);

  try {
    const statusMsg = "📡 <b>IS 관리자봇 패널</b>\n───────────────\n✅ 서버가 시작되었습니다. 관리자 패널이 초기화됩니다.";
    const sent = await sendToAdmin(statusMsg);

    if (sent?.data?.result) {
      setAdminMessageId(sent.data.result.message_id);
      console.log('✅ 관리자 패널 자동 초기화 완료');
    } else {
      console.warn('⚠️ 관리자 패널 자동 초기화 메시지 전송 결과가 명확하지 않아 재전송을 시도합니다.');
      // 재전송 (명확한 결과가 없을 때만)
      const retrySent = await sendToAdmin(statusMsg);
      if (retrySent?.data?.result) {
        setAdminMessageId(retrySent.data.result.message_id);
        console.log('✅ 관리자 패널 재전송 후 초기화 성공');
      } else {
        console.error('❌ 재전송 후에도 관리자 패널 초기화 실패');
      }
    }
  } catch (err) {
    console.error('❌ 관리자 패널 초기화 과정에서 예외 발생:', err.message);
  }

  // 항상 최종 상태패널 바로 초기화
  const timeStr = new Date().toISOString();
  await sendBotStatus(timeStr, '', process.env.ADMIN_CHAT_ID, getAdminMessageId());
});
