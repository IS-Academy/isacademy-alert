// dummyHandler.js
const moment = require('moment-timezone');
const { sendTextToTelegram, updateLastDummyTime } = require('./utils');

module.exports = async function dummyHandler(req, res) {
  const now = moment().tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss');

  // 콘솔 출력
  console.log('✅ [더미 수신] 시간:', now);

  // 수신 시간 저장
  updateLastDummyTime(now);

  // 관리자에게 알림 전송 (원하면 생략 가능)
  await sendTextToTelegram(`🛰️ 더미 웹훅 수신!\n🕒 <b>${now}</b>`);

  res.status(200).send('✅ 더미 수신 처리 완료');
};
