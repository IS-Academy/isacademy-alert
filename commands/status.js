// ✅ status.js

const { editMessage, inlineKeyboard, getLangKeyboard, sendTextToBot } = require('../botManager');
const langManager = require('../langConfigManager');
const config = require('../config');
const { getLastDummyTime } = require('../utils');
const { translations } = require('../lang');
const moment = require('moment-timezone');
const axios = require('axios');

const cache = new Map();

async function pinMessage(chatId, messageId) {
  const token = config.ADMIN_BOT_TOKEN;
  try {
    await axios.post(`https://api.telegram.org/bot${token}/pinChatMessage`, {
      chat_id: chatId,
      message_id: messageId,
      disable_notification: true
    });
    console.log('📌 메시지 고정 완료');
  } catch (err) {
    console.warn('⚠️ 메시지 고정 실패:', err.response?.data || err.message);
  }
}

module.exports = async function sendBotStatus(timeStr, suffix = '', chatId = config.ADMIN_CHAT_ID, messageId = null) {
  const key = `${chatId}_${suffix}`;
  const now = moment().tz(config.DEFAULT_TIMEZONE);
  const nowTime = now.format('HH:mm:ss');

  // 캐시된 시간과 동일하면 메시지 생략
  if (cache.get(key) === nowTime) {
    console.log('⚠️ 상태 메시지 중복 생략');
    return;
  }
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

  const keyboard = suffix === 'lang_choi' ? getLangKeyboard('choi') :
                   suffix === 'lang_ming' ? getLangKeyboard('ming') :
                   inlineKeyboard;

  let statusMsg = `📡 <b>IS 관리자봇 패널</b>\n`;
  statusMsg += `──────────────────────\n`;
  statusMsg += `📍 <b>현재 상태:</b> 🕐 <code>${timeFormatted}</code>\n\n`;
  statusMsg += `👨‍💼 최실장: ${global.choiEnabled ? '✅ ON' : '❌ OFF'} (<code>${langChoi}</code>)\n`;
  statusMsg += `👩‍💼 밍밍: ${global.mingEnabled ? '✅ ON' : '❌ OFF'} (<code>${langMing}</code>)\n\n`;
  statusMsg += `📅 <b>${dateFormatted}</b>\n`;
  statusMsg += `🛰 <b>더미 수신:</b> ${dummyMoment ? '✅' : '❌'} <code>${dummyTime}</code> ${elapsedText}\n`;
  statusMsg += `──────────────────────`;

  try {
    await editMessage('admin', chatId, messageId, statusMsg, keyboard, { parse_mode: 'HTML' });
  } catch (err) {
    console.warn('🧯 editMessage 실패, 새 메시지 발송 시도');
    await sendTextToBot('admin', chatId, statusMsg, keyboard);
  }
};
