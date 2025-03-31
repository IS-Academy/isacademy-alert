// index.js
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const config = require('./config');

const app = express();
app.use(bodyParser.json());

// 웹훅 수신
app.post('/webhook', async (req, res) => {
  try {
    const alert = req.body;
    console.log('📩 받은 TradingView Alert:', alert);

    // 한국 시간 변환
    const utcDate = new Date(alert.time);
    const kstDate = new Date(utcDate.getTime() + 9 * 60 * 60 * 1000);
    const formattedTime = kstDate.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });

    const type = alert.type || '📢 알림 도착!';
    const symbol = alert.symbol || 'Unknown';
    const price = alert.price || 'N/A';

    // 기본 메시지 템플릿
    let message = `${type}\n\n📌 종목: ${symbol}\n💰 가격: ${price}\n🕒 시간: ${formattedTime}`;

    // 예: 특정 알림 타입에 따라 커스텀
    if (type.includes('강한 매도')) {
      message = `🛸 *강한 매도 신호!*\n\n📌 종목: ${symbol}\n💰 가격: ${price}\n🕒 ${formattedTime}`;
    } else if (type.includes('강한 매수')) {
      message = `🚀 *강한 매수 신호!*\n\n📌 종목: ${symbol}\n💰 가격: ${price}\n🕒 ${formattedTime}`;
    } else if (type.includes('매도 조건')) {
      message = `❤️ 매도 조건 발생\n\n📌 종목: ${symbol}\n💰 가격: ${price}\n🕒 ${formattedTime}`;
    } else if (type.includes('매수 조건')) {
      message = `🩵 매수 조건 발생\n\n📌 종목: ${symbol}\n💰 가격: ${price}\n🕒 ${formattedTime}`;
    } else if (type.includes('청산')) {
      message = `💲 포지션 청산\n\n📌 종목: ${symbol}\n💰 가격: ${price}\n🕒 ${formattedTime}`;
    }

    const url = `https://api.telegram.org/bot${config.TELEGRAM_BOT_TOKEN}/sendMessage`;

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
