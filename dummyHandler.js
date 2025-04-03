// dummyHandler.js
const { sendTextToTelegram } = require('./utils');

module.exports = async function dummyHandler(req, res) {
  const now = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
  const msg = `✅ 더미 신호 수신됨\n⏰ 시각: ${now}`;
  await sendTextToTelegram(msg);
  console.log('[DUMMY] 알림 수신됨:', now);
  res.status(200).send('✅ 더미 처리 완료');
};
