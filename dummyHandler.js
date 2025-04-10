// ✅ dummyHandler.js

const moment = require('moment-timezone');
const config = require('./config');
const { updateLastDummyTime, getTimeString } = require('./utils');
const sendBotStatus = require('./commands/status');

module.exports = async function dummyHandler(req, res) {
  const nowIso = new Date().toISOString();
  const displayTime = moment().tz(config.DEFAULT_TIMEZONE).format('YY.MM.DD HH:mm:ss');

  console.log('✅ [더미 수신] 시간:', displayTime);
  updateLastDummyTime(nowIso);

  // ✅ 필요 시 관리자에게 메시지 발송 (주석 해제 가능)
  // await sendTextToTelegram(`🔁 더미 웹훅 수신!\n🕒 ${now}`);

  res.status(200).send('✅ 더미 수신 완료');
};
