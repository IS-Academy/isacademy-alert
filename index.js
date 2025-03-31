// index.js - HTML 메시지 + 종목/가격 강조
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

    // 기본 값 설정
    const type = alert.type || '📢 알림';
    const symbol = alert.symbol || 'Unknown';
    const timeframe = alert.timeframe || '⏳ 없음';
    const price = alert.price ? parseFloat(alert.price).toFixed(2) : 'N/A';
    const formattedTime = alert.time || '시간 없음';

    // 시간 변환 (UTC → KST)
    const utcDate = new Date(alert.time);
    const kstDate = new Date(utcDate.getTime() + 9 * 60 * 60 * 1000);
    const formattedTime = kstDate.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });


    // 메시지 구성
    let emoji = '';
    let title = '';

    if (type.includes('Ready_Support')) emoji = '🩵', title = `${emoji} 롱 진입 대기`;
    else if (type.includes('Ready_Resistance')) emoji = '❤️', title = `${emoji} 숏 진입 대기`;
    else if (type.includes('Ready_is_Big_Support')) emoji = '🚀', title = `${emoji} 강한 롱 진입 대기`;
    else if (type.includes('Ready_is_Big_Resistance')) emoji = '🛸', title = `${emoji} 강한 숏 진입 대기`;
    else if (type.includes('show_Support')) emoji = '🩵', title = `${emoji} 롱 진입`;
    else if (type.includes('show_Resistance')) emoji = '❤️', title = `${emoji} 숏 진입`;
    else if (type.includes('is_Big_Support')) emoji = '🚀', title = `${emoji} 강한 롱 진입`;
    else if (type.includes('is_Big_Resistance')) emoji = '🛸', title = `${emoji} 강한 숏 진입`;
    else if (type.includes('Ready_exitLong')) emoji = '💲', title = `${emoji} 롱 청산 대기`;
    else if (type.includes('Ready_exitShort')) emoji = '💲', title = `${emoji} 숏 청산 대기`;
    else if (type.includes('exitLong')) emoji = '💰', title = `${emoji} 롱 청산`;
    else if (type.includes('exitShort')) emoji = '💰', title = `${emoji} 숏 청산`;
    else emoji = '🔔', title = `${emoji} ${type}`;

    // 📬 HTML 메시지 조립
    const body = `📌 <b>종목</b>: ${symbol}<br>` +
                 `⏱️ 타임프레임: ${timeframe}<br>` +
                 `💲 <b>가격</b>: ${price}<br>` +
                 `🕒 포착시간: ${formattedTime}`;

    const message = `<b>${title}</b><br><br>${body}`;

    // 전송
    const url = `https://api.telegram.org/bot${config.TELEGRAM_BOT_TOKEN}/sendMessage`;
    await axios.post(url, {
      chat_id: config.TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: 'HTML'
    });

    res.status(200).send('✅ 텔레그램 전송 성공');
  } catch (err) {
    console.error('❌ 텔레그램 전송 실패:', err.message);
    res.status(500).send('서버 오류');
  }
});

// 상태 확인
app.get('/', (req, res) => {
  res.send('✅ IS Academy Webhook 서버 작동 중');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 서버 실행 중: 포트 ${PORT}`);
});
