// ✅ setlang.js - 언어 설정 후 상태 메시지 갱신

const langManager = require('../langConfigManager');
const { sendToAdmin } = require('../botManager');
const { getTimeString } = require('../utils');
const sendBotStatus = require('./status');
const config = require('../config');

module.exports = async function handleSetLang(chatId, langCode, currentLang, timeStr) {
  if (!langCode || !['ko', 'en', 'zh', 'ja'].includes(langCode)) {
    await sendToAdmin('❗ 올바른 언어 코드를 입력하세요. (ko, en, zh, ja)');
    return;
  }

  const success = langManager.setUserLang(chatId, langCode);
  if (success) {
    await sendBotStatus(getTimeString(), '', chatId); // 상태 메시지 갱신
  } else {
    await sendToAdmin('❌ 언어 설정 실패');
  }
};
