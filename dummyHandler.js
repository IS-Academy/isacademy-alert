// dummyHandler.js
const { updateLastDummyTime, sendTextToTelegram } = require('./utils');

module.exports = async function dummyHandler(req, res) {
  const now = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });

  // 콘솔 기록 및 변수 저장
  console.log('✅ [더미 수신] 시간:', now);
  updateLastDummyTime(now);

  // 관리자에게 텔레그램 메시지 전송
  await sendTextToTelegram(`🔁 더미 웹훅 수신!\n🕒 ${now}`);
  res.status(200).send('더미 수신 완료');
};
