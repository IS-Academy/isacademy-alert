// ✅ status.js (디자인 개선: 사진2 스타일 UI + 언어선택 포함)

const { getTimeString, getLastDummyTime } = require('../utils');
const { editMessage, inlineKeyboard, sendToAdmin, getLangKeyboard } = require('../botManager');
const config = require('../config');
const langManager = require('../langConfigManager');
const moment = require('moment-timezone');

const dayLabels = {
  ko: ['일', '월', '화', '수', '목', '금', '토'],
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  zh: ['日', '一', '二', '三', '四', '五', '六'],
  ja: ['日', '月', '火', '水', '木', '金', '土']
};

function getFormattedNow(lang = 'ko', tz = 'Asia/Seoul') {
  const now = moment().tz(tz);
  const day = now.day();
  const label = dayLabels[lang] || dayLabels.ko;
  return now.format(`YYYY.MM.DD (${label[day]}) HH:mm:ss`);
}

function getLangButtonsInline(bot) {
  return getLangKeyboard(bot).inline_keyboard[0].map(btn => btn.text).join('  ');
}

module.exports = async function sendBotStatus(timeStr = '', suffix = '', chatId = config.ADMIN_CHAT_ID, messageId = null, showLangUI = false) {
  try {
    const langChoi = langManager.getUserConfig(config.TELEGRAM_CHAT_ID)?.lang || 'ko';
    const langMing = langManager.getUserConfig(config.TELEGRAM_CHAT_ID_A)?.lang || 'ko';
    const lang = langManager.getUserConfig(chatId)?.lang || 'ko';
    const tz = langManager.getUserConfig(chatId)?.tz || config.DEFAULT_TIMEZONE;
    const now = getFormattedNow(lang, tz);
    const dummyTime = getLastDummyTime();

    const msg =
      `🎯 <b>IS 관리자봇 패널</b>\n` +
      `──────────────────────\n` +
      `📍 현재 상태 (<code>🕐 ${now.split(' ')[1]}</code>)\n\n` +
      `👨‍💼 최실장: ${global.choiEnabled ? '✅ ON' : '❌ OFF'} <code>(${langChoi})</code>\n` +
      `👩‍💼 밍밍: ${global.mingEnabled ? '✅ ON' : '❌ OFF'} <code>(${langMing})</code>\n` +
      `\n🗓️ ${now.split(' ')[0]}\n🌐 TZ: <code>${tz}</code>\n\n` +
      `📡 더미 수신: ${dummyTime.includes('없음') ? '❌ 기록 없음' : `✅ <code>${dummyTime}</code>`}\n` +
      (showLangUI
        ? `──────────────────────\n🌐 <b>최실장 언어 선택:</b>\n${getLangButtonsInline('choi')}\n\n🌐 <b>밍밍 언어 선택:</b>\n${getLangButtonsInline('ming')}\n`
        : '') +
      (suffix ? `\n${suffix}` : '') +
      `\n──────────────────────`;

    if (messageId) {
      await editMessage('admin', chatId, messageId, msg, inlineKeyboard);
    } else {
      await sendToAdmin(msg, inlineKeyboard);
    }
  } catch (e) {
    console.error('❌ 상태 메시지 출력 실패:', e.message);
  }
};
