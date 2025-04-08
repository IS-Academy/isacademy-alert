// ✅ commands/status.js
const { getTimeString, getLastDummyTime } = require("../utils");
const langManager = require("../langConfigManager");
const config = require("../config");
const { editMessage, getLangKeyboard, inlineKeyboard } = require("../botManager");

module.exports = async function sendBotStatus(timeStr, _, chatId = config.ADMIN_CHAT_ID, messageId = null) {
  const langChoi = langManager.getUserConfig(config.TELEGRAM_CHAT_ID)?.lang || 'ko';
  const langMing = langManager.getUserConfig(config.TELEGRAM_CHAT_ID_A)?.lang || 'ko';
  const tz = langManager.getUserConfig(config.ADMIN_CHAT_ID)?.tz || config.DEFAULT_TIMEZONE;

  const now = getTimeString(tz);
  const dummyTime = getLastDummyTime();

  const showLangUI = true; // ✅ 언어선택 UI 표시 여부

  const statusMsg =
    `🎯 <b>IS 관리자봇 패널</b>\n` +
    `┏ 📍 <b>현재 상태:</b> 🕓 <code>${now}</code>\n` +
    `┣ 👨‍💼 최실장: ${global.choiEnabled ? '✅ ON' : '❌ OFF'} (<code>${langChoi}</code>)\n` +
    `┣ 👩‍💼 밍밍: ${global.mingEnabled ? '✅ ON' : '❌ OFF'} (<code>${langMing}</code>)\n` +
    `┣ 📅 <b>25.04.08 (화)</b>\n` +
    `┗ 🛰 <b>더미 수신:</b> ${dummyTime.includes('없음') ? '❌ 기록 없음' : '✅ <code>' + dummyTime + '</code>'}`;

  // ✅ 키보드 병합 처리
  const mergedKeyboard = {
    inline_keyboard: [
      ...(showLangUI ? getLangKeyboard('choi').inline_keyboard : []),
      ...(showLangUI ? getLangKeyboard('ming').inline_keyboard : []),
      ...inlineKeyboard.inline_keyboard
    ]
  };

  await editMessage("admin", chatId, messageId, statusMsg, mergedKeyboard);
};
