// index.js - 다중 조건 텔레그램 알림 템플릿 (완성 버전)
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

app.post('/webhook', async (req, res) => {
  try {
    const alert = req.body;
    console.log('📩 받은 TradingView Alert:', alert);

    // 날짜 처리
    const utcDate = new Date(alert.time);
    const kstDate = new Date(utcDate.getTime() + 9 * 60 * 60 * 1000);
    const formattedTime = kstDate.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });

    // 파싱
    const type = alert.type || '📢 알림';
    const symbol = alert.symbol || 'Unknown';
    const price = alert.price ? parseFloat(alert.price).toFixed(2) : 'N/A'; //소수점 2자리

    // 메시지 분기 처리
    let message = '';

    if (type.includes('진입 준비')) {
      message = `🔔 *${type}*

📌 종목: ${symbol}`;
    } else if (type.includes('청산')) {
      message = `💰 *${type}*

📌 종목: ${symbol}
💲 종가: ${price}
📆 시간: ${formattedTime}`;
    } else if (type.includes('매수') || type.includes('매도')) {
      message = `🚀 *${type}*

📌 종목: ${symbol}
💰 가격: ${price}
🕒 시간: ${formattedTime}`;
    } else {
      message = `📢 *${type}*

📌 종목: ${symbol}
💰 가격: ${price}
🕒 시간: ${formattedTime}`;
    }

    // 텔레그램 전송
    await axios.post(TELEGRAM_API_URL, {
      chat_id: TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: 'Markdown',
    });

    res.status(200).send('✅ 텔레그램 전송 성공');
  } catch (err) {
    console.error('❌ 텔레그램 전송 실패:', err.message);
    res.status(500).send('서버 오류');
  }
});

app.get('/', (req, res) => {
  res.send('✅ IS Academy Webhook 서버 작동 중');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 서버 실행 중: 포트 ${PORT}`);
});
