// ✅ status.js - 상태 메시지 하나로 통합 (editMessage 기반)

const { getTimeString, getLastDummyTime, saveBotState } = require('../utils');
const { editMessage, inlineKeyboard } = require('../botManager');
const config = require('../config');
const langManager = require('../langConfigManager');
const moment = require('moment-timezone');

module.exports = async function sendBotStatus(timeStr, suffix = '', chatId = config.ADMIN_CHAT_ID, messageId = null) {
  const langChoi = langManager.getUserConfig(config.TELEGRAM_CHAT_ID)?.lang || 'ko';
  const langMing = langManager.getUserConfig(config.TELEGRAM_CHAT_ID_A)?.lang || 'ko';
  const tz = langManager.getUserConfig(chatId)?.tz || config.DEFAULT_TIMEZONE;
  const now = getTimeString(tz);
  const dummyTime = getLastDummyTime();

  const msg =
    `🧾 <b>IS 관리자 봇 상태</b>\n` +
    `──────────────────────\n` +
    `🕒 현재 시간: <code>${now}</code>\n` +
    `🌍 시간대: <code>${tz}</code>\n` +
    `🌐 최실장 언어: <code>${langChoi}</code>\n` +
    `🌐 밍밍 언어: <code>${langMing}</code>\n` +
    `✅ 봇 작동 상태:\n├ 최실장: ${global.choiEnabled ? '🟢 ON' : '🔴 OFF'}\n└ 밍밍: ${global.mingEnabled ? '🟢 ON' : '🔴 OFF'}\n` +
    `\n🔁 더미 알림 수신: <code>${dummyTime}</code>` +
    (suffix ? `\n\n${suffix}` : '') +
    `\n──────────────────────`;

  if (messageId) {
    await editMessage('admin', chatId, messageId, msg, inlineKeyboard);
  } else {
    // 최초 상태 메시지 전송 시
    const { sendToAdmin } = require('../botManager');
    await sendToAdmin(msg, inlineKeyboard);
  }
};
