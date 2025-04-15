// ✅ /trader-gate/tradeLogger.js

const fs = require('fs');
const path = require('path');

const logDir = path.join(__dirname, '../logs');
const logFile = path.join(logDir, 'autotrade.log');

// ✅ 로그 디렉토리 없으면 생성
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

function logTrade({
  timestamp = Date.now(),
  symbol,
  side,
  price,
  amount,
  type = 'entry', // 'entry' | 'exit'
  status = 'success', // 'success' | 'fail'
  extra = ''
}) {
  const timeStr = new Date(timestamp).toISOString();
  const logLine = `[${timeStr}] [${type.toUpperCase()}] [${side.toUpperCase()}] ${symbol} @ ${price} x ${amount} → ${status.toUpperCase()} ${extra}\n`;
  fs.appendFileSync(logFile, logLine);
  console.log('📝 자동매매 로그 기록됨:', logLine.trim());
}

module.exports = {
  logTrade
};
