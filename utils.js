// utils.js
const fs = require('fs');
const moment = require('moment-timezone');

let adminMessageId = null;

function setAdminMessageId(id) { adminMessageId = id; }
function getAdminMessageId() { return adminMessageId; }

function getTimeString(tz = 'Asia/Seoul') {
  return moment().tz(tz).format('YYYY.MM.DD (ddd) HH:mm:ss');
}

function saveBotState(state) {
  fs.writeFileSync('./bot_state.json', JSON.stringify(state, null, 2));
}

module.exports = {
  setAdminMessageId,
  getAdminMessageId,
  getTimeString,
  saveBotState
};