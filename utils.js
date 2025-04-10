// ✅👇 utils.js

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

// 추가 (복원된 코드)
function loadBotState() {
  try {
    const raw = fs.readFileSync('./bot_state.json');
    return JSON.parse(raw);
  } catch {
    return { choiEnabled: true, mingEnabled: true };
  }
}

module.exports = {
  setAdminMessageId,
  getAdminMessageId,
  getTimeString,
  saveBotState,
  loadBotState, // ✅ 추가
};
