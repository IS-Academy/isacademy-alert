// langConfigManager.js
const fs = require('fs');
const path = './langConfig.json';

let userLangMap = {};

// ✅ 초기 로드
function getUserConfig(chatId) {
  try {
    const raw = fs.readFileSync('./langConfig.json', 'utf-8');
    const config = JSON.parse(raw);
    return config[chatId] || {};
  } catch (err) {
    console.warn('⚠️ 언어 설정 로딩 실패:', err.message);
    return {};
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
