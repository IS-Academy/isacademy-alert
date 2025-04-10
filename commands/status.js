// ✅👇 status.js

const { editMessage, inlineKeyboard, getLangKeyboard, sendTextToBot, sendToAdmin } = require('../botManager');
const langManager = require('../langConfigManager');
const config = require('../config');
const { getLastDummyTime, setAdminMessageId, getAdminMessageId } = require('../utils');
const { translations } = require('../lang');
const moment = require('moment-timezone');

const cache = new Map();

module.exports = async function sendBotStatus(timeStr, suffix = '', chatId = config.ADMIN_CHAT_ID, messageId = null) {
  const key = `${chatId}_${suffix}`;
  const now = moment().tz(config.DEFAULT_TIMEZONE);
  const nowTime = now.format('HH:mm:ss');

  if (cache.get(key) === nowTime) return;
  cache.set(key, nowTime);

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

  const keyboard = inlineKeyboard;

  let statusMsg = `📡 <b>IS 관리자봇 패널</b>\n`;
  statusMsg += `──────────────────────\n`;
  statusMsg += `📍 <b>현재 상태:</b> 🕐 <code>${timeFormatted}</code>\n\n`;
  statusMsg += `👨‍💼 최실장: ${global.choiEnabled ? '✅ ON' : '❌ OFF'} (<code>${langChoi}</code>)\n`;
  statusMsg += `👩‍💼 밍밍: ${global.mingEnabled ? '✅ ON' : '❌ OFF'} (<code>${langMing}</code>)\n\n`;
  statusMsg += `📅 <b>${dateFormatted}</b>\n`;
  statusMsg += `🛰 <b>더미 수신:</b> ${dummyMoment ? '✅' : '❌'} <code>${dummyTime}</code> ${elapsedText}\n`;
  statusMsg += `──────────────────────`;

  try {
    const existingMessageId = messageId || getAdminMessageId();
    let sent;

    if (existingMessageId) {
      sent = await editMessage('admin', chatId, existingMessageId, statusMsg, keyboard, { parse_mode: 'HTML' });
    } else {
      sent = await sendTextToBot('admin', chatId, statusMsg, keyboard);
    }

    if (sent && sent.data && sent.data.result) setAdminMessageId(sent.data.result.message_id);
  } catch (err) {
    const sent = await sendTextToBot('admin', chatId, statusMsg, keyboard);
    if (sent && sent.data && sent.data.result) setAdminMessageId(sent.data.result.message_id);
  }
};

(async () => {
  const initMsg = "📡 <b>IS 관리자봇 패널</b>\n서버 재시작 완료. 상태 초기화.";
  const sent = await sendToAdmin(initMsg);
  if (sent?.data?.result) setAdminMessageId(sent.data.result.message_id);
})();
