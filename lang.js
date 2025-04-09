const ko = require('./locales/ko');
const en = require('./locales/en');
const zh = require('./locales/zh');
const ja = require('./locales/jp');

const translations = { ko, en, zh, ja };

function getUserLang(lang) {
  return translations[lang] ? lang : 'ko';
}

function getTranslation(lang, section, key) {
  const userLang = getUserLang(lang);
  return translations[userLang]?.[section]?.[key] || '';
}

module.exports = {
  translations,
  getUserLang,
  getTranslation
};
