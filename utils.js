// ✅👇 utils.js

const fs = require('fs');
const moment = require('moment-timezone');

let adminMessageId = null;
let lastDummyTime = null;

function setAdminMessageId(id) {
  adminMessageId = id;
}

function getAdminMessageId() {
  return adminMessageId;
}

function updateLastDummyTime(time = new Date().toISOString()) {
  lastDummyTime = time;
}

function getLastDummyTime() {
  return lastDummyTime || '❌ 기록 없음';
}

function getTimeString(tz = 'Asia/Seoul') {
  return moment().tz(tz).format('YYYY.MM.DD (ddd) HH:mm:ss');
}

function saveBotState(state) {
  fs.writeFileSync('./bot_state.json', JSON.stringify(state, null, 2));
}

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
  updateLastDummyTime,
  getLastDummyTime,
  getTimeString,
  saveBotState,
  loadBotState
};
