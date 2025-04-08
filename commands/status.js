// ✅ status.js (언어선택 이후 UI 사라지고, 메인 상태 유지되도록 showLangUI 조절)

const { getLastDummyTime } = require('../utils');
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
  const year = now.format('YY');
  const date = now.format(`MM.DD`);
  const time = now.format('HH:mm:ss');
  return { full: `${year}.${date} (${label[day]})`, time };
}

function getLangListText(bot) {
  const kb = getLangKeyboard(bot);
  return kb.inline_keyboard[0].map(btn => btn.text).join(' '); // 넓은 공백
}

module.exports = async function sendBotStatus(timeStr = '', suffix = '', chatId = config.ADMIN_CHAT_ID, messageId = null, showLangUI = false, langTarget = null) {
  try {
    const langChoi = langManager.getUserConfig(config.TELEGRAM_CHAT_ID)?.lang || 'ko';
    const langMing = langManager.getUserConfig(config.TELEGRAM_CHAT_ID_A)?.lang || 'ko';
    const lang = langManager.getUserConfig(chatId)?.lang || 'ko';
    const tz = langManager.getUserConfig(chatId)?.tz || config.DEFAULT_TIMEZONE;
    const now = getFormattedNow(lang, tz);
    const dummyTime = getLastDummyTime();

    let langSection = '';
    if (showLangUI && langTarget) {
      const label = langTarget === 'choi' ? '최실장' : '밍밍';
      langSection = `\n──────────────────────\n🌐 <b>${label} 언어 선택:</b>\n${getLangListText(langTarget)}\n`;
    }

    const msg =
      `🎯 <b>IS 관리자봇 패널</b>\n` +
      `──────────────────────\n` +
      `📍 <b>현재 상태:</b> (🕐 ${now.time})\n\n` +
      `👨‍💼 최실장: ${global.choiEnabled ? '✅ ON' : '❌ OFF'} <code>(${langChoi})</code>\n` +
      `👩‍💼 밍밍: ${global.mingEnabled ? '✅ ON' : '❌ OFF'} <code>(${langMing})</code>\n\n` +
      `📅 ${now.full}\n` +
      `🛰 더미 수신: ${dummyTime.includes('없음') ? '❌ 기록 없음' : `✅ ${dummyTime}`}` +
      langSection +
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
