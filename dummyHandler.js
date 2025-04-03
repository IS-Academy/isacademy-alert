// dummyHandler.js
const express = require('express');
const router = express.Router();
const { sendTextToTelegram } = require('./utils');

let lastDummyTime = null;

router.post('/dummy', async (req, res) => {
  const now = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
  lastDummyTime = now;

  console.log('✅ [더미 수신] 시간:', now);
  await sendTextToTelegram(`🔁 더미 웹훅 수신!\n🕒 ${now}`);
  res.status(200).send('더미 수신 완료');
});

function getLastDummyTime() {
  return lastDummyTime || '❌ 기록 없음';
}

module.exports = { router, getLastDummyTime };
