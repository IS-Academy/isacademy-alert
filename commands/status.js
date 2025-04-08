const { sendToAdmin, editMessage, inlineKeyboard, getLangKeyboard } = require('../botManager');
const config = require('../config');
const langManager = require('../langConfigManager');
const { getTimeString, getLastDummyTime } = require('../utils');
const moment = require('moment-timezone');

module.exports = async function sendBotStatus(timeStr, suffix = '', chatId = null, messageId = null, langUI = null) {
  const langChoi = langManager.getUserConfig(config.TELEGRAM_CHAT_ID)?.lang || 'ko';
  const langMing = langManager.getUserConfig(config.TELEGRAM_CHAT_ID_A)?.lang || 'ko';
  const tz = langManager.getUserConfig(config.ADMIN_CHAT_ID)?.tz || config.DEFAULT_TIMEZONE;

  const now = moment().tz(tz);
  const formattedDate = `25.${now.format('MM.DD')} (${now.format('dd')})`;
  const formattedTime = now.format('HH:mm:ss');

  const dummyTime = getLastDummyTime();
  const dummyStr = dummyTime ? moment(dummyTime).tz(tz).format('25.MM.DD HH:mm:ss') : '❌ 기록 없음';

  let msg =
    `🎯 <b>IS 관리자봇 패널</b>\n` +
    `📍 <b>현재 상태:</b> 🕓 <code>${formattedTime}</code>\n` +
    `👨‍💼 최실장: ${global.choiEnabled ? '✅ ON' : '❌ OFF'} (${langChoi})\n` +
    `👩‍💼 밍밍: ${global.mingEnabled ? '✅ ON' : '❌ OFF'} (${langMing})\n` +
    `📅 ${formattedDate}\n` +
    `🛰 더미 수신: ${dummyTime ? '✅ ' + dummyStr : '❌ 기록 없음'}`;

  // ✅ 언어 선택 UI 포함 요청 시
  if (langUI === 'choi') {
    msg += `\n\n🌐 <b>최실장 언어 선택:</b>\n🇰🇷 한국어   🇺🇸 English   🇨🇳 中文   🇯🇵 日本語`;
  }
  if (langUI === 'ming') {
    msg += `\n\n🌐 <b>밍밍 언어 선택:</b>\n🇰🇷 한국어   🇺🇸 English   🇨🇳 中文   🇯🇵 日本語`;
  }

  const keyboard = inlineKeyboard;

  if (chatId && messageId) {
    await editMessage('admin', chatId, messageId, msg, keyboard);
  } else {
    await sendToAdmin(msg, keyboard);
  }
};
