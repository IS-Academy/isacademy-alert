// ✅ status.js 최종 수정본
const { editMessage, inlineKeyboard, getLangKeyboard } = require('../botManager');
const langManager = require('../langConfigManager');
const config = require('../config');
const { getLastDummyTime } = require('../utils');
const { translations } = require('../lang');
const moment = require('moment-timezone');

module.exports = async function sendBotStatus(timeStr, suffix = '', chatId = config.ADMIN_CHAT_ID, messageId = null) {
  const langChoi = langManager.getUserConfig(config.TELEGRAM_CHAT_ID)?.lang || 'ko';
  const langMing = langManager.getUserConfig(config.TELEGRAM_CHAT_ID_A)?.lang || 'ko';
  const userLang = langManager.getUserConfig(chatId)?.lang || 'ko';
  const tz = langManager.getUserConfig(chatId)?.tz || config.DEFAULT_TIMEZONE;

  const now = moment().tz(tz);
  const timeFormatted = now.format('HH:mm:ss');
  
  const dayKey = now.format('ddd');
  const dayTranslated = translations[userLang]?.days[dayKey] || dayKey;
  const dateFormatted = now.format(`YY.MM.DD (${dayTranslated})`);

  const lastDummy = getLastDummyTime();
  const dummyTime = lastDummy !== '❌ 기록 없음'
    ? moment(lastDummy).tz(tz).format(`YY.MM.DD (${dayTranslated}) HH:mm:ss`)
    : '기록 없음';

  const keyboard = suffix === 'lang_choi' ? getLangKeyboard('choi') :
                   suffix === 'lang_ming' ? getLangKeyboard('ming') :
                   inlineKeyboard;

  let statusMsg = `🎯 <b>IS 관리자봇 패널</b>\n`;
  statusMsg += `📍 <b>현재 상태:</b> 🌖 <code>${timeFormatted}</code>\n\n`;
  statusMsg += `👨‍💼 최실장: ${global.choiEnabled ? '✅ ON' : '❌ OFF'} (<code>${langChoi}</code>)\n`;
  statusMsg += `👩‍💼 밍밍: ${global.mingEnabled ? '✅ ON' : '❌ OFF'} (<code>${langMing}</code>)\n\n`;
  statusMsg += `📅 <b>${dateFormatted}</b>\n`;
  statusMsg += `🛰 <b>더미 수신:</b> ${lastDummy !== '❌ 기록 없음' ? '✅' : '❌'} <code>${dummyTime}</code>\n`;

  await editMessage('admin', chatId, messageId, statusMsg, keyboard, { parse_mode: 'HTML' });
};
