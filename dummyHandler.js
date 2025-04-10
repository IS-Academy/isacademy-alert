// ✅ dummyHandler.js

const { updateLastDummyTime } = require('./utils');
const { sendToAdmin } = require('./botManager');
const moment = require('moment-timezone');
const config = require('./config');

module.exports = async function dummyHandler(req, res) {
  updateLastDummyTime();

  const now = moment().tz(config.DEFAULT_TIMEZONE);
  const timeFormatted = now.format('HH:mm:ss');
  const dateFormatted = now.format('YY.MM.DD (ddd)');
  
  const statusMsg = `
📡 <b>IS 관리자봇 패널</b>
──────────────────────
📍 <b>현재 상태:</b> 🕐 <code>${timeFormatted}</code>

🛰 <b>더미 수신됨:</b> ✅ <code>${dateFormatted} ${timeFormatted}</code>
──────────────────────`.trim();

  // 👇 인라인 키보드 없이 메시지만 업데이트
  await sendToAdmin(statusMsg, null);

  // ✅ 필요 시 관리자에게 메시지 발송 (주석 해제 가능)
  // await sendTextToTelegram(`🔁 더미 웹훅 수신!\n🕒 ${now}`);

  res.status(200).send('✅ 더미 수신 완료');
};
