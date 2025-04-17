//✅👇 dummyHandler.js

const express = require('express');
const router = express.Router();
const { updateLastDummyTime, getAdminMessageId } = require('./utils');
const { sendBotStatus } = require('./commands/status');

router.post('/', async (req, res) => {
  const now = new Date().toISOString();
  updateLastDummyTime(now);  // 더미 시간 명확히 갱신

  const messageId = getAdminMessageId();  // 현재 관리자 메시지 ID를 얻기
  const sent = await sendBotStatus(config.ADMIN_CHAT_ID, messageId, { allowCreateKeyboard: false }); // ✅ 절대로 키보드 생성하지 않음

  if (sent) {
    console.log('✅ 더미 수신 및 패널 갱신 완료');
    res.status(200).send('더미 수신 완료');
  } else {
    console.warn('⚠️ 더미 수신 후 패널 갱신 실패');
    res.status(500).send('패널 갱신 실패');
  }
});

module.exports = router;
