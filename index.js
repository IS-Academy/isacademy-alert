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

    // 시간 변환 (UTC → KST)
    const utcDate = new Date(alert.time);
    const kstDate = new Date(utcDate.getTime() + 9 * 60 * 60 * 1000);
    const formattedTime = kstDate.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
    
    const type = alert.type || '📢 알림 도착!';
    const price = parseFloat(alert.price).toFixed(2); // 소수점 2자리
    const symbol = alert.symbol || 'Unknown';
    const price = alert.price ? parseFloat(alert.price).toFixed(2) : 'N/A';
    const url = `https://api.telegram.org/bot${config.TELEGRAM_BOT_TOKEN}/sendMessage`;

    // 메시지 포맷 분기
    let message = '';
    if (type.includes('진입 준비')) {
      message = `${type}\n\n📌 종목: ${symbol}`;
    } else {
      message = `${type}\n\n📌 종목: ${symbol}\n💰 가격: ${price}\n🕒 시간: ${formattedTime}`;
    }

    await axios.post(url, {
      chat_id: config.TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: 'Markdown', // *강조* 효과 가능
    });

    res.status(200).send('✅ 텔레그램 전송 성공');
  } catch (err) {
    console.error('❌ 텔레그램 전송 실패:', err.message);
    res.status(500).send('서버 오류');
  }
});

// 상태 확인용
app.get('/', (req, res) => {
  res.send('✅ IS Academy Webhook 서버 작동 중');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 서버 실행 중: 포트 ${PORT}`);
});
