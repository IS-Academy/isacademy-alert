// ✅ langConfigManager.js
const fs = require('fs');
const path = './langConfig.json';

// ✅ langConfig.json이 존재하지 않을 경우 기본 파일 생성
function ensureLangConfigFile() {
  if (!fs.existsSync(path)) {
    saveLangConfig({});
  }
}

// ✅ 초기 로드
function loadLangConfig() {
  ensureLangConfigFile();
  try {
    const data = fs.readFileSync(path, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.warn('⚠️ langConfig.json 로드 실패, 기본값 사용');
    return {};
  }
}

// ✅ 저장
function saveLangConfig(data) {
  try {
    fs.writeFileSync(path, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('❌ langConfig 저장 실패:', err.message);
  }
}

// ✅ 처음 한 번 로드
let langConfig = loadLangConfig();

// ✅ 사용자 설정 가져오기 (메모리 기반)
function getUserConfig(chatId) {
  return langConfig[chatId];
}

// ✅ 사용자 언어 가져오기
function setUserLang(chatId, lang) {
  if (!['ko', 'en', 'zh', 'ja'].includes(lang)) return false;
  langConfig[chatId] = langConfig[chatId] || {};
  langConfig[chatId].lang = lang;
  saveLangConfig(langConfig);
  return true;
}

// ✅ 사용자 시간대 가져오기
function setUserTimezone(chatId, timezone) {
  if (!timezone) return false;
  langConfig[chatId] = langConfig[chatId] || {};
  langConfig[chatId].tz = timezone;
  saveLangConfig(langConfig);
  return true;
}

module.exports = {
  getUserConfig,
  setUserLang,
  setUserTimezone
};
