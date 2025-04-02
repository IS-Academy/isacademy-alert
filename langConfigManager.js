// langConfigManager.js
const fs = require('fs');
const path = './langConfig.json';

let userLangMap = {};

// ✅ 초기 로드
function loadLangConfig() {
  try {
    const raw = fs.readFileSync(path, 'utf-8');
    userLangMap = JSON.parse(raw);
    console.log('✅ 언어 설정 로드 완료');
  } catch (err) {
    console.warn('⚠️ 언어 설정 로드 실패. 기본값 사용');
    userLangMap = {};
  }
}

// ✅ 실시간 감지
fs.watchFile(path, (curr, prev) => {
  console.log('🔄 langConfig.json 변경 감지됨, 다시 로드합니다.');
  loadLangConfig();
});

// ✅ 사용자 언어 가져오기
function getUserLang(chatId) {
  const entry = userLangMap[String(chatId)] || {};
  const lang = entry.lang || 'ko';
  return ['ko', 'en', 'zh'].includes(lang) ? lang : 'ko';
}

// ✅ 사용자 시간대 가져오기
function getUserTimezone(chatId) {
  const entry = userLangMap[String(chatId)] || {};
  return entry.tz || 'Asia/Seoul';
}

// ✅ 사용자 설정 업데이트
function setUserLang(chatId, lang) {
  if (!['ko', 'en', 'zh'].includes(lang)) return false;
  const entry = userLangMap[String(chatId)] || {};
  entry.lang = lang;
  userLangMap[String(chatId)] = entry;
  fs.writeFileSync(path, JSON.stringify(userLangMap, null, 2));
  return true;
}

function setUserTimezone(chatId, tz) {
  try {
    if (!tz || !Intl.DateTimeFormat(undefined, { timeZone: tz })) return false;
    const entry = userLangMap[String(chatId)] || {};
    entry.tz = tz;
    userLangMap[String(chatId)] = entry;
    fs.writeFileSync(path, JSON.stringify(userLangMap, null, 2));
    return true;
  } catch {
    return false;
  }
}

module.exports = {
  loadLangConfig,
  getUserLang,
  getUserTimezone,
  setUserLang,
  setUserTimezone
};
