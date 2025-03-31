// index.js - 이모지 강조 + 복사버튼 없는 깔끔한 텔레그램 메시지 템플릿
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

    // 🕒 시간 변환 (UTC → 한국시간, 날짜+시간 분리)
    const dateObj = new Date(alert.time);
    const dateKR = new Date(dateObj.getTime() + 9 * 60 * 60 * 1000);
    const formattedDate = dateKR.toLocaleDateString('ko-KR', {
      year: '2-digit', 
      month: '2-digit', 
      day: '2-digit', 
      weekday: 'short'
    });
    const formattedTime = dateKR.toLocaleTimeString('ko-KR', {
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit', 
      hour12: true
    });

    // 🎯 분기 메시지 제목
    let emoji = '';
    let title = '';
    if (type.includes('Ready_Support'))        { emoji = '🩵'; title = `${emoji} 롱 진입 대기`; }
    else if (type.includes('Ready_Resistance')) { emoji = '❤️'; title = `${emoji} 숏 진입 대기`; }
    else if (type.includes('Ready_is_Big_Support')) { emoji = '🚀'; title = `${emoji} 강한 롱 진입 대기`; }
    else if (type.includes('Ready_is_Big_Resistance')) { emoji = '🛸'; title = `${emoji} 강한 숏 진입 대기`; }
    else if (type.includes('show_Support'))     { emoji = '🩵'; title = `${emoji} 롱 진입`; }
    else if (type.includes('show_Resistance'))  { emoji = '❤️'; title = `${emoji} 숏 진입`; }
    else if (type.includes('is_Big_Support'))   { emoji = '🚀'; title = `${emoji} 강한 롱 진입`; }
    else if (type.includes('is_Big_Resistance')){ emoji = '🛸'; title = `${emoji} 강한 숏 진입`; }
    else if (type.includes('Ready_exitLong'))   { emoji = '💲'; title = `${emoji} 롱 청산 대기`; }
    else if (type.includes('Ready_exitShort'))  { emoji = '💲'; title = `${emoji} 숏 청산 대기`; }
    else if (type.includes('exitLong'))         { emoji = '💰'; title = `${emoji} 롱 청산`; }
    else if (type.includes('exitShort'))        { emoji = '💰'; title = `${emoji} 숏 청산`; }
    else                                        { emoji = '🔔'; title = `${emoji} ${type}`; }

// 📬 HTML 메시지 조립
let message = `${title}\n\n📌 종목: <code>${symbol}</code>\n⏱️ 타임프레임: ${timeframe}`;

const isAlertWithFullInfo = [
  'show_Support', 'show_Resistance',
  'is_Big_Support', 'is_Big_Resistance',
  'exitLong', 'exitShort'
].some(keyword => type.includes(keyword));

if (isAlertWithFullInfo) {
  message += `\n💲 가격: <code>${price}</code>\n🕒 포착시간:\n<code>${formattedDate}\n${' '.repeat(7)}${formattedTime}</code>`;
}


    // 전송
    const url = `https://api.telegram.org/bot${config.TELEGRAM_BOT_TOKEN}/sendMessage`;
    await axios.post(url, {
      chat_id: config.TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: 'HTML' // HTML 파싱은 켜두되 <code> 없음
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
