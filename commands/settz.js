// ✅ settz.js - 시간대 설정 후 상태 메시지 갱신

const langManager = require('../langConfigManager');
const { sendToAdmin } = require('../botManager');
const { getTimeString } = require('../utils');
const sendBotStatus = require('./status');
const config = require('../config');

const VALID_TZ = [
  'Asia/Seoul', 'Asia/Tokyo', 'UTC', 'America/New_York'
];

module.exports = async function handleSetTz(chatId, tzCode, currentLang, timeStr) {
  if (!tzCode || !VALID_TZ.includes(tzCode)) {
    await sendToAdmin('❗ 유효한 시간대 코드를 입력하세요. (Asia/Seoul, Asia/Tokyo, UTC, America/New_York)');
    return;
  }

  const success = langManager.setUserTimezone(chatId, tzCode);
  if (success) {
    await sendBotStatus(getTimeString(), '', chatId); // 상태 메시지 갱신
  } else {
    await sendToAdmin('❌ 시간대 설정 실패');
  }
};
