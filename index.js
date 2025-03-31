// index.js - HTML 스타일 + 진입/청산 종류별 메시지 분기 최종 버전
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

    // 포착 시간 포맷
    const rawDate = alert.time ? new Date(alert.time) : new Date();
    const formattedDate = rawDate.toLocaleDateString('ko-KR', {
      timeZone: 'Asia/Seoul',
      year: '2-digit', month: '2-digit', day: '2-digit', weekday: 'short'
    });
    const formattedTime = rawDate.toLocaleTimeString('ko-KR', {
      timeZone: 'Asia/Seoul',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
    });

    // 알림 분기용 이모지 + 타이틀
    let emoji = '';
    let title = '';

    if (type.includes('Ready_Support')) {
      emoji = '🩵'; title = `${emoji} 롱 진입 준비`;
    } else if (type.includes('Ready_Resistance')) {
      emoji = '❤️'; title = `${emoji} 숏 진입 준비`;
    } else if (type.includes('Ready_is_Big_Support')) {
      emoji = '🚀'; title = `${emoji} 강한 롱 진입 준비`;
    } else if (type.includes('Ready_is_Big_Resistance')) {
      emoji = '🛸'; title = `${emoji} 강한 숏 진입 준비`;
    } else if (type.includes('show_Support')) {
      emoji = '🩵'; title = `${emoji} 롱 진입`;
    } else if (type.includes('show_Resistance')) {
      emoji = '❤️'; title = `${emoji} 숏 진입`;
    } else if (type.includes('is_Big_Support')) {
      emoji = '🚀'; title = `${emoji} 강한 롱 진입`;
    } else if (type.includes('is_Big_Resistance')) {
      emoji = '🛸'; title = `${emoji} 강한 숏 진입`;
    } else if (type.includes('Ready_exitLong')) {
      emoji = '💲'; title = `${emoji} 롱 청산 준비`;
    } else if (type.includes('Ready_exitShort')) {
      emoji = '💲'; title = `${emoji} 숏 청산 준비`;
    } else if (type.includes('exitLong')) {
      emoji = '💰'; title = `${emoji} 롱 청산`;
    } else if (type.includes('exitShort')) {
      emoji = '💰'; title = `${emoji} 숏 청산`;
    } else {
      emoji = '🔔'; title = `${emoji} ${type}`;
    }

    // 가격/시간 표시 여부 결정
    const fullInfoTypes = [
      'show_Support', 'show_Resistance',
      'is_Big_Support', 'is_Big_Resistance',
      'exitLong', 'exitShort'
    ];
    const isFullInfo = fullInfoTypes.some(keyword => type.includes(keyword));

    // 메시지 조립
    let message = `${title}

📌 종목: <code>${symbol}</code>
⏱️ 타임프레임: ${timeframe}`;

    if (isFullInfo) {
      message += `\n💲 가격: <code>${price}</code>\n🕒 포착시간:\n<code>${formattedDate}\n${formattedTime}</code>`;
    }

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
