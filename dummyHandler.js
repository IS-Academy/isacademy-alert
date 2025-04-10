// ✅ dummyHandler.js

const { updateLastDummyTime, getLastDummyTime } = require('./utils');
const sendBotStatus = require('./commands/status');
const moment = require('moment-timezone');
const config = require('./config');

module.exports = async function dummyHandler(req, res) {
  const nowIso = new Date().toISOString();
  updateLastDummyTime(nowIso);

  const timeStr = moment().tz(config.DEFAULT_TIMEZONE).format('YY.MM.DD HH:mm:ss');

  // 👇 인라인 키보드 없이 기존 메시지를 업데이트 (메시지 수정 방식으로 동작)
  await sendBotStatus(timeStr, 'dummy', config.ADMIN_CHAT_ID);

  res.status(200).send('✅ 더미 수신 완료');
};

