// dummyHandler.js
const { updateLastDummyTime } = require('./utils');
const config = require('./config');
const axios = require('axios');

module.exports = async function dummyHandler(req, res) {
  updateLastDummyTime(); // <- 더미 수신 시간 기록

  try {
    await axios.post(`https://api.telegram.org/bot${config.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      chat_id: config.TELEGRAM_CHAT_ID,
      text: '🧪 더미 알림 수신 확인됨 ✅',
      parse_mode: 'HTML'
    });

    res.status(200).send('✅ 더미 알림 수신 완료');
  } catch (err) {
    console.error('❌ 더미 핸들러 실패:', err.message);
    res.status(500).send('서버 오류');
  }
};
