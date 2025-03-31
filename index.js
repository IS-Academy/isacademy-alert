// index.js
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const config = require('./config');

const app = express();
app.use(bodyParser.json());

app.post('/webhook', async (req, res) => {
  try {
    const alert = req.body;
    console.log('📩 받은 TradingView Alert:', alert);

    const message = JSON.stringify(alert, null, 2); // 들여쓰기 2칸 포함
    const url = `https://api.telegram.org/bot${config.TELEGRAM_BOT_TOKEN}/sendMessage`;

    await axios.post(url, {
      chat_id: config.TELEGRAM_CHAT_ID,
      text: message,
    });

    res.status(200).send('✅ 텔레그램 전송 성공');
  } catch (err) {
    console.error('❌ 텔레그램 전송 실패:', err.message);
    res.status(500).send('서버 오류');
  }
});

app.get('/', (req, res) => {
  res.send('IS Academy Webhook 서버 작동 중');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 서버 실행 중: 포트 ${PORT}`);
});
