// index.js (수정된 전체 버전)
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const fs = require('fs');
const moment = require('moment-timezone');
const config = require('./config');
const langManager = require('./langConfigManager');
const langMessages = require('./langMessages');

const app = express();
app.use(bodyParser.json());

// ✅ 언어 설정 (언어 코드별 locale 매핑)
const LANGUAGE_MAP = { ko: 'ko', en: 'en', zh: 'zh-cn' };

// ✅ 사용자 ID로 언어 가져오기 (기본값은 'ko')
function getUserLang(chatId) {
  const lang = langManager.getUserConfig(chatId)?.lang;
  return ['ko', 'en', 'zh'].includes(lang) ? lang : 'ko';
}

function getUserTimezone(chatId) {
  return langManager.getUserConfig(chatId)?.tz || 'Asia/Seoul';
}

function getTimeString(timezone = 'Asia/Seoul') {
  return moment().tz(timezone).format('HH:mm:ss');
}

function formatTimestamp(ts, lang = 'ko', timezone = 'Asia/Seoul') {
  const locale = LANGUAGE_MAP[lang] || 'ko';
  moment.locale(locale);
  const time = moment.unix(ts).tz(timezone);
  return {
    date: time.format('YY. MM. DD. (ddd)'),
    clock: time.format('A hh:mm:ss')
      .replace('AM', locale === 'ko' ? '오전' : 'AM')
      .replace('PM', locale === 'ko' ? '오후' : 'PM')
  };
}

// ✅ 사용자 언어 설정 외부 JSON에서 로드
let userLangMap = {};
try {
  const langRaw = fs.readFileSync('./langConfig.json', 'utf-8');
  userLangMap = JSON.parse(langRaw);
  console.log('✅ 사용자 언어 설정 로드 완료');
} catch (err) {
  console.warn('⚠️ langConfig.json 파일을 불러올 수 없습니다. 기본값(ko) 사용됨');
  userLangMap = {};
}

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
        { text: '🌐 최실장 언어선택', callback_data: 'lang_choi' },
        { text: '🌐 밍밍 언어선택', callback_data: 'lang_ming' }
      ],
      [
        { text: '📡 상태 확인', callback_data: 'status' }
      ]
    ]
  };
}

// ✅ 관리자에게 메시지 전송
async function sendTextToTelegram(text, keyboard) {
  try {
    const url = `https://api.telegram.org/bot${config.ADMIN_BOT_TOKEN}/sendMessage`;
    await axios.post(url, {
      chat_id: config.ADMIN_CHAT_ID,
      text,
      parse_mode: 'HTML',
      reply_markup: keyboard
    });
  } catch (err) {
    if (!err?.response?.data?.description?.includes('message is not modified'))
      console.error('❌ 관리자 메시지 전송 실패:', err.response?.data || err.message);
  }
}

