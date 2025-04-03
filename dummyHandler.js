// dummyHandler.js
const express = require('express');
const router = express.Router();
const { sendTextToTelegram, updateLastDummyTime } = require('./utils');

router.post('/dummy', async (req, res) => {
  const now = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
  updateLastDummyTime(now);

  console.log('✅ [더미 수신] 시간:', now);
  await sendTextToTelegram(`🔁 더미 웹훅 수신!\n🕒 ${now}`);
  res.status(200).send('더미 수신 완료');
});

module.exports = router;
