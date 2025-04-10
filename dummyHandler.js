// ✅👇 dummyHandler.js

const { updateLastDummyTime, getAdminMessageId } = require('./utils');
const sendBotStatus = require('./commands/status');
const moment = require('moment-timezone');
const config = require('./config');

module.exports = async function dummyHandler(req, res) {
  const nowIso = new Date().toISOString();
  updateLastDummyTime(nowIso);

  const timeStr = moment().tz(config.DEFAULT_TIMEZONE).format('YY.MM.DD HH:mm:ss');

  // 기존 메시지의 messageId로 수정
  const adminMessageId = getAdminMessageId();

  if (adminMessageId) {
    await sendBotStatus(timeStr, 'dummy', config.ADMIN_CHAT_ID, adminMessageId);
  } else {
    console.warn('⚠️ 저장된 adminMessageId가 없음, 최초 메시지 생성 필요');
  }

  res.status(200).send('✅ 더미 수신 완료');
};
