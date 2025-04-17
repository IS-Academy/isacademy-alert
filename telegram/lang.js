//✅👇 lang.js

// 📦 언어별 로컬 번역파일 로드
const ko = require('./locales/ko');
const en = require('./locales/en');
const zh = require('./locales/zh');
const jp = require('./locales/jp');

// 🌐 전체 언어팩 등록
const translations = { ko, en, zh, jp };

// ✅ 언어 코드 유효성 확인 후 fallback
function getUserLang(lang) {
  return translations[lang] ? lang : 'ko';
}

// ✅ 특정 키만 직접 접근할 때 사용
function getTranslation(lang, section, key) {
  const userLang = getUserLang(lang);
  return translations[userLang]?.[section]?.[key] || '';
}

// ✅ 전체 언어팩 객체 반환 (기본 ko)
function get(lang = 'ko') {
  return translations[lang] || translations['ko'];
}

// ✅ 날짜 포맷 유틸 (요일 포함한 날짜 포맷)
function formatDateWithLang(date, langCode = 'ko') {
  const t = get(langCode);
  const dayIndex = date.getDay(); // 0 = 일, 1 = 월 ...
  const dayName = t.days[dayIndex];

  const year = String(date.getFullYear()).slice(2);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}. ${month}. ${day}. (${dayName})`;
}

module.exports = {
  translations,
  getUserLang,
  getTranslation,
  get,
  formatDateWithLang
};