async function editTelegramMessage(chatId, messageId, text, keyboard) {
  try {
    await axios.post(`https://api.telegram.org/bot${config.ADMIN_BOT_TOKEN}/editMessageText`, {
      chat_id: chatId,
      message_id: messageId,
      text,
      parse_mode: 'HTML',
      reply_markup: keyboard
    });
  } catch (err) {
    if (!err?.response?.data?.description?.includes('message is not modified'))
      console.error('❌ 메시지 수정 실패:', err.response?.data || err.message);
  }
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
function generateAlertMessage({ type, symbol, timeframe, price, date, clock, lang = 'ko' }) {
  const validLang = ['ko', 'en', 'zh'].includes(lang) ? lang : 'ko';
  const signalMap = {
    Ready_Support:           { emoji: '🩵', ko: '롱 진입 대기', en: 'Ready Long', zh: '准备做多' },
    Ready_Resistance:        { emoji: '❤️', ko: '숏 진입 대기', en: 'Ready Short', zh: '准备做空' },
    Ready_is_Big_Support:    { emoji: '🚀', ko: '강한 롱 진입 대기', en: 'Strong Ready Long', zh: '强烈准备做多' },
    Ready_is_Big_Resistance: { emoji: '🛸', ko: '강한 숏 진입 대기', en: 'Strong Ready Short', zh: '强烈准备做空' },
    show_Support:            { emoji: '🩵', ko: '롱 진입', en: 'Long Entry', zh: '做多进场' },
    show_Resistance:         { emoji: '❤️', ko: '숏 진입', en: 'Short Entry', zh: '做空进场' },
    is_Big_Support:          { emoji: '🚀', ko: '강한 롱 진입', en: 'Strong Long', zh: '强烈做多' },
    is_Big_Resistance:       { emoji: '🛸', ko: '강한 숏 진입', en: 'Strong Short', zh: '强烈做空' },
    Ready_exitLong:          { emoji: '💲', ko: '롱 청산 준비', en: 'Ready Exit Long', zh: '准备平多仓' },
    Ready_exitShort:         { emoji: '💲', ko: '숏 청산 준비', en: 'Ready Exit Short', zh: '准备平空仓' },
    exitLong:                { emoji: '💰', ko: '롱 청산', en: 'Exit Long', zh: '平多仓' },
    exitShort:               { emoji: '💰', ko: '숏 청산', en: 'Exit Short', zh: '平空仓' }
  };
  const signal = signalMap[type] || { emoji: '🔔' };
  const title = signal[validLang] || type;
  let message = `${signal.emoji} <b>${title}</b>\n\n📌 종목: <b>${symbol}</b>\n⏱️ 타임프레임: ${timeframe}`;
  const fullInfoTypes = ['show_Support', 'show_Resistance', 'is_Big_Support', 'is_Big_Resistance', 'exitLong', 'exitShort'];
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
// ✅ 관리자 인라인 버튼 클릭 시 상태 메시지 수정 + 무시용 try-catch 적용 + 응답 지연 개선용 타임스탬프 추가

app.post('/webhook', async (req, res) => {
  const update = req.body;

  // ✅ 1. 인라인 버튼 클릭 처리
  if (update.callback_query) {
    const cmd = update.callback_query.data;
    const id = update.callback_query.message.chat.id;
    const tz = getUserTimezone(id);
    const timeStr = getTimeString(tz);
    
    // ✅ 응답 지연 방지를 위한 빠른 응답 처리
    res.sendStatus(200); // 먼저 응답 보내고 후속 작업 처리

    // 상태 업데이트
    switch (cmd) {
      case 'choi_on': choiEnabled = true; break;
      case 'choi_off': choiEnabled = false; break;
      case 'ming_on': mingEnabled = true; break;
      case 'ming_off': mingEnabled = false; break;
    }
    saveBotState({ choiEnabled, mingEnabled });

    const statusMsg = `✅ 현재 상태: (🕒 ${timeStr})\n최실장: ${choiEnabled ? '✅ ON' : '⛔ OFF'}\n밍밍: ${mingEnabled ? '✅ ON' : '⛔ OFF'}`;
    await editTelegramMessage(id, update.callback_query.message.message_id, statusMsg, getInlineKeyboard());
    return;
  }

    // 메시지 수정 시 동일 내용이면 무시
    try {
      await axios.post(`https://api.telegram.org/bot${config.ADMIN_BOT_TOKEN}/editMessageText`, {
        chat_id: id,
        message_id: msgId,
        text: statusMsg,
        parse_mode: 'HTML',
        reply_markup: getInlineKeyboard()
      });
    } catch (err) {
      const isNotModified = err.response?.data?.description?.includes("message is not modified");
      if (!isNotModified) {
        console.error('❌ editMessageText 실패:', err.response?.data || err.message);
      }
    }
    return;
  }

  // ✅ 2. 기타 메시지 명령어 처리
  if (update.message && update.message.text) {
    const command = update.message.text.trim();
    const fromId = update.message.chat.id;
    const lang = getUserLang(fromId);
    const tz = getUserTimezone(fromId);
    const timeStr = getTimeString(tz);

    res.sendStatus(200);

    if (command.startsWith('/setlang')) {
      const input = command.split(' ')[1];
      const success = langManager.setUserLang(fromId, input);
      const msg = success ? langMessages.setLangSuccess[lang](input) : langMessages.setLangFail[lang];
      return await sendTextToTelegram(`${msg} (🕒 ${timeStr})`);
    }

    if (command.startsWith('/settz')) {
      const tz = command.split(' ')[1];
      const success = langManager.setUserTimezone(fromId, tz);
      const msg = success ? langMessages.setTzSuccess[lang](tz) : langMessages.setTzFail[lang];
      return await sendTextToTelegram(`${msg} (🕒 ${timeStr})`);
    }

    if (fromId.toString() === config.ADMIN_CHAT_ID) {
      switch (command) {
        case '/start':
          return await sendTextToTelegram('🤖 IS 관리자봇에 오신 것을 환영합니다!', getInlineKeyboard());
        case '/help':
        case '/도움말':
          return await sendTextToTelegram('🛠 명령어: /최실장켜 /최실장꺼 /최실장상태 /밍밍켜 /밍밍꺼 /밍밍상태');
        case '/choi_on':
        case '/최실장켜':
          choiEnabled = true; saveBotState({ choiEnabled, mingEnabled });
          return await sendTextToTelegram(`✅ 최실장 전송 활성화 (🕒 ${timeStr})`);
        case '/choi_off':
        case '/최실장꺼':
          choiEnabled = false; saveBotState({ choiEnabled, mingEnabled });
          return await sendTextToTelegram(`⛔ 최실장 전송 중단 (🕒 ${timeStr})`);
        case '/choi_status':
        case '/최실장상태':
          return await sendTextToTelegram(`📡 최실장 상태: ${choiEnabled ? '✅ ON' : '⛔ OFF'} (🕒 ${timeStr})`);
        case '/ming_on':
        case '/밍밍켜':
          mingEnabled = true; saveBotState({ choiEnabled, mingEnabled });
          return await sendTextToTelegram(`✅ 밍밍 전송 활성화 (🕒 ${timeStr})`);
        case '/ming_off':
        case '/밍밍꺼':
          mingEnabled = false; saveBotState({ choiEnabled, mingEnabled });
          return await sendTextToTelegram(`⛔ 밍밍 전송 중단 (🕒 ${timeStr})`);
        case '/ming_status':
        case '/밍밍상태':
          return await sendTextToTelegram(`📡 밍밍 상태: ${mingEnabled ? '✅ ON' : '⛔ OFF'} (🕒 ${timeStr})`);
      }
    }
  }

  res.sendStatus(200); // 기타 경우 빠른 종료

  // ✅ 3. 일반 Alert 메시지 처리
  try {
    const alert = req.body;
    // 1. 타임스탬프 안전 파싱
    const ts = Number(alert.ts);
    const isValidTs = Number.isFinite(ts) && ts > 0;
    // 2. 기본값 포함한 항목 파싱
    const symbol = alert.symbol || 'Unknown';
    const timeframe = alert.timeframe || '⏳';
    const type = alert.type || '📢';
    // 3. 가격 처리 (중복 제거)
    const parsedPrice = parseFloat(alert.price);
    const price = Number.isFinite(parsedPrice) ? parsedPrice.toFixed(2) : 'N/A';
    // 4. 사용자 언어/시간대
    const chatId = choiEnabled ? config.TELEGRAM_CHAT_ID : config.TELEGRAM_CHAT_ID_A;
    const lang = getUserLang(chatId);
    const tz = getUserTimezone(chatId);
    // 5. 포착시간 포맷
    const { date, clock } = isValidTs
      ? formatTimestamp(ts, lang, tz)
      : formatTimestamp(Math.floor(Date.now() / 1000), lang, tz);
    // 6. 메시지 생성
    const message = generateAlertMessage({ type, symbol, timeframe, price, date, clock, lang });
    console.log('📥 Alert 수신:', { type, symbol, timeframe, price, ts, date, clock, lang });

    // 7. 최실장 봇 전송
    if (choiEnabled) {
      await axios.post(`https://api.telegram.org/bot${config.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        chat_id: config.TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML'
      });
    }

    // 8. 밍밍 봇 전송
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
app.listen(PORT, () => {
  console.log(`🚀 서버 실행 중: 포트 ${PORT}`);
});

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

