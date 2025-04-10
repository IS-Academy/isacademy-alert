// ✅👇 dummyHandler.js

const { updateLastDummyTime, getLastDummyTime, getAdminMessageId } = require('./utils');
const sendBotStatus = require('./commands/status');
const { ADMIN_CHAT_ID } = require('./config');

module.exports = async (req, res) => {
  updateLastDummyTime();  // ✅ 더미 수신 시간 업데이트
  const timeStr = getLastDummyTime();
  const adminMessageId = getAdminMessageId(); 

  if (adminMessageId) {
    await sendBotStatus(timeStr, '', ADMIN_CHAT_ID, adminMessageId);
  } else {
    console.warn('⚠️ 저장된 adminMessageId가 없음, 최초 메시지 생성 필요');
  }

  res.status(200).send("✅ 더미 수신 완료");
};
