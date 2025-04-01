// index.js
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const fs = require('fs');
const config = require('./config');

const app = express();
app.use(bodyParser.json());

// ✅ 상태 파일 경로
const STATE_FILE = './bot_state.json';

// ✅ 상태 불러오기 (초기값 포함)
function loadBotState() {
  try {
    const raw = fs.readFileSync(STATE_FILE);
    return JSON.parse(raw);
  } catch (err) {
    return { choiEnabled: true, mingEnabled: config.MINGMING_ENABLED };
  }
}

// ✅ 상태 저장
function saveBotState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

// ✅ 상태 변수 로드
let { choiEnabled, mingEnabled } = loadBotState();

// ✅ 관리자에게 메시지 전송
async function sendTextToTelegram(text) {
  const url = `https://api.telegram.org/bot${config.TELEGRAM_BOT_TOKEN}/sendMessage`;
  await axios.post(url, {
    chat_id: config.ADMIN_CHAT_ID,
    text,
    parse_mode: 'HTML'
  });
}

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
  const fullInfoTypes = ['show_Support', 'show_Resistance', 'is_Big_Support', 'is_Big_Resistance', 'exitLong', 'exitShort'];

  let message = `${emoji} <b>${title}</b>\n\n📌 종목: <b>${symbol}</b>\n⏱️ 타임프레임: ${timeframe}`;
  if (fullInfoTypes.includes(type)) {
    if (price !== 'N/A') message += `\n💲 가격: <b>${price}</b>`;
    message += `\n🕒 포착시간:\n${date}\n${clock}`;
  }

  return message;
}

/* ✅ 밍밍 봇 전송 함수 */
async function sendToMingBot(message, type) {
  if (!mingEnabled) return;
  try {
    const url = `https://api.telegram.org/bot${config.TELEGRAM_BOT_TOKEN_A}/sendMessage`;
    await axios.post(url, {
      chat_id: config.TELEGRAM_CHAT_ID_A,
      text: message,
      parse_mode: 'HTML'
    });
  } catch (err) {
    await sendTextToTelegram(`❌ 밍밍 전송 실패\n\n${err.response?.data?.description || err.message}`);
  }
}

/* ✅ 메인 핸들러(Webhook) */
app.post('/webhook', async (req, res) => {
  try {
    const alert = req.body;

    // ✅ 명령어 처리
    if (alert.message && alert.message.text) {
      const command = alert.message.text.trim();
      const fromId = alert.message.chat.id;
      if (fromId.toString() === config.ADMIN_CHAT_ID) {
        switch (command) {
          case '/도움말':
            await sendTextToTelegram(
              `🛠 사용 가능한 명령어:
/최실장켜 /최실장꺼 /최실장상태
/밍밍켜 /밍밍꺼 /밍밍상태`
            );
            break;
          case '/최실장켜':
            choiEnabled = true;
            saveBotState({ choiEnabled, mingEnabled });
            await sendTextToTelegram('✅ 최실장 전송 활성화');
            break;
          case '/최실장꺼':
            choiEnabled = false;
            saveBotState({ choiEnabled, mingEnabled });
            await sendTextToTelegram('⛔ 최실장 전송 중단');
            break;
          case '/최실장상태':
            await sendTextToTelegram(`📡 최실장 상태: ${choiEnabled ? '✅ ON' : '⛔ OFF'}`);
            break;
          case '/밍밍켜':
            mingEnabled = true;
            saveBotState({ choiEnabled, mingEnabled });
            await sendTextToTelegram('✅ 밍밍 전송 활성화');
            break;
          case '/밍밍꺼':
            mingEnabled = false;
            saveBotState({ choiEnabled, mingEnabled });
            await sendTextToTelegram('⛔ 밍밍 전송 중단');
            break;
          case '/밍밍상태':
            await sendTextToTelegram(`📡 밍밍 상태: ${mingEnabled ? '✅ ON' : '⛔ OFF'}`);
            break;
        }
        return res.status(200).send('✅ 명령어 처리됨');
      }
    }

    // ✅ 일반 Alert 메시지 처리
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
    if (choiEnabled) {
      const url = `https://api.telegram.org/bot${config.TELEGRAM_BOT_TOKEN}/sendMessage`;
      await axios.post(url, {
        chat_id: config.TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML'
      });
    }

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
