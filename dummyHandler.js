// dummyHandler.js
const express = require('express');
const router = express.Router();
const { sendTextToTelegram, updateLastDummyTime } = require('./utils'); // ✅ 수정: utils.js에서 함수 사용

router.post('/dummy', async (req, res) => {
  const now = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });

  updateLastDummyTime(now); // ✅ 전역에 시간 저장
  console.log('✅ [더미 수신] 시간:', now);

  await sendTextToTelegram(`🔁 더미 웹훅 수신!\n🕒 ${now}`);
  res.status(200).send('더미 수신 완료');
});

module.exports = router;
