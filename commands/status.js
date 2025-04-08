// ✅ status.js (언어선택 버튼 포함 완성본)
const moment = require("moment-timezone");
const config = require("../config");
const langManager = require("../langConfigManager");
const { getLastDummyTime } = require("../utils");
const { sendToAdmin, editMessage, inlineKeyboard } = require("../botManager");

module.exports = async function sendBotStatus(timeStr, suffix = '', chatId = null, messageId = null, showLangUI = false, langTarget = null) {
  const langChoi = langManager.getUserConfig(config.TELEGRAM_CHAT_ID)?.lang || 'ko';
  const langMing = langManager.getUserConfig(config.TELEGRAM_CHAT_ID_A)?.lang || 'ko';
  const tz = langManager.getUserConfig(config.ADMIN_CHAT_ID)?.tz || config.DEFAULT_TIMEZONE;

  const now = moment().tz(tz);
  const timeText = now.format("HH:mm:ss");
  const dateText = now.format("YY.MM.DD (ddd)");
  const dummyText = getLastDummyTime();

  const emoji = global.choiEnabled ? '🟢' : '🔴';
  const emoji2 = global.mingEnabled ? '🟢' : '🔴';
  const langTagChoi = `(${langChoi})`;
  const langTagMing = `(${langMing})`;

  let msg = '';
  msg += `🎯 <b>IS 관리자봇 패널</b>\n`;
  msg += `┌ <b>현재 상태:</b> (🕓 ${timeText})\n`;
  msg += `├ 🧑‍💼 최실장: ${global.choiEnabled ? '✅ ON' : '❌ OFF'} ${langTagChoi}\n`;
  msg += `└ 🧑‍🚀 밍밍: ${global.mingEnabled ? '✅ ON' : '❌ OFF'} ${langTagMing}\n`;
  msg += `📅 ${dateText}\n`;
  msg += `🛰 더미 수신: ${dummyText.includes('❌') ? '❌ 기록 없음' : `✅ ${dummyText}`}\n`;

  // ✅ 언어 선택 UI 추가
  const keyboard = { inline_keyboard: [...inlineKeyboard.inline_keyboard] };

  if (showLangUI && langTarget === 'choi') {
    msg += `\n🌐 <b>최실장 언어 선택:</b>`;
    keyboard.inline_keyboard.push([
      { text: '🇰🇷 한국어', callback_data: 'lang_choi_ko' },
      { text: '🇺🇸 English', callback_data: 'lang_choi_en' },
      { text: '🇨🇳 中文', callback_data: 'lang_choi_zh' },
      { text: '🇯🇵 日本語', callback_data: 'lang_choi_ja' }
    ]);
  }

  if (showLangUI && langTarget === 'ming') {
    msg += `\n🌐 <b>밍밍 언어 선택:</b>`;
    keyboard.inline_keyboard.push([
      { text: '🇰🇷 한국어', callback_data: 'lang_ming_ko' },
      { text: '🇺🇸 English', callback_data: 'lang_ming_en' },
      { text: '🇨🇳 中文', callback_data: 'lang_ming_zh' },
      { text: '🇯🇵 日本語', callback_data: 'lang_ming_ja' }
    ]);
  }

  if (suffix) msg += `\n${suffix}`;

  if (chatId && messageId) {
    await editMessage(chatId, messageId, msg, keyboard);
  } else {
    await sendToAdmin(msg, inlineKeyboard);
  }
};
