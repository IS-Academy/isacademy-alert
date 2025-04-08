// commands/status.js
const { sendTextToTelegram, getInlineKeyboard } = require('../utils');
const config = require('../config');

module.exports = async function sendBotStatus(timeStr, prefix = '') {
  const langChoi = require('../lang').getUserLang(config.TELEGRAM_CHAT_ID);
  const langMing = require('../lang').getUserLang(config.TELEGRAM_CHAT_ID_A);

  const statusMsg =
    `${prefix ? prefix + '\n' : ''}` +
    `✅ 상태 (🕒 ${timeStr})\n` +
    `최실장: ${global.choiEnabled ? '✅ ON' : '⛔ OFF'} (${langChoi})\n` +
    `밍밍: ${global.mingEnabled ? '✅ ON' : '⛔ OFF'} (${langMing})`;

  await sendTextToTelegram(statusMsg, getInlineKeyboard());
};
