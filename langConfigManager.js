const fs = require('fs');
const path = './langConfig.json';

let userLangMap = {};

// ✅ 초기 로드
function loadLangConfig() {
  try {
    const raw = fs.readFileSync(path, 'utf-8');
    const parsed = JSON.parse(raw);
    userLangMap = parsed; // ✅ 여기서 userLangMap 갱신
    return parsed;
  } catch (err) {
    console.warn('⚠️ 언어 설정 로딩 실패:', err.message);
    return {};
  }
}

// ✅ 처음 한 번 로드
loadLangConfig();

// ✅ 실시간 감지 시 반영
fs.watchFile(path, (curr, prev) => {
  console.log('🔄 langConfig.json 변경 감지됨, 다시 로드합니다.');
  loadLangConfig();
});

// ✅ 사용자 설정 가져오기 (메모리 기반)
function getUserConfig(chatId) {
  return userLangMap[String(chatId)] || {};
}

// ✅ 사용자 언어 가져오기
function getUserLang(chatId) {
  const entry = getUserConfig(chatId);
  const lang = entry.lang || 'ko';
  return ['ko', 'en', 'zh'].includes(lang) ? lang : 'ko';
}

// ✅ 사용자 시간대 가져오기
function getUserTimezone(chatId) {
  const entry = getUserConfig(chatId);
  return entry.tz || 'Asia/Seoul';
}

// ✅ 사용자 언어 설정
function setUserLang(chatId, lang) {
  if (!['ko', 'en', 'zh'].includes(lang)) return false;
  const entry = getUserConfig(chatId);
  entry.lang = lang;
  userLangMap[String(chatId)] = entry;
  fs.writeFileSync(path, JSON.stringify(userLangMap, null, 2));
  return true;
}

// ✅ 사용자 시간대 설정
function setUserTimezone(chatId, tz) {
  try {
    if (!tz || !Intl.DateTimeFormat(undefined, { timeZone: tz })) return false;
    const entry = getUserConfig(chatId);
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
  getUserConfig,
  getUserLang,
  getUserTimezone,
  setUserLang,
  setUserTimezone
};
