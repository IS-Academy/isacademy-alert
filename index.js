// index.js - HTML 스타일 + 타임프레임 + 이모지 + 진입 종류별 메시지
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

    // 기본값 추출
    const type = alert.type || '📢 알림';
    const symbol = alert.symbol || 'Unknown';
    const timeframe = alert.timeframe || '⏳ 타임프레임 없음';
    const price = alert.price ? parseFloat(alert.price).toFixed(2) : 'N/A';

    // ✅ 시간 변환 (UTC → KST)
    const utcDate = new Date(alert.time);
    const kstDate = new Date(utcDate.getTime() + 9 * 60 * 60 * 1000);
    const formattedTime = kstDate.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });

    // 메시지 구성
    let emoji = '';
    let title = '';

    // 🎯 메시지 분기
    if (type.includes('Ready_Support')) {
      emoji = '🩵'; title = `${emoji} 롱 진입 대기`;
    } else if (type.includes('Ready_Resistance')) {
      emoji = '❤️'; title = `${emoji} 숏 진입 대기`;
    } else if (type.includes('Ready_is_Big_Support')) {
      emoji = '🚀'; title = `${emoji} 강한 롱 진입 대기`;
    } else if (type.includes('Ready_is_Big_Resistance')) {
      emoji = '🛸'; title = `${emoji} 강한 숏 진입 대기`;
    } else if (type.includes('show_Support')) {
      emoji = '🩵'; title = `${emoji} 롱 진입`;
    } else if (type.includes('show_Resistance')) {
      emoji = '❤️'; title = `${emoji} 숏 진입`;
    } else if (type.includes('is_Big_Support')) {
      emoji = '🚀'; title = `${emoji} 강한 롱 진입`;
    } else if (type.includes('is_Big_Resistance')) {
      emoji = '🛸'; title = `${emoji} 강한 숏 진입`;
    } else if (type.includes('Ready_exitLong')) {
      emoji = '💲'; title = `${emoji} 롱 청산 대기`;
    } else if (type.includes('Ready_exitShort')) {
      emoji = '💲'; title = `${emoji} 숏 청산 대기`;
    } else if (type.includes('exitLong')) {
      emoji = '💰'; title = `${emoji} 롱 청산`;
    } else if (type.includes('exitShort')) {
      emoji = '💰'; title = `${emoji} 숏 청산`;
    } else {
      emoji = '🔔'; title = `${emoji} ${type}`;
    }

    // 📬 HTML 메시지 조립
    const message = `<b>${title}</b>\n\n` +
                    `📌 <b>종목:</b> <code>${symbol}</code>\n` +
                    `⏱️ <b>타임프레임:</b> ${timeframe}\n` +
                    `💲 <b>가격:</b> <code>${price}</code>\n` +
                    `🕒 <b>포착시간:</b> ${formattedTime}`;

    // 텔레그램 전송
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

// 상태 확인용
app.get('/', (req, res) => {
  res.send('✅ IS Academy Webhook 서버 작동 중');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 서버 실행 중: 포트 ${PORT}`);
});
