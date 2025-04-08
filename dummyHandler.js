// dummyHandler.js
const { updateLastDummyTime, sendTextToTelegram } = require('./utils');
const moment = require('moment-timezone');
const config = require('./config');

module.exports = async function dummyHandler(req, res) {
  const now = moment().tz(config.DEFAULT_TIMEZONE).format('YYYY.MM.DD HH:mm:ss');

  // 콘솔 기록 및 변수 저장
  console.log('✅ [더미 수신] 시간:', now);
  updateLastDummyTime(now);

  // 필요 시 관리자에게 메시지 발송 (주석 해제 가능)
  // await sendTextToTelegram(`🔁 더미 웹훅 수신!\n🕒 ${now}`);

  res.status(200).send('✅ 더미 수신 완료');
};
