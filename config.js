require('dotenv').config();

module.exports = {
  // 최실장 봇
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
  TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID,

  // 밍밍 봇
  TELEGRAM_BOT_TOKEN_A: process.env.TELEGRAM_BOT_TOKEN_A,
  TELEGRAM_CHAT_ID_A: process.env.TELEGRAM_CHAT_ID_A,

  // 관리자 봇
  ADMIN_BOT_TOKEN: process.env.ADMIN_BOT_TOKEN,
  ADMIN_CHAT_ID: process.env.ADMIN_CHAT_ID,

  // 밍밍 전송 스위치 (하드코딩 방식)
  MINGMING_ENABLED: process.env.MINGMING_ENABLED === 'true' // ← ✅ (true = "시작" / false = "정지")
};
