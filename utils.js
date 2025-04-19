//✅👇 utils.js

const fs = require('fs');                                     // 📁 파일 시스템 접근
const path = require('path');                                 // 📂 경로 유틸리티
const moment = require('moment-timezone');                    // ⏰ 시간대 지원 날짜 포맷터
const { getTranslation } = require('./lang');                 // 🌐 다국어 번역 함수
const {
  sendToAdmin,
  sendToChoi,
  sendToMing,
  sendToEnglish,
  sendToChina,
  sendToJapan
} = require('./botManager');                                  // 📤 텔레그램 봇별 메시지 전송 함수
const config = require('./config');                           // ⚙️ 설정 파일 로드

// ✅ 최대 진입 허용 퍼센트 (%)
const MAX_ENTRY_PERCENT = config.MAX_ENTRY_PERCENT || 30;     // 🚨 진입 제한 퍼센트 (기본값: 30%)

// ✅ 템플릿 치환 함수: 문자열 내 {key}를 values 객체의 값으로 바꿔주는 유틸 함수
// 예: replaceTemplate("안녕하세요 {name}님", { name: '홍길동' }) → "안녕하세요 홍길동님"
function replaceTemplate(str, values = {}) {
  return str.replace(/\{(.*?)\}/g, (_, key) => values[key] ?? `{${key}}`);
}

// ✨ 기존 유지 (진입 캐시 구조)
const longEntries = {};     // 📊 롱 진입 기록
const shortEntries = {};    // 📉 숏 진입 기록

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

// ✅ 진입을 추가하는 함수
function addEntry(symbol, type, price, timeframe = 'default', lang = 'ko') {
  const entryMap = getEntryMapByType(type);
  if (!entryMap) return;

  if (!entryMap[symbol]) entryMap[symbol] = {};
  if (!entryMap[symbol][timeframe]) entryMap[symbol][timeframe] = [];

  const parsed = parseFloat(price);
  if (!Number.isFinite(parsed)) return;

  // ✅ 현재 진입 개수 확인
  const currentCount = entryMap[symbol][timeframe].length;
  const currentPercent = currentCount + 1;

  if (currentPercent > MAX_ENTRY_PERCENT) {
    const key = isLongType(type) ? 'entryLimitReachedLong' : 'entryLimitReachedShort';
    const warning = getTranslation(lang, 'labels', key);
    if (global.choiEnabled) sendToChoi(warning);
    if (global.mingEnabled) sendToMing(warning);
    if (global.englishEnabled) sendToEnglish(warning);
    if (global.chinaEnabled) sendToChina(warning);
    if (global.japanEnabled) sendToJapan(warning);
    return;
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
const BACKUP_FILE = path.join(__dirname, 'bot_state.backup.json');

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

function backupBotState() {
  try {
    fs.copyFileSync(STATE_FILE, BACKUP_FILE);
    console.log('✅ 상태 백업 완료');
    return true;
  } catch (err) {
    console.error('❌ 상태 백업 실패:', err.message);
    sendToAdmin(`❌ 상태 백업 실패: ${err.message}`);
    return false;
  }
}

// ✅ 기본값으로 상태 리셋
function resetBotStateToDefault() {
  const defaultState = {
    choiEnabled: true,
    mingEnabled: true,
    englishEnabled: true,
    chinaEnabled: true,
    japanEnabled: true
  };
  try {
    saveBotState(defaultState);
    Object.assign(global, defaultState);
    console.log('✅ 상태 기본값으로 리셋됨');
    return defaultState;
  } catch (err) {
    console.error('❌ 상태 리셋 실패:', err.message);
    sendToAdmin(`❌ 상태 리셋 실패: ${err.message}`);
    return null;
  }
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

// ✅ 내보내는 함수들과 각각의 역할 주석
module.exports = {
  replaceTemplate,          // 🧩 문자열 템플릿 치환
  isLongType,               // 🟢 롱 신호 판단
  isShortType,              // 🔴 숏 신호 판단
  addEntry,                 // ➕ 진입 데이터 추가
  clearEntries,             // ❌ 진입 데이터 초기화
  getEntryInfo,             // 📊 진입 평균 및 개수 계산
  getAllEntryInfo,          // 🧾 전체 타임프레임 진입 요약
  updateLastDummyTime,      // 🕓 마지막 더미 시간 갱신
  getLastDummyTime,         // 🕒 마지막 더미 시간 조회
  loadBotState,             // 📥 봇 상태 불러오기
  saveBotState,             // 💾 봇 상태 저장
  getTimeString,            // ⏰ 현재 시간 문자열 반환
  setAdminMessageId,        // 📝 관리자 메시지 ID 설정
  getAdminMessageId,        // 🔍 관리자 메시지 ID 조회
  saveAdminMessageId,       // 💾 메시지 ID 저장
  loadAdminMessageId,       // 📂 메시지 ID 불러오기
  backupBotState,           // 🛡️ 상태 파일 백업
  resetBotStateToDefault    // 🔄 봇 상태 기본값으로 초기화
};
