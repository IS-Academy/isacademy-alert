// ✅ status.js (언어선택 버튼 포함 완성본)
const moment = require('moment-timezone');
const config = require('../config');
const langManager = require('../langConfigManager');
const { getLangKeyboard, editMessage, inlineKeyboard } = require('../botManager');
const { getLastDummyTime, getTimeString } = require('../utils');

module.exports = async function sendBotStatus(timeStr, suffix = '', chatId = config.ADMIN_CHAT_ID, messageId = null) {
  const langChoi = langManager.getUserConfig(config.TELEGRAM_CHAT_ID)?.lang || 'ko';
  const langMing = langManager.getUserConfig(config.TELEGRAM_CHAT_ID_A)?.lang || 'ko';
  const tz = langManager.getUserConfig(chatId)?.tz || config.DEFAULT_TIMEZONE;

  const now = getTimeString(tz);
  const dummyTime = getLastDummyTime();

  const showLangUI = suffix.includes('langUI');
  const showChoiLang = suffix.includes('choi');
  const showMingLang = suffix.includes('ming');

  const dateStr = moment().tz(tz).format('YY.MM.DD (dd)');
  const dayKor = {
    Mon: '월', Tue: '화', Wed: '수', Thu: '목', Fri: '금', Sat: '토', Sun: '일'
  }[moment().tz(tz).format('ddd')];
  const dateLine = `📅 <b>25.${moment().tz(tz).format('MM.DD')} (${dayKor})</b>`;

  const statusMsg =
    `🎯 <b>IS 관리자봇 패널</b>
───────────────
` +
    `📍 현재 상태: 🌑 <code>${now}</code>

` +
    `👨‍💼 최실장: ${global.choiEnabled ? '✅ ON' : '❌ OFF'} <code>(${langChoi})</code>
` +
    `👩‍💼 밍밍: ${global.mingEnabled ? '✅ ON' : '❌ OFF'} <code>(${langMing})</code>

` +
    `${dateLine}
` +
    `🛰️ 더미 수신: ${dummyTime.includes('❌') ? '❌ 기록 없음' : `✅ <code>${dummyTime}</code>`}
` +
    (showLangUI ? `───────────────
🌐 <b>최실장 언어 선택:</b>
${formatLangUI('choi')}

🌐 <b>밍밍 언어 선택:</b>
${formatLangUI('ming')}
` : '') +
    `───────────────`;

  const keyboard = inlineKeyboard;
  await editMessage('admin', chatId, messageId, statusMsg, keyboard);
};

function formatLangUI(bot) {
  return [
    { code: 'ko', label: '🇰🇷 한국어' },
    { code: 'en', label: '🇺🇸 English' },
    { code: 'zh', label: '🇨🇳 中文' },
    { code: 'ja', label: '🇯🇵 日本語' }
  ].map(lang => `<code>${lang.label}</code>`).join(' ');
}
