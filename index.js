// index.js
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const fs = require('fs');
const config = require('./config');
const moment = require('moment-timezone');

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
    return { choiEnabled: true, mingEnabled: config.MINGMING_ENABLED === true || config.MINGMING_ENABLED === 'true' };
  }
}

// ✅ 상태 저장
function saveBotState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

// ✅ 상태 변수 초기화
let { choiEnabled, mingEnabled } = loadBotState();

// ✅ 관리자에게 메시지 전송
async function sendTextToTelegram(text, keyboard) {
  const url = `https://api.telegram.org/bot${config.ADMIN_BOT_TOKEN}/sendMessage`;
  await axios.post(url, {
    chat_id: config.ADMIN_CHAT_ID,
    text,
    parse_mode: 'HTML',
    reply_markup: keyboard
  });
}

// ✅ 인라인 키보드 UI
function getInlineKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: '▶️ 최실장 켜기', callback_data: 'choi_on' },
        { text: '⏹️ 최실장 끄기', callback_data: 'choi_off' }
      ],
      [
        { text: '▶️ 밍밍 켜기', callback_data: 'ming_on' },
        { text: '⏹️ 밍밍 끄기', callback_data: 'ming_off' }
      ],
      [
        { text: '📡 상태 확인', callback_data: 'status' }
      ]
    ]
  };
}

// ✅ Telegram 명령어 등록
async function registerTelegramCommands() {
  const commands = [
    { command: 'help', description: '📝 도움말' },
    { command: 'choi_on', description: '▶️ 최실장 켜기' },
    { command: 'choi_off', description: '⏹️ 최실장 끄기' },
    { command: 'choi_status', description: '📡 최실장 상태 확인' },
    { command: 'ming_on', description: '▶️ 밍밍 켜기' },
    { command: 'ming_off', description: '⏹️ 밍밍 끄기' },
    { command: 'ming_status', description: '📡 밍밍 상태 확인' }
  ];

  try {
    const url = `https://api.telegram.org/bot${config.ADMIN_BOT_TOKEN}/setMyCommands`;
    const res = await axios.post(url, { commands, scope: { type: 'default' } });
    console.log('✅ 텔레그램 명령어 등록 완료:', res.data);
  } catch (err) {
    console.error('❌ 텔레그램 명령어 등록 실패:', err.response?.data || err.message);
  }
}

