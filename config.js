// config.js
require('dotenv').config();

module.exports = {
  // 최실장 봇
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
  TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID,

  // 밍밍 봇
  TELEGRAM_BOT_TOKEN_A: process.env.TELEGRAM_BOT_TOKEN_A,
  TELEGRAM_CHAT_ID_A: process.env.TELEGRAM_CHAT_ID_A,  
};
