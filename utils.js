// ✅👇 utils.js

const fs = require('fs');
const moment = require('moment-timezone');
const { getTranslation } = require('./lang');
const { sendToAdmin, sendToChoi, sendToMing } = require('./botManager');
const config = require('./config');

const MAX_ENTRY_PERCENT = config.MAX_ENTRY_PERCENT || 30; // 최대 진입 허용 %

let adminMessageId = null;
let lastDummyTime = null;

// ✅ 템플릿 치환
function replaceTemplate(str, values = {}) {
  return str.replace(/\{(.*?)\}/g, (_, key) => values[key] ?? `{${key}}`);
}

// ✅ 진입 관련
const longEntries = {};
const shortEntries = {};

function isLongType(type) {
  return ['showSup', 'isBigSup', 'Ready_showSup', 'Ready_isBigSup'].includes(type);
}

function isShortType(type) {
  return ['showRes', 'isBigRes', 'Ready_showRes', 'Ready_isBigRes'].includes(type);
}

function getEntryMapByType(type) {
  if (isLongType(type)) return longEntries;
  if (isShortType(type)) return shortEntries;
  return null;
}

function addEntry(symbol, type, price, timeframe = 'default', lang = 'ko') {
  const entryMap = getEntryMapByType(type);
  if (!entryMap) return;

  if (!entryMap[symbol]) entryMap[symbol] = {};
  if (!entryMap[symbol][timeframe]) entryMap[symbol][timeframe] = [];

  const parsed = parseFloat(price);
  if (!Number.isFinite(parsed)) return;

  const currentCount = entryMap[symbol][timeframe].length;
  const currentPercent = currentCount + 1; // 1회 = 1%

  if (currentPercent > MAX_ENTRY_PERCENT) {
    const key = isLongType(type) ? 'entryLimitReachedLong' : 'entryLimitReachedShort';
    const warning = getTranslation(lang, 'labels', key);
    if (global.choiEnabled) sendToChoi(warning);
    if (global.mingEnabled) sendToMing(warning);
    return;
  }

  entryMap[symbol][timeframe].push(parsed);
}

function clearEntries(symbol, type, timeframe = 'default') {
  const entryMap = getEntryMapByType(type);
  if (entryMap && entryMap[symbol]) {
    entryMap[symbol][timeframe] = [];
  }
}

function getEntryInfo(symbol, type, timeframe = 'default') {
  const entryMap = getEntryMapByType(type);
  if (!entryMap) return { entryCount: 0, entryAvg: 'N/A' };

  const entries = entryMap[symbol]?.[timeframe] || [];
  const entryCount = entries.length;
  const entryAvg = entryCount > 0
    ? (entries.reduce((sum, val) => sum + val, 0) / entryCount).toFixed(2)
    : 'N/A';

  return { entryCount, entryAvg };
}

function getAllEntryInfo(symbol, type) {
  const entryMap = getEntryMapByType(type);
  if (!entryMap || !entryMap[symbol]) return [];

  return Object.entries(entryMap[symbol])
    .map(([tf, entries]) => {
      const entryCount = entries.length;
      const entryAvg = entryCount > 0
        ? (entries.reduce((sum, val) => sum + val, 0) / entryCount).toFixed(2)
        : 'N/A';
      return { timeframe: tf, entryCount, entryAvg };
    })
    .filter(e => e.entryCount > 0)
    .sort((a, b) => parseInt(a.timeframe) - parseInt(b.timeframe));
}

// ✅ 더미 타임 관리
function updateLastDummyTime(time = new Date().toISOString()) {
  lastDummyTime = time;
}

function getLastDummyTime() {
  return lastDummyTime || '❌ 기록 없음';
}

// ✅ 봇 상태 저장
const STATE_FILE = './bot_state.json';

function loadBotState() {
  try {
    const raw = fs.readFileSync(STATE_FILE);
    return JSON.parse(raw);
  } catch {
    return { choiEnabled: true, mingEnabled: true };
  }
}

function saveBotState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

// ✅ 관리자 패널 메시지 관리
function setAdminMessageId(id) {
  adminMessageId = id;
}

function getAdminMessageId() {
  return adminMessageId;
}

function getTimeString(tz = 'Asia/Seoul') {
  return moment().tz(tz).format('YYYY.MM.DD (ddd) HH:mm:ss');
}

module.exports = {
  replaceTemplate,
  isLongType,
  isShortType,
  addEntry,
  clearEntries,
  getEntryInfo,
  getAllEntryInfo,
  updateLastDummyTime,
  getLastDummyTime,
  loadBotState,
  saveBotState,
  getTimeString,
  setAdminMessageId,
  getAdminMessageId,
};