/* ✅ 템플릿 함수: TradingView 메시지 생성만 담당 */
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
async function sendToMingBot(message) {
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

/* ✅ 관리자 명령어 및 메인 핸들러(Webhook) */
app.post('/webhook', async (req, res) => {
  const update = req.body;
  try {
    // 인라인 버튼 클릭 처리
    if (update.callback_query) {
      const cmd = update.callback_query.data;
      const id = update.callback_query.message.chat.id;
      if (id.toString() !== config.ADMIN_CHAT_ID) return res.sendStatus(200);

      switch (cmd) {
        case 'choi_on': choiEnabled = true; break;
        case 'choi_off': choiEnabled = false; break;
        case 'ming_on': mingEnabled = true; break;
        case 'ming_off': mingEnabled = false; break;
      }
      saveBotState({ choiEnabled, mingEnabled });
      const statusMsg = `✅ 현재 상태:\n최실장: ${choiEnabled ? '✅ ON' : '⛔ OFF'}\n밍밍: ${mingEnabled ? '✅ ON' : '⛔ OFF'}`;
      await axios.post(`https://api.telegram.org/bot${config.ADMIN_BOT_TOKEN}/editMessageText`, {
        chat_id: id,
        message_id: update.callback_query.message.message_id,
        text: statusMsg,
        parse_mode: 'HTML',
        reply_markup: getInlineKeyboard()
      });
      return res.sendStatus(200);
    }

    // 명령어 처리
    if (update.message && update.message.text) {
      const command = update.message.text.trim();
      const fromId = update.message.chat.id;
      if (fromId.toString() === config.ADMIN_CHAT_ID) {
        switch (command) {
          case '/start':
            await sendTextToTelegram('🤖 IS 관리자봇에 오신 것을 환영합니다!', getInlineKeyboard()); break;
          case '/도움말':
          case '/help':
            await sendTextToTelegram('🛠 사용 가능한 명령어:\n/최실장켜 /최실장꺼 /최실장상태\n/밍밍켜 /밍밍꺼 /밍밍상태'); break;
          case '/최실장켜':
          case '/choi_on':
            choiEnabled = true; saveBotState({ choiEnabled, mingEnabled }); await sendTextToTelegram('✅ 최실장 전송 활성화'); break;
          case '/최실장꺼':
          case '/choi_off':
            choiEnabled = false; saveBotState({ choiEnabled, mingEnabled }); await sendTextToTelegram('⛔ 최실장 전송 중단'); break;
          case '/최실장상태':
          case '/choi_status':
            await sendTextToTelegram(`📡 최실장 상태: ${choiEnabled ? '✅ ON' : '⛔ OFF'}`); break;
          case '/밍밍켜':
          case '/ming_on':
            mingEnabled = true; saveBotState({ choiEnabled, mingEnabled }); await sendTextToTelegram('✅ 밍밍 전송 활성화'); break;
          case '/밍밍꺼':
          case '/ming_off':
            mingEnabled = false; saveBotState({ choiEnabled, mingEnabled }); await sendTextToTelegram('⛔ 밍밍 전송 중단'); break;
          case '/밍밍상태':
          case '/ming_status':
            await sendTextToTelegram(`📡 밍밍 상태: ${mingEnabled ? '✅ ON' : '⛔ OFF'}`); break;
        }
        return res.status(200).send('✅ 명령어 처리됨');
      }
    }

    // ✅ 일반 Alert 메시지 처리
    const alert = req.body;
    const type = alert.type || '📢 알림';
    const symbol = alert.symbol || 'Unknown';
    const timeframe = alert.timeframe || '⏳ 없음';
    const tsNum = Number(alert.ts); // Pine Script에서 보낸 UNIX timestamp

    // 가격 파싱
    let price = 'N/A';
    if (!isNaN(parseFloat(alert.price))) {
      price = parseFloat(alert.price).toFixed(2);
    }

    // 시간 포맷 처리
let formattedDate = '날짜 없음';
let formattedClock = '시간 없음';

try {  
  if (Number.isInteger(tsNum) && tsNum > 0) {
    const seoulTime = moment.unix(tsNum).tz('Asia/Seoul');
    formattedDate = seoulTime.format('YY. MM. DD. (dd)');
    formattedClock = seoulTime.format('A hh:mm:ss').replace('AM', '오전').replace('PM', '오후');
  } else {
    console.warn('⚠️ 알림에 유효한 ts 없음, 현재 시간 사용');
    const now = moment().tz('Asia/Seoul');
    formattedDate = now.format('YY. MM. DD. (dd)');
    formattedClock = now.format('A hh:mm:ss').replace('AM', '오전').replace('PM', '오후');
  }
} catch (err) {
  console.error('🕒 시간 포맷 오류:', err.message);
}

// 메시지 생성
const message = generateAlertMessage({ type, symbol, timeframe, price, date: formattedDate, clock: formattedClock });
// log 메시지 출력 (디버깅용)
console.log('📥 Alert 수신:', { type, symbol, timeframe, price, ts, date: formattedDate, clock: formattedClock });

    // 최실장 봇 전송
    if (choiEnabled) {
      await axios.post(`https://api.telegram.org/bot${config.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        chat_id: config.TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML'
      });
    }

    // 밍밍 봇 전송
    await sendToMingBot(message);
    res.status(200).send('✅ 텔레그램 전송 성공');
  } catch (err) {
    console.error('❌ 텔레그램 전송 실패:', err.message);
    res.status(500).send('서버 오류');
  }
});

// ✅ 상태 확인용(기본 라우트)
app.get('/', (req, res) => {
  res.send('✅ IS Academy Webhook 서버 작동 중');
});

// ✅ 서버 실행 & 초기 설정 및 포트 자동 감지 (Render용)
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`🚀 서버 실행 중: 포트 ${PORT}`);

// ✅ 웹훅 자동 등록
  if (process.env.SERVER_URL) {
    try {
      const webhookUrl = `https://api.telegram.org/bot${config.ADMIN_BOT_TOKEN}/setWebhook?url=${process.env.SERVER_URL}/webhook`;
      const response = await axios.get(webhookUrl);
      console.log('✅ Webhook 등록 결과:', response.data);
    } catch (err) {
      console.error('❌ Webhook 등록 실패:', err.message);
    }
  } else {
    console.warn('⚠️ SERVER_URL 환경변수가 설정되어 있지 않습니다.');
  }

  await registerTelegramCommands(); // ✅ 명령어 등록 실행
});
