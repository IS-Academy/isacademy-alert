// ✅ status.js (언어선택 버튼 포함 최종본)

const moment = require('moment-timezone');
const config = require('../config');
const langManager = require('../langConfigManager');
const { getTimeString, getLastDummyTime } = require('../utils');
const { sendToAdmin, editMessage } = require('../botManager');

module.exports = async function sendBotStatus(timeStr, suffix = '', chatId = config.ADMIN_CHAT_ID, messageId = null, langTarget = null) {
  const langChoi = langManager.getUserConfig(config.TELEGRAM_CHAT_ID)?.lang || 'ko';
  const langMing = langManager.getUserConfig(config.TELEGRAM_CHAT_ID_A)?.lang || 'ko';
  const tz = langManager.getUserConfig(config.ADMIN_CHAT_ID)?.tz || config.DEFAULT_TIMEZONE;

  const now = getTimeString(tz);
  const dateFormatted = moment().tz(tz).format('YY.MM.DD (dd)');
  const dummyTime = getLastDummyTime();

  const showLangUI = langTarget === 'choi' || langTarget === 'ming';

  let msg =
    `🎯 <b>IS 관리자봇 패널</b>
` +
    `───────────────
` +
    `📍 <b>현재 상태:</b>🌔 <code>${now}</code>

` +
    `👨‍💼 최실장: ${global.choiEnabled ? '✅ ON' : '❌ OFF'} (<code>${langChoi}</code>)
` +
    `👩‍💼 밍밍: ${global.mingEnabled ? '✅ ON' : '❌ OFF'} (<code>${langMing}</code>)

` +
    `📅 ${dateFormatted}
` +
    `🛰 더미 수신: ${dummyTime === '❌ 기록 없음' ? '❌ <i>기록 없음</i>' : `✅ <code>${dummyTime}</code>`}
` +
    (suffix ? `
${suffix}` : '') +
    `
───────────────`;

  const keyboard = {
    inline_keyboard: []
  };

  if (showLangUI && langTarget === 'choi') {
    msg += `
🌐 <b>최실장 언어 선택:</b>`;
    keyboard.inline_keyboard.push([
      { text: '🇰🇷 한국어', callback_data: 'lang_choi_ko' },
      { text: '🇺🇸 English', callback_data: 'lang_choi_en' },
      { text: '🇨🇳 中文', callback_data: 'lang_choi_zh' },
      { text: '🇯🇵 日本語', callback_data: 'lang_choi_ja' }
    ]);
  }

  if (showLangUI && langTarget === 'ming') {
    msg += `
🌐 <b>밍밍 언어 선택:</b>`;
    keyboard.inline_keyboard.push([
      { text: '🇰🇷 한국어', callback_data: 'lang_ming_ko' },
      { text: '🇺🇸 English', callback_data: 'lang_ming_en' },
      { text: '🇨🇳 中文', callback_data: 'lang_ming_zh' },
      { text: '🇯🇵 日本語', callback_data: 'lang_ming_ja' }
    ]);
  }

  // 메인 키보드 항상 유지
  keyboard.inline_keyboard.push(
    [
      { text: '▶️ 최실장 켜기', callback_data: 'choi_on' },
      { text: '⏹️ 최실장 끄기', callback_data: 'choi_off' }
    ],
    [
      { text: '▶️ 밍밍 켜기', callback_data: 'ming_on' },
      { text: '⏹️ 밍밍 끄기', callback_data: 'ming_off' }
    ],
    [
      { text: '🌐 최실장 언어선택', callback_data: 'lang_choi' },
      { text: '🌐 밍밍 언어선택', callback_data: 'lang_ming' }
    ],
    [
      { text: '🛰 상태 확인', callback_data: 'status' },
      { text: '📡 더미 상태', callback_data: 'dummy_status' }
    ]
  );

  if (messageId) {
    await editMessage(chatId, messageId, msg, keyboard);
  } else {
    await sendToAdmin(msg, keyboard);
  }
};
