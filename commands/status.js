// ✅ status.js - 언어선택 버튼 포함한 상태 메시지 통합 (키보드 유지)

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
  return getLangKeyboard(bot).inline_keyboard[0]
    .map(btn => `<code>${btn.text}</code>`) // 보기용 코드박스로 강조
    .join(' ');
}

module.exports = async function sendBotStatus(timeStr = '', suffix = '', chatId = config.ADMIN_CHAT_ID, messageId = null) {
  try {
    const langChoi = langManager.getUserConfig(config.TELEGRAM_CHAT_ID)?.lang || 'ko';
    const langMing = langManager.getUserConfig(config.TELEGRAM_CHAT_ID_A)?.lang || 'ko';
    const lang = langManager.getUserConfig(chatId)?.lang || 'ko';
    const tz = langManager.getUserConfig(chatId)?.tz || config.DEFAULT_TIMEZONE;

    const now = getFormattedNow(lang, tz);
    const dummyTime = getLastDummyTime();

    const langChoiBtns = getLangButtonsInline('choi');
    const langMingBtns = getLangButtonsInline('ming');

    const msg =
      `📡 <b>IS 관리자 봇 상태</b>\n` +
      `──────────────────────\n` +
      `🕒 현재 시간: <code>${now}</code>\n` +
      `🌍 시간대: <code>${tz}</code>\n` +
      `🌐 최실장 언어: <code>${langChoi}</code>\n` +
      `🌐 밍밍 언어: <code>${langMing}</code>\n` +
      `✅ 봇 작동 상태:\n├ 최실장: ${global.choiEnabled ? '🟢 ON' : '🔴 OFF'}\n└ 밍밍: ${global.mingEnabled ? '🟢 ON' : '🔴 OFF'}\n` +
      `\n🔁 더미 알림 수신: <code>${dummyTime}</code>` +
      `\n──────────────────────\n` +
      `🌐 <b>최실장 언어 선택:</b>\n${langChoiBtns}\n\n🌐 <b>밍밍 언어 선택:</b>\n${langMingBtns}` +
      (suffix ? `\n\n${suffix}` : '') +
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
