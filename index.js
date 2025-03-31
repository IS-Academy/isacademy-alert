// index.js - HTML 스타일 메시지 + 진입/청산 구분별 정보 출력
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

    // 날짜와 시간 포맷 분리 (KST)
    const date = new Date(alert.time);
    const formattedDate = date.toLocaleDateString('ko-KR', {
      year: '2-digit', month: '2-digit', day: '2-digit', weekday: 'short'
    });
    const formattedTime = date.toLocaleTimeString('ko-KR', {
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
    });

    // 메시지 제목 분기
    let emoji = '', title = '';
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

    // 본문 메시지 구성
    let message = `${title}
\n📌 종목: <code>${symbol}</code>\n⏱️ 타임프레임: ${timeframe}`;

    // 이 조건에만 가격과 포착시간 추가
    const fullInfoConditions = [
      'show_Support', 'show_Resistance',
      'is_Big_Support', 'is_Big_Resistance',
      'exitLong', 'exitShort'
    ];

    const includeFullInfo = fullInfoConditions.some(keyword => type.includes(keyword));
    if (includeFullInfo) {
      message += `\n💲 가격: <code>${price}</code>\n🕒 포착시간:\n<code>${formattedDate}\n${' '.repeat(5)}${formattedTime}</code>`;
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
