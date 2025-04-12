// ✅ index.js - 서버 실행 + 콜백 로그 처리

require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { Telegraf } = require('telegraf');
const sendBotStatus = require('./commands/status');
const dummyHandler = require('./dummyHandler');
const webhookHandler = require('./webhookHandler');
const captureApi = require('./routes/captureApi');
const { loadBotState } = require('./utils');

const app = express();
const PORT = process.env.PORT || 3000;

const { choiEnabled, mingEnabled } = loadBotState();
global.choiEnabled = choiEnabled;
global.mingEnabled = mingEnabled;

app.use(bodyParser.json());

app.use('/dummy', dummyHandler);
app.post('/webhook', webhookHandler);
app.use('/capture', captureApi);

app.get('/', (req, res) => res.send('✅ IS Academy Webhook 서버 작동 중입니다.'));

async function initAdminPanel() {
  const sent = await sendBotStatus();
  if (sent && sent.data?.result) {
    console.log('✅ 관리자 패널 초기화 성공');
  } else {
    console.warn('⚠️ 관리자 패널 초기화 시 메시지 결과 없음');
  }
}

// ✅ 텔레그램 관리자 봇 설정
const bot = new Telegraf(process.env.ADMIN_BOT_TOKEN);

// ✅ 버튼별 로그 자동 매핑
const logMap = {
  'choi_on': '📌 [상태 갱신됨: 최실장 ON]',
  'choi_off': '📌 [상태 갱신됨: 최실장 OFF]',
  'ming_on': '📌 [상태 갱신됨: 밍밍 ON]',
  'ming_off': '📌 [상태 갱신됨: 밍밍 OFF]',
  'status': '📌 [상태 확인 요청됨]',
  'dummy_status': '📌 [더미 상태 확인 요청됨]'
};

// ✅ 버튼 클릭 시 상태 갱신
bot.on('callback_query', async (ctx) => {
  const data = ctx.callbackQuery.data;
  const chatId = ctx.chat.id;
  const messageId = ctx.callbackQuery.message.message_id;

  await sendBotStatus(undefined, data, chatId, messageId, {
    callbackQueryId: ctx.callbackQuery.id,
    callbackResponse: '✅ 상태 패널 갱신 완료',
    logMessage: logMap[data] || `📌 [버튼 클릭됨: ${data}]`
  });
});

app.listen(PORT, async () => {
  console.log(`🚀 서버 실행 완료: http://localhost:${PORT}`);
  await initAdminPanel();
  bot.launch();
});

console.log('✅ index.js 실행 시작');
