// index.js
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const config = require('./config');

const app = express();
app.use(bodyParser.json());

/* ✅ 템플릿 함수: 메시지 생성만 담당 */
function generateAlertMessage({ type, symbol, timeframe, price, date, clock }) {
  const signalMap = {
    Ready_Support: { emoji: '🩵', title: '롱 진입 대기' },
    Ready_Resistance: { emoji: '❤️', title: '숏 진입 대기' },
    Ready_is_Big_Support: { emoji: '🚀', title: '강한 롱 진입 대기' },
    Ready_is_Big_Resistance: { emoji: '🛸', title: '강한 숏 진입 대기' },
    show_Support: { emoji: '🩵', title: '롱 진입' },
    show_Resistance: { emoji: '❤️', title: '숏 진입' },
    is_Big_Support: { emoji: '🚀', title: '강한 롱 진입' },
    is_Big_Resistance: { emoji: '🛸', title: '강한 숏 진입' },
    Ready_exitLong: { emoji: '💲', title: '롱 청산 준비' },
    Ready_exitShort: { emoji: '💲', title: '숏 청산 준비' },
    exitLong: { emoji: '💰', title: '롱 청산' },
    exitShort: { emoji: '💰', title: '숏 청산' }
  };

  const { emoji = '🔔', title = type } = signalMap[type] || {};

  const fullInfoTypes = [
    'show_Support', 'show_Resistance',
    'is_Big_Support', 'is_Big_Resistance',
    'exitLong', 'exitShort'
  ];

  let message = `${emoji} <b>${title}</b>\n\n`;
  message += `📌 종목: <b>${symbol}</b>\n`;
  message += `⏱️ 타임프레임: ${timeframe}`;

  if (fullInfoTypes.includes(type)) {
    if (price !== 'N/A') {
      message += `\n💲 가격: <b>${price}</b>`;
    }
    message += `\n🕒 포착시간:\n${date}\n${clock}`;
  }

  return message;
}

/* ✅ 밍밍 봇 전송 함수 */
async function sendToMingBot(message, type) {
  const excludeTypesForMing = [];

  if (!excludeTypesForMing.includes(type)) {
    try {
      const urlMing = `https://api.telegram.org/bot${config.TELEGRAM_BOT_TOKEN_A}/sendMessage`;
      await axios.post(urlMing, {
        chat_id: config.TELEGRAM_CHAT_ID_A,
        text: message,
        parse_mode: 'HTML'
      });
      console.log('📤 밍밍 봇에게도 전송 완료');
    } catch (err) {
      console.error('❌ 밍밍 전송 실패:', err.response?.data || err.message);
    }
  } else {
    console.log('🚫 밍밍 제외 알림 타입으로 전송 생략');
  }
}

/* ✅ 메인 핸들러 */
app.post('/webhook', async (req, res) => {
  try {
    const alert = req.body;
    console.log('📩 받은 TradingView Alert:', alert);

    const type = alert.type || '📢 알림';
    const symbol = alert.symbol || 'Unknown';
    const timeframe = alert.timeframe || '⏳ 없음';

    // 가격 파싱
    let price = 'N/A';
    if (!isNaN(parseFloat(alert.price))) {
      price = parseFloat(alert.price).toFixed(2);
    }

    // 시간 포맷
    const alertTime = alert.time ? new Date(alert.time) : new Date();
    const formattedDate = alertTime.toLocaleDateString('ko-KR', {
      year: '2-digit',
      month: '2-digit',
      day: '2-digit',
      weekday: 'short'
    });
    const formattedClock = alertTime.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });

    // 메시지 생성
    const message = generateAlertMessage({
      type,
      symbol,
      timeframe,
      price,
      date: formattedDate,
      clock: formattedClock
    });

    // 최실장 봇 전송
    const url = `https://api.telegram.org/bot${config.TELEGRAM_BOT_TOKEN}/sendMessage`;
    await axios.post(url, {
      chat_id: config.TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: 'HTML'
    });
    console.log('✅ 최실장 봇에게 전송 완료');

    // 밍밍 봇 전송
    await sendToMingBot(message, type);

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
