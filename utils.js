//✅👇 utils.js

const fs = require('fs');
const moment = require('moment-timezone');
const { getTranslation } = require('./lang');
const { sendToAdmin, sendToChoi, sendToMing, sendToEnglish, sendToChina, sendToJapan } = require('./botManager');
const config = require('./config');

// ✅ 최대 진입 허용 퍼센트 (%)
const MAX_ENTRY_PERCENT = config.MAX_ENTRY_PERCENT || 30; // 최대 진입 허용 %

// ✅ 템플릿 치환 함수: 문자열 내 {key} 치환
function replaceTemplate(str, values = {}) {
  return str.replace(/\{(.*?)\}/g, (_, key) => values[key] ?? `{${key}}`);
}

// ✅ 진입 캐시 (롱/숏 분리)
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

// ✅ 진입 추가
function addEntry(symbol, type, price, timeframe = 'default', lang = 'ko') {
  const entryMap = getEntryMapByType(type);
  if (!entryMap) return;

  if (!entryMap[symbol]) entryMap[symbol] = {};
  if (!entryMap[symbol][timeframe]) entryMap[symbol][timeframe] = [];

  const parsed = parseFloat(price);
  if (!Number.isFinite(parsed)) return;

  // ✅ 현재 진입 개수 확인
  const currentCount = entryMap[symbol][timeframe].length;
  const currentPercent = currentCount + 1; // 1회 = 1%

  if (currentPercent > MAX_ENTRY_PERCENT) {
    const key = isLongType(type) ? 'entryLimitReachedLong' : 'entryLimitReachedShort';
    const warning = getTranslation(lang, 'labels', key);
    if (global.choiEnabled) sendToChoi(warning);
    if (global.mingEnabled) sendToMing(warning);
    if (global.englishEnabled) sendToEnglish(warning);
    if (global.chinaEnabled) sendToChina(warning);
    if (global.japanEnabled) sendToJapan(warning);
    return; // 포화 상태이면 진입하지 않음
  }

  entryMap[symbol][timeframe].push(parsed);
}

// ✅ 진입 초기화
function clearEntries(symbol, type, timeframe = 'default') {
  const entryMap = getEntryMapByType(type);
  if (entryMap && entryMap[symbol]) {
    entryMap[symbol][timeframe] = [];
  }
}

// ✅ 특정 심볼의 평균 및 카운트 가져오기
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

// ✅ 전체 타임프레임 진입 요약 (for 메시지)
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

// ✅ 더미 시각 처리
let lastDummyTime = null;
function updateLastDummyTime(time = new Date().toISOString()) {
  lastDummyTime = time;
}
function getLastDummyTime() {
  return lastDummyTime || '❌ 기록 없음';
}

// ✅ 상태 저장 및 불러오기
const STATE_FILE = path.join(__dirname, 'bot_state.json');

function loadBotState() {
  try {
    const raw = fs.readFileSync(STATE_FILE);
    const parsed = JSON.parse(raw);

    return {
      choiEnabled: parsed.choiEnabled ?? true,
      mingEnabled: parsed.mingEnabled ?? true,
      englishEnabled: parsed.englishEnabled ?? true,
      chinaEnabled: parsed.chinaEnabled ?? true,
      japanEnabled: parsed.japanEnabled ?? true
    };
  } catch {
    return {
      choiEnabled: true,
      mingEnabled: true,
      englishEnabled: true,
      chinaEnabled: true,
      japanEnabled: true
    };
  }
}

function saveBotState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

// ✅ 관리자 패널 메시지 ID 관리(파일 저장 방식)
const MSG_ID_FILE = path.join(__dirname, 'admin_message_id.json');
let adminMessageId = null;
function saveAdminMessageId(id) {
  adminMessageId = id;
  fs.writeFileSync(MSG_ID_FILE, JSON.stringify(id));
}
function loadAdminMessageId() {
  try {
    const loaded = JSON.parse(fs.readFileSync(MSG_ID_FILE, 'utf8'));
    adminMessageId = loaded;
    return loaded;
  } catch {
    return null;
  }
}
function getAdminMessageId() { return adminMessageId; }
function setAdminMessageId(id) { adminMessageId = id; }

// ✅ 현재시간 문자열 반환
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
  saveAdminMessageId,
  loadAdminMessageId
};
