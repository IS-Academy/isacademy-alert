//✅👇 config.js

require('dotenv').config();

module.exports = {
  // 최실장 봇
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
  TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID,

  // 밍밍 봇
  TELEGRAM_BOT_TOKEN_A: process.env.TELEGRAM_BOT_TOKEN_A,
  TELEGRAM_CHAT_ID_A: process.env.TELEGRAM_CHAT_ID_A,

  // 영어 봇
  TELEGRAM_BOT_TOKEN_GLOBAL: process.env.TELEGRAM_BOT_TOKEN_GLOBAL,
  TELEGRAM_CHAT_ID_GLOBAL: process.env.TELEGRAM_CHAT_ID_GLOBAL,
  
  // 중국어 봇
  TELEGRAM_BOT_TOKEN_CHINA: process.env.TELEGRAM_BOT_TOKEN_CHINA,
  TELEGRAM_CHAT_ID_CHINA: process.env.TELEGRAM_CHAT_ID_CHINA,
  
  // 일본어 봇
  TELEGRAM_BOT_TOKEN_JAPAN: process.env.TELEGRAM_BOT_TOKEN_JAPAN,
  TELEGRAM_CHAT_ID_JAPAN: process.env.TELEGRAM_CHAT_ID_JAPAN,

  // 관리자 봇
  ADMIN_BOT_TOKEN: process.env.ADMIN_BOT_TOKEN,
  ADMIN_CHAT_ID: process.env.ADMIN_CHAT_ID,

  // 밍밍 전송 스위치 (하드코딩 방식)
  MINGMING_ENABLED: process.env.MINGMING_ENABLED === 'true', // ← ✅ (true = "시작" / false = "정지")
  
  // ✅ 기본 진입 비중 및 레버리지 ( WEIGHT = % / LEVERAGE = × )
  DEFAULT_WEIGHT: 1,
  DEFAULT_LEVERAGE: 50,

  // ✅ 최대 진입 비중 제한 (예: 30%면 최대 30회차 진입)
  MAX_ENTRY_PERCENT: 30,

  // ✅ 기본 타임존
  DEFAULT_TIMEZONE: 'Asia/Seoul'
};
