const ko = require('./locales-test/ko');
const en = require('./locales-test/en');
const zh = require('./locales-test/zh');
const jp = require('./locales-test/jp');

const translations = { ko, en, zh, jp };

function get(lang = 'ko') {
  return translations[lang] || translations['ko'];
}

module.exports = { get };
