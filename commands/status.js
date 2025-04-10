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

  const dayTranslated = translations[userLang]?.days[now.format('ddd')] || now.format('ddd');

  const lastDummy = getLastDummyTime();
  const dummyMoment = moment(lastDummy, moment.ISO_8601, true).isValid() ? moment.tz(lastDummy, tz) : null;
  const elapsed = dummyMoment ? moment().diff(dummyMoment, 'minutes') : null;

  const dummyTimeFormatted = dummyMoment ? dummyMoment.format(`YY.MM.DD (${dayTranslated}) HH:mm:ss`) : '기록 없음';
  const elapsedText = elapsed !== null ? (elapsed < 1 ? '방금 전' : `+${elapsed}분 전`) : '';

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

    const sent = existingMessageId
      ? await editMessage('admin', chatId, existingMessageId, statusMsg, inlineKeyboard)
      : await sendTextToBot('admin', chatId, statusMsg, inlineKeyboard);

    if (sent?.data?.result?.message_id) {
      setAdminMessageId(sent.data.result.message_id);
      console.log(`✅ 메시지 ID 저장됨: ${sent.data.result.message_id}`);
    }

    return sent;
  } catch (err) {
    console.error('⚠️ 관리자 패널 오류:', err.message);
    return null;
  }
};
