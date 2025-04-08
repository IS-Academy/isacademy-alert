const moment = require("moment-timezone");
const config = require("../config");
const langManager = require("../langConfigManager");
const {
  getTimeString,
  getLastDummyTime
} = require("../utils");
const {
  editMessage,
  inlineKeyboard,
  getLangKeyboard
} = require("../botManager");

function formatStatusMessage(timeStr, langCho, langMing, dummyTime, showLangUI, targetBot = null) {
  const now = moment().tz(config.DEFAULT_TIMEZONE);
  const dateStr = now.format("YY.MM.DD (dd)"); // 25.04.08 (화)
  const dummy = dummyTime?.startsWith("❌") ? `❌ 기록 없음` : `✅ ${dummyTime}`;

  const statusText =
`🎯 <b>IS 관리자봇 패널</b>
━━━━━━━━━━━━━
📍 <b>현재 상태:</b> 🕓 <code>${timeStr}</code>

👨‍💼 최실장: ${global.choiEnabled ? "✅ ON" : "❌ OFF"} (${langCho})
👩‍💼 밍밍: ${global.mingEnabled ? "✅ ON" : "❌ OFF"} (${langMing})

📅 ${dateStr}
🛰️ 더미 수신: ${dummy}
${showLangUI && targetBot === 'choi' ? `\n🌐 최실장 언어 선택:\n🇰🇷 한국어    🇺🇸 English    🇨🇳 中文    🇯🇵 日本語` : ''}
${showLangUI && targetBot === 'ming' ? `\n🌐 밍밍 언어 선택:\n🇰🇷 한국어    🇺🇸 English    🇨🇳 中文    🇯🇵 日本語` : ''}
━━━━━━━━━━━━━`;

  return statusText;
}

module.exports = async function sendBotStatus(timeStr, suffix = '', chatId = config.ADMIN_CHAT_ID, messageId = null, options = {}) {
  const langChoi = langManager.getUserConfig(config.TELEGRAM_CHAT_ID)?.lang || 'ko';
  const langMing = langManager.getUserConfig(config.TELEGRAM_CHAT_ID_A)?.lang || 'ko';
  const dummyTime = getLastDummyTime();

  const showLangUI = options.showLangUI || false;
  const botTarget = options.targetBot || null;

  const statusMsg = formatStatusMessage(timeStr, langChoi, langMing, dummyTime, showLangUI, botTarget);

  if (messageId) {
    await editMessage('admin', chatId, messageId, statusMsg, inlineKeyboard);
  } else {
    const { sendToAdmin } = require("../botManager");
    await sendToAdmin(statusMsg, inlineKeyboard);
  }
};
