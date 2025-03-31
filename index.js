// index.js - HTML 스타일 메시지 + 정확한 신호 구분
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
    const timeframe = alert.timeframe || '⏳ 없음';
    const price = alert.price ? parseFloat(alert.price).toFixed(2) : 'N/A';

    // 📆 시간 포맷
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

    // 🧩 제목 구성
    let emoji = '', title = '';
    if (type === 'Ready_Support') emoji = '🩵', title = '롱 진입 준비';
    else if (type === 'Ready_Resistance') emoji = '❤️', title = '숏 진입 준비';
    else if (type === 'Ready_is_Big_Support') emoji = '🚀', title = '강한 롱 진입 준비';
    else if (type === 'Ready_is_Big_Resistance') emoji = '🛸', title = '강한 숏 진입 준비';
    else if (type === 'show_Support') emoji = '🩵', title = '롱 진입';
    else if (type === 'show_Resistance') emoji = '❤️', title = '숏 진입';
    else if (type === 'is_Big_Support') emoji = '🚀', title = '강한 롱 진입';
    else if (type === 'is_Big_Resistance') emoji = '🛸', title = '강한 숏 진입';
    else if (type === 'Ready_exitLong') emoji = '💲', title = '롱 청산 준비';
    else if (type === 'Ready_exitShort') emoji = '💲', title = '숏 청산 준비';
    else if (type === 'exitLong') emoji = '💰', title = '롱 청산';
    else if (type === 'exitShort') emoji = '💰', title = '숏 청산';
    else emoji = '🔔', title = type;

    // 💡 어떤 신호에 전체 정보(가격, 시간)를 보여줄지 정확히 구분
    const fullInfoTypes = [
      'show_Support', 'show_Resistance',
      'is_Big_Support', 'is_Big_Resistance',
      'exitLong', 'exitShort'
    ];
    const isAlertWithFullInfo = fullInfoTypes.includes(type);

    // 📬 메시지 조립 (HTML)
    let message = `${emoji} <b>${title}</b>\n\n`;
    message += `📌 종목: <b>${symbol}</b>\n`;
    message += `⏱️ 타임프레임: ${timeframe}`;

    if (isAlertWithFullInfo) {
      message += `\n💲 가격: <b>${price}</b>`;
      message += `\n🕒 포착시간:\n${formattedDate}\n${formattedClock}`;
    }

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

app.get('/', (req, res) => {
  res.send('✅ IS Academy Webhook 서버 작동 중');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 서버 실행 중: 포트 ${PORT}`);
});
