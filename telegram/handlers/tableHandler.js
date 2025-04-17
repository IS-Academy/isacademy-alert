// 📊 tableHandler.js - 트레이딩뷰 테이블 웹훅 전용

const { sendToChoi, sendToMing } = require('../botManager');
const config = require('../../config');

module.exports = async function handleTableWebhook(update) {
  const type = update.type;
  const entry = update.entry || 'N/A';
  const target = update.target || 'N/A';
  const percent = update.percent || 'N/A';
  const entryCount = update.entryCount || '0';

  const symbol = update.symbol || 'BTCUSDT'; // 선택적으로 전달 가능
  const timeframe = update.timeframe || '1m';

  const isLong = type === 'long_table';
  const icon = isLong ? '📈' : '📉';
  const label = isLong ? '롱' : '숏';

  const message =
    `${icon} <b>${label} 평균단가:</b> ${entry}
` +
    `🎯 <b>예상 청산가:</b> ${target}
` +
    `✅ <b>${entryCount}% 진입</b>
` +
    `📊 <b>예상 수익률:</b> ${percent}`;

  // 기본 설정: 관리자용 전송
  if (global.choiEnabled) await sendToChoi(message);
  if (global.mingEnabled) await sendToMing(message);
};
