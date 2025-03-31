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

    // ✅ 포착시간: 날짜와 시간 분리하여 예쁘게 정렬
    let formattedTimeBlock = '시간 없음';
    if (alert.time) {
      const dateObj = new Date(alert.time);
      const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
      const year = String(dateObj.getFullYear()).slice(2); // '25'
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      const weekday = weekdays[dateObj.getDay()];

      let hours = dateObj.getHours();
      const minutes = String(dateObj.getMinutes()).padStart(2, '0');
      const seconds = String(dateObj.getSeconds()).padStart(2, '0');
      const isPM = hours >= 12;
      const ampm = isPM ? '오후' : '오전';
      hours = hours % 12 || 12;
      const timeStr = `${ampm} ${String(hours).padStart(2, '0')}:${minutes}:${seconds}`;

      formattedTimeBlock = `<pre>${year}. ${month}. ${day}. (${weekday})\n  ${timeStr}</pre>`;
    }

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
    const message = `${title}\n\n` +
                    `📌 종목: <code>${symbol}</code>\n` +
                    `⏱️ 타임프레임: ${timeframe}\n` +
                    `💲 가격: <code>${price}</code>\n` +
                    `🕒 포착시간:\n${formattedTimeBlock}`;

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
