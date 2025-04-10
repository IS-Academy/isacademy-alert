// ✅👇 index.js

require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const dummyHandler = require('./dummyHandler');
const webhookHandler = require('./webhookHandler');
const { loadBotState, setAdminMessageId } = require('./utils');
const { sendToAdmin } = require('./botManager');

const app = express();
const PORT = process.env.PORT || 3000;

const { choiEnabled, mingEnabled } = loadBotState();
global.choiEnabled = choiEnabled;
global.mingEnabled = mingEnabled;

app.use(bodyParser.json());
app.use('/dummy', dummyHandler);
app.post('/webhook', webhookHandler);
app.get('/', (req, res) => res.send('✅ IS Academy Webhook 서버 작동 중입니다.'));

// 서버 시작 시점에서 초기화 메시지 명확히 한 번만 호출
app.listen(PORT, async () => {
  console.log(`🚀 서버 실행 완료: http://localhost:${PORT}`);

  const statusMsg = "/start";  // 정확히 '/start' 명령을 관리자에게 채팅으로 보냅니다.

  try {
    const sent = await sendToAdmin(statusMsg);
    if (sent?.data?.result) {
      setAdminMessageId(sent.data.result.message_id);
      console.log('✅ 관리자 패널 초기화 완료 (/start)');
    } else {
      console.error('❌ 관리자 패널 초기화 실패: 메시지 결과 없음');
    }
  } catch (err) {
    console.error('❌ 관리자 패널 초기화 오류 발생:', err.message);
  }
});
