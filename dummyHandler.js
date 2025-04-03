// dummyHandler.js
const express = require('express');
const router = express.Router();
const moment = require('moment-timezone');
const { sendTextToTelegram, updateLastDummyTime } = require('./utils');

router.post('/', async (req, res) => {
  const now = moment().tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss');
  updateLastDummyTime(now);
  console.log('✅ [더미 수신] 시간:', now);
  await sendTextToTelegram(`🛰️ 더미 웹훅 수신!\n🕒 <b>${now}</b>`);
  res.status(200).send('✅ 더미 수신 처리 완료');
});

module.exports = router;
