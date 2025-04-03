const moment = require('moment-timezone');
let lastDummyReceivedAt = null;

function updateDummyTime() {
  lastDummyReceivedAt = moment().tz('Asia/Seoul');
}

function getLastDummyTimeFormatted() {
  return lastDummyReceivedAt
    ? lastDummyReceivedAt.format('YY.MM.DD HH:mm:ss')
    : '❌ 수신 내역 없음';
}

module.exports = {
  updateDummyTime,
  getLastDummyTimeFormatted
};
