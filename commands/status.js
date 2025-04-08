const { getTimeString } = require('../utils');
const { sendToAdmin, inlineKeyboard } = require('../botManager');
const config = require('../config');
const langManager = require('../langConfigManager');

module.exports = async function sendBotStatus(timeStr, suffix = '') {
  const langChoi = langManager.getUserConfig(config.TELEGRAM_CHAT_ID)?.lang || 'ko';
  const langMing = langManager.getUserConfig(config.TELEGRAM_CHAT_ID_A)?.lang || 'ko';
  const tz = langManager.getUserConfig(config.ADMIN_CHAT_ID)?.tz || config.DEFAULT_TIMEZONE;

  const now = getTimeString(tz);

  const statusMsg =
    `📡 <b>IS 관리자 봇 상태</b>\n` +
    `──────────────────────\n` +
    `🕒 현재 시간: <code>${now}</code>\n` +
    `🌍 시간대: <code>${tz}</code>\n` +
    `🌐 최실장 언어: <code>${langChoi}</code>\n` +
    `🌐 밍밍 언어: <code>${langMing}</code>\n` +
    `✅ 봇 작동 상태:\n` +
    `├ 최실장: ${global.choiEnabled ? '🟢 ON' : '🔴 OFF'}\n` +
    `└ 밍밍: ${global.mingEnabled ? '🟢 ON' : '🔴 OFF'}\n` +
    (suffix ? `\n${suffix}` : '') +
    `\n──────────────────────`;

  await sendToAdmin(statusMsg, inlineKeyboard); // ✅ 여기서 꼭 이걸로!
};
