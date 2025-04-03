// dummyHandler.js
const express = require('express');
const router = express.Router();
const moment = require('moment-timezone');
const { sendTextToTelegram, updateLastDummyTime } = require('./utils'); // ✅ 중요!

router.post('/', async (req, res) => {
  const now = moment().tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss');

  console.log('✅ [더미 수신] 시간:', now);

  updateLastDummyTime(now); // ✅ 상태 저장: utils.js 기준으로!
  await sendTextToTelegram(`🛰️ 더미 웹훅 수신!\n🕒 <b>${now}</b>`);

  res.status(200).send('✅ 더미 수신 완료');
});

module.exports = router;
