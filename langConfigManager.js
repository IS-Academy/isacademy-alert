// ✅ langConfigManager.js

const fs = require('fs');
const path = './langConfig.json';

function ensureLangConfigFile() {
  if (!fs.existsSync(path)) {
    saveLangConfig({});
  }
}

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

function saveLangConfig(data) {
  try {
    fs.writeFileSync(path, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('❌ langConfig 저장 실패:', err.message);
  }
}

let langConfig = loadLangConfig();

function getUserConfig(chatId) {
  return langConfig[chatId];
}

function setUserLang(chatId, lang) {
  if (!['ko', 'en', 'zh', 'ja'].includes(lang)) return false;
  const current = langConfig[chatId]?.lang;
  if (current === lang) return true;
  langConfig[chatId] = langConfig[chatId] || {};
  langConfig[chatId].lang = lang;
  saveLangConfig(langConfig);
  return true;
}

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
