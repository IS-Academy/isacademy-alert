const { sendToAdmin, inlineKeyboard, getLangKeyboard } = require('../botManager');
const langManager = require('../langConfigManager');
const config = require('../config');
const { getLastDummyTime } = require('../utils');
const moment = require('moment-timezone');

module.exports = async function sendBotStatus(timeStr, suffix = '', chatId = config.ADMIN_CHAT_ID, messageId = null) {
  const langChoi = langManager.getUserConfig(config.TELEGRAM_CHAT_ID)?.lang || 'ko';
  const langMing = langManager.getUserConfig(config.TELEGRAM_CHAT_ID_A)?.lang || 'ko';
  const tz = langManager.getUserConfig(config.ADMIN_CHAT_ID)?.tz || config.DEFAULT_TIMEZONE;

  const now = moment().tz(tz);
  const timeFormatted = now.format('HH:mm:ss');
  const dateFormatted = now.format('YY.MM.DD (dd)');

  const lastDummy = getLastDummyTime();
  const dummyTime = lastDummy ? moment(lastDummy).tz(tz).format('YY.MM.DD (dd) HH:mm:ss') : '기록 없음';

  const showLangSelectChoi = chatId === config.ADMIN_CHAT_ID && suffix === 'lang_choi';
  const showLangSelectMing = chatId === config.ADMIN_CHAT_ID && suffix === 'lang_ming';

  let statusMsg = `🎯 <b>IS 관리자봇 패널</b>\n`;
  statusMsg += `📍 <b>현재 상태:</b> 🌖 <code>${timeFormatted}</code> (${dateFormatted})\n`;
  statusMsg += `\n👨‍💼 최실장: ${global.choiEnabled ? '✅ ON' : '❌ OFF'} (<code>${langChoi}</code>)\n`;
  statusMsg += `👩‍💼 밍밍: ${global.mingEnabled ? '✅ ON' : '❌ OFF'} (<code>${langMing}</code>)\n`;
  statusMsg += `\n📅 <b>${dateFormatted}</b>\n`;
  statusMsg += `🛰 <b>더미 수신:</b> ${lastDummy ? '✅' : '❌'} <code>${dummyTime}</code>\n`;

  if (showLangSelectChoi) {
    statusMsg += `\n🌐 <b>최실장 언어 선택:</b>\n`;
    statusMsg += `🇰🇷 한국어   🇺🇸 English   🇨🇳 中文   🇯🇵 日本語`;
  }
  if (showLangSelectMing) {
    statusMsg += `\n🌐 <b>밍밍 언어 선택:</b>\n`;
    statusMsg += `🇰🇷 한국어   🇺🇸 English   🇨🇳 中文   🇯🇵 日本語`;
  }

  const keyboard = showLangSelectChoi ? getLangKeyboard('choi') : showLangSelectMing ? getLangKeyboard('ming') : inlineKeyboard;

  await require('../botManager').editMessage('admin', chatId, messageId, statusMsg, keyboard);
}
