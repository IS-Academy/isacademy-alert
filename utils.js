const fs = require('fs');
let adminMessageId = null;

function setAdminMessageId(id) { adminMessageId = id; }
function getAdminMessageId() { return adminMessageId; }

function getTimeString(tz = 'Asia/Seoul') {
  return new Date().toLocaleString('ko-KR', { timeZone: tz });
}

function saveBotState(state) {
  fs.writeFileSync('./bot_state.json', JSON.stringify(state, null, 2));
}

module.exports = { setAdminMessageId, getAdminMessageId, getTimeString, saveBotState };