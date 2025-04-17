//✅👇 dummyHandler.js

const express = require('express');
const router = express.Router();
const { updateLastDummyTime, getAdminMessageId } = require('../utils');
const { sendBotStatus } = require('./commands/status');
const config = require('../config');

router.post('/', async (req, res) => {
  const now = new Date().toISOString();
  updateLastDummyTime(now);  // ✅ 더미 시간만 갱신

  const messageId = getAdminMessageId();  // ✅ 기존 관리자 메시지 ID만 사용
  if (!messageId) {
    console.warn('⚠️ 관리자 메시지 ID 없음. 더미신호에서는 생성하지 않음.');
    return res.status(200).send('더미 수신 완료 (패널 미생성)');
  }

  const sent = await sendBotStatus(config.ADMIN_CHAT_ID, messageId, { allowCreateKeyboard: false }); // 키보드 절대 생성 금지!

  if (sent) {
    console.log('✅ 더미 수신 후 패널 갱신 완료');
    res.status(200).send('더미 수신 완료');
  } else {
    console.warn('⚠️ 더미 수신 후 패널 갱신 실패');
    res.status(500).send('패널 갱신 실패');
  }
});

module.exports = router;
