// ✅ commands/status.js (최종 리팩토링)

const moment = require('moment-timezone');
const config = require('../config');
const langManager = require('../langConfigManager');
const { getLastDummyTime } = require('../utils');
const { editMessage, sendToAdmin, getLangKeyboard, inlineKeyboard } = require('../botManager');

function getDayName(dayIndex, lang = 'ko') {
  const days = {
    ko: ['일', '월', '화', '수', '목', '금', '토'],
    en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    zh: ['日', '一', '二', '三', '四', '五', '六'],
    ja: ['日', '月', '火', '水', '木', '金', '土']
  };
  return days[lang]?.[dayIndex] || days['ko'][dayIndex];
}

module.exports = async function sendBotStatus(timeStr, suffix = '', chatId = config.ADMIN_CHAT_ID, messageId = null, langOverride = null, langSelectTarget = null) {
  const langChoi = langManager.getUserConfig(config.TELEGRAM_CHAT_ID)?.lang || 'ko';
  const langMing = langManager.getUserConfig(config.TELEGRAM_CHAT_ID_A)?.lang || 'ko';
  const tz = langManager.getUserConfig(chatId)?.tz || config.DEFAULT_TIMEZONE;
  const now = moment().tz(tz);
  const dateStr = now.format('YY.MM.DD');
  const timeOnly = now.format('HH:mm:ss');
  const weekDay = getDayName(now.day(), langOverride || langChoi);
  const dummyTime = getLastDummyTime();

  const statusMsg =
    `🎯 <b>IS 관리자봇 패널</b>\n` +
    `┌ <b>현재 상태:</b> 🕓 <code>${timeOnly}</code>\n` +
    `├ 🧑‍💼 최실장: ${global.choiEnabled ? '✅ ON' : '❌ OFF'} (<code>${langChoi}</code>)\n` +
    `└ 👩‍💼 밍밍: ${global.mingEnabled ? '✅ ON' : '❌ OFF'} (<code>${langMing}</code>)\n` +
    `📅 <b>${dateStr}</b> (${weekDay})\n` +
    `🛰 <b>더미 수신:</b> ${dummyTime}` +
    (suffix ? `\n${suffix}` : '');

  const langTarget = langSelectTarget === 'choi' ? config.TELEGRAM_CHAT_ID : langSelectTarget === 'ming' ? config.TELEGRAM_CHAT_ID_A : null;
  const langUI = langTarget ? getLangKeyboard(langSelectTarget) : null;

  const fullKeyboard = {
    inline_keyboard: [
      ...(langUI?.inline_keyboard || []),
      ...inlineKeyboard.inline_keyboard
    ]
  };

  if (messageId) {
    await editMessage('admin', chatId, messageId, statusMsg, fullKeyboard);
  } else {
    await sendToAdmin(statusMsg, inlineKeyboard);
  }
};
