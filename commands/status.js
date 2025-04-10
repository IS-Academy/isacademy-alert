// ✅👇 commands/status.js

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

const cache = new Map();

module.exports = async function sendBotStatus(timeStr = getTimeString(), suffix = '', chatId = config.ADMIN_CHAT_ID, messageId = null) {
  const key = `${chatId}_${suffix}`;
  const now = moment().tz(config.DEFAULT_TIMEZONE);
  const nowTime = now.format('HH:mm:ss');

  if (cache.get(key) === nowTime) {
    console.log('⚠️ 상태 메시지 중복 생략');
    return;
  }
  cache.set(key, nowTime);

  const { choiEnabled, mingEnabled } = loadBotState();
  const langChoi = langManager.getUserConfig(config.TELEGRAM_CHAT_ID)?.lang || 'ko';
  const langMing = langManager.getUserConfig(config.TELEGRAM_CHAT_ID_A)?.lang || 'ko';
  const userLang = langManager.getUserConfig(chatId)?.lang || 'ko';
  const tz = langManager.getUserConfig(chatId)?.tz || config.DEFAULT_TIMEZONE;

  const dayKey = now.format('ddd');
  const dayTranslated = translations[userLang]?.days?.[dayKey] || dayKey;
  const dateFormatted = now.format(`YY.MM.DD (${dayTranslated})`);
  const timeFormatted = now.format('HH:mm:ss');

  const lastDummy = getLastDummyTime();
  const dummyMoment = lastDummy && lastDummy !== '❌ 기록 없음' ? moment.tz(lastDummy, tz) : null;
  const dummyTime = dummyMoment ? dummyMoment.format(`YY.MM.DD (${dayTranslated}) HH:mm:ss`) : '기록 없음';
  const elapsed = dummyMoment ? moment().diff(dummyMoment, 'minutes') : null;
  const elapsedText = dummyMoment ? (elapsed < 1 ? '방금 전' : `+${elapsed}분 전`) : '';

  const keyboard = suffix === 'lang_choi' ? getLangKeyboard('choi') :
                   suffix === 'lang_ming' ? getLangKeyboard('ming') : inlineKeyboard;

  const statusMsg = `📡 <b>IS 관리자봇 패널</b>\n──────────────────────\n📍 <b>현재 상태:</b> 🕐 <code>${timeFormatted}</code>\n\n👨‍💼 최실장: ${choiEnabled ? '✅ ON' : '❌ OFF'} (<code>${langChoi}</code>)\n👩‍💼 밍밍: ${mingEnabled ? '✅ ON' : '❌ OFF'} (<code>${langMing}</code>)\n\n📅 <b>${dateFormatted}</b>\n🛰 <b>더미 수신:</b> ${dummyMoment ? '✅' : '❌'} <code>${dummyTime}</code> ${elapsedText}\n──────────────────────`;

  try {
    let sent;
    const existingMessageId = messageId || getAdminMessageId();

    if (existingMessageId) {
      sent = await editMessage('admin', chatId, existingMessageId, statusMsg, keyboard, { parse_mode: 'HTML' });
    } 

    if (!sent?.data?.result) {
      sent = await sendTextToBot('admin', chatId, statusMsg, keyboard, { parse_mode: 'HTML' });
    }

    if (sent?.data?.result?.message_id) {
      setAdminMessageId(sent.data.result.message_id);
      console.log('✅ 관리자 패널 메시지 전송 및 ID 저장 완료');
    } else {
      console.warn('⚠️ 관리자 패널 메시지 전송 결과 없음');
    }

    return sent;
  } catch (err) {
    console.error('❌ 관리자 패널 메시지 처리 실패:', err.message);
    return null;
  }
};
