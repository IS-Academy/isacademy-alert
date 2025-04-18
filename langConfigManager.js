//✅👇 langConfigManager.js

const fs = require('fs');
const config = require('./config');
const path = './langConfig.json';

// ✅ 지원하는 언어 목록
const SUPPORTED_LANGS = ['ko', 'en', 'zh', 'jp'];

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

function initUser(chatId) {
  if (!langConfig[chatId]) langConfig[chatId] = {};
}

function getUserConfig(chatId) {
  // ✅ 특정 채널은 언어 고정 (변경 불가)
  if (chatId === config.TELEGRAM_CHAT_ID_GLOBAL) return { lang: 'en' };
  if (chatId === config.TELEGRAM_CHAT_ID_CHINA)  return { lang: 'zh' };
  if (chatId === config.TELEGRAM_CHAT_ID_JAPAN)  return { lang: 'jp' };

  return langConfig[chatId];
}

function setUserLang(chatId, lang) {
  // ✅ 언어 고정된 채널은 변경 금지
  if ([
    config.TELEGRAM_CHAT_ID_GLOBAL,
    config.TELEGRAM_CHAT_ID_CHINA,
    config.TELEGRAM_CHAT_ID_JAPAN
  ].includes(chatId)) return false;
  
  if (!SUPPORTED_LANGS.includes(lang)) return false;
  initUser(chatId);
  if (langConfig[chatId].lang === lang) return true;
  langConfig[chatId].lang = lang;
  saveLangConfig(langConfig);
  return true;
}

function setUserTimezone(chatId, timezone) {
  if (!timezone) return false;
  initUser(chatId);
  langConfig[chatId].tz = timezone;
  saveLangConfig(langConfig);
  return true;
}

module.exports = {
  getUserConfig,
  setUserLang,
  setUserTimezone
};
