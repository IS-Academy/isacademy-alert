// ✅ commands/status.js - 관리자 패널 메시지 처리 + 봇 실행까지 전체 통합

const { editMessage, inlineKeyboard, getLangKeyboard, sendTextToBot } = require('../botManager');
const langManager = require('../langConfigManager');
const config = require('../config');
const {
  getLastDummyTime,
  setAdminMessageId,
  getAdminMessageId,
  getTimeString,
  loadBotState
} = require('../utils');
const { translations } = require('../lang');
const moment = require('moment-timezone');
const { Telegraf } = require('telegraf'); // ✅ Telegraf 봇도 이 안에서 실행

const cache = new Map();

// ✅ 버튼 로그 자동 매핑
const logMap = {
  'choi_on': '📌 [상태 갱신됨: 최실장 ON]',
  'choi_off': '📌 [상태 갱신됨: 최실장 OFF]',
  'ming_on': '📌 [상태 갱신됨: 밍밍 ON]',
  'ming_off': '📌 [상태 갱신됨: 밍밍 OFF]',
  'status': '📌 [상태 확인 요청됨]',
  'dummy_status': '📌 [더미 상태 확인 요청됨]'
};

// ✅ 상태 메시지 생성 및 전송
async function sendBotStatus(
  timeStr = getTimeString(),
  suffix = '',
  chatId = config.ADMIN_CHAT_ID,
  messageId = null,
  options = {}
) {
  const key = `${chatId}_${suffix}`;
  const now = moment().tz(config.DEFAULT_TIMEZONE);
  const nowTime = now.format('HH:mm:ss');

  if (cache.get(key) === nowTime) {
    console.log('⚠️ 상태 메시지 중복 생략');
    return;
  }
  cache.set(key, nowTime);

  const { choiEnabled, mingEnabled } = global;

  const langChoi = langManager.getUserConfig(config.TELEGRAM_CHAT_ID)?.lang || 'ko';
  const langMing = langManager.getUserConfig(config.TELEGRAM_CHAT_ID_A)?.lang || 'ko';
  const userLang = langManager.getUserConfig(chatId)?.lang || 'ko';
  const tz = langManager.getUserConfig(chatId)?.tz || config.DEFAULT_TIMEZONE;

  const dayTranslated = translations[userLang]?.days[now.format('ddd')] || now.format('ddd');
  const lastDummy = getLastDummyTime();
  const dummyMoment = moment(lastDummy, moment.ISO_8601, true).isValid() ? moment.tz(lastDummy, tz) : null;
  const elapsed = dummyMoment ? moment().diff(dummyMoment, 'minutes') : null;
  const dummyTimeFormatted = dummyMoment ? dummyMoment.format(`YY.MM.DD (${dayTranslated}) HH:mm:ss`) : '기록 없음';
  const elapsedText = elapsed !== null ? (elapsed < 1 ? '방금 전' : `+${elapsed}분 전`) : '';

  const keyboard = suffix === 'lang_choi' ? getLangKeyboard('choi') :
                   suffix === 'lang_ming' ? getLangKeyboard('ming') :
                   inlineKeyboard;

  const statusMsg = [
    `📡 <b>IS 관리자봇 패널</b>`,
    `──────────────────────`,
    `📍 <b>현재 상태:</b> 🕐 <code>${nowTime}</code>`,
    ``,
    `👨‍💼 최실장: ${choiEnabled ? '✅ ON' : '❌ OFF'} (<code>${langChoi}</code>)`,
    `👩‍💼 밍밍: ${mingEnabled ? '✅ ON' : '❌ OFF'} (<code>${langMing}</code>)`,
    ``,
    `📅 <b>${now.format(`YY.MM.DD (${dayTranslated})`)}</b>`,
    `🛰 <b>더미 수신:</b> ${dummyMoment ? '✅' : '❌'} <code>${dummyTimeFormatted}</code> ${elapsedText}`,
    `──────────────────────`
  ].join('\n');

  try {
    const existingMessageId = messageId || getAdminMessageId();
    let sent;

    if (existingMessageId) {
      sent = await editMessage('admin', chatId, existingMessageId, statusMsg, keyboard, {
        ...options, parse_mode: 'HTML'
      });
      if (sent?.data?.result?.message_id) setAdminMessageId(sent.data.result.message_id);
    } else {
      sent = await sendTextToBot('admin', chatId, statusMsg, keyboard, {
        ...options, parse_mode: 'HTML'
      });
      if (sent?.data?.result?.message_id) setAdminMessageId(sent.data.result.message_id);
    }

    return sent;
  } catch (err) {
    console.error('⚠️ 관리자 패널 오류:', err.message);
    return null;
  }
}

// ✅ 관리자 봇 초기화 + Telegraf 시작
async function initAdminBot() {
  // ✅ 상태 전역 변수 등록
  const state = loadBotState();
  global.choiEnabled = state.choiEnabled;
  global.mingEnabled = state.mingEnabled;

  // ✅ 봇 생성
  const bot = new Telegraf(config.ADMIN_BOT_TOKEN);

  // ✅ 버튼 콜백 핸들링
  bot.on('callback_query', async (ctx) => {
    const data = ctx.callbackQuery.data;
    const chatId = ctx.chat.id;
    const messageId = ctx.callbackQuery.message.message_id;

    // ✅ 상태 갱신 처리
    switch (data) {
      case 'choi_on':
        global.choiEnabled = true;
        break;
      case 'choi_off':
        global.choiEnabled = false;
        break;
      case 'ming_on':
        global.mingEnabled = true;
        break;
      case 'ming_off':
        global.mingEnabled = false;
        break;
    }

    // ✅ 상태 메시지 호출
    await sendBotStatus(undefined, data, chatId, messageId, {
      callbackQueryId: ctx.callbackQuery.id,
      callbackResponse: '✅ 상태 패널 갱신 완료',
      logMessage: logMap[data] || `📌 [버튼 클릭됨: ${data}]`
    });
  });

  await sendBotStatus(); // ✅ 초기 메시지 전송
  await bot.launch();     // ✅ 봇 실행
  console.log('✅ 관리자 봇 실행 완료');
}

module.exports = {
  sendBotStatus,
  initAdminBot // ✅ index.js에서 사용
};
