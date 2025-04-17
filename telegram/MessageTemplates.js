//✅👇 MessageTemplates.js ==> 📂 기본 함수 제공 (포맷, 날짜, 언어팩)

const moment = require('moment-timezone');
const config = require('../config');
const { translations } = require('./lang');

// ✅ 숫자 포맷 함수 (1,000 단위 쉼표)
function formatNumber(num) {
  return Number(num).toLocaleString(); // ✅ 쉼표 포맷 적용
}

// ✅ [1] 날짜 포맷 함수 (언어팩 기반 요일 표시 포함)
function formatDate(ts, lang = 'ko') {
  const tz = translations[lang]?.timezone || config.DEFAULT_TIMEZONE;
  const m = moment.unix(ts).tz(tz);

  const dayTranslated = translations[lang]?.days[m.day()] || m.format('ddd');

  // 📅 날짜 문자열 조립
  const date = `${m.format('YY. MM. DD.')} (${dayTranslated})`;

  // 🕐 시간 문자열 조립 (언어별 AM/PM 적용)
  const time = m.format(translations[lang]?.am === 'AM' ? 'A hh:mm:ss' : 'A hh:mm:ss')
    .replace('AM', translations[lang]?.am)
    .replace('PM', translations[lang]?.pm);
  return { date, time };
}

// ✅ Ready_용 메시지 줄 구성 포맷
function formatReadyLine(symbolText, symbol, timeframe, weight, leverage, labels) {
  return `${symbolText} ${timeframe}${labels.timeframeUnit}⏱️\n\n` +
         `${labels.symbol}: ${symbol}\n` +
         `${labels.weight.replace('{weight}', `${weight}%`)} / ` +
         `${labels.leverage.replace('{leverage}', `${leverage}×`)}`;
}

// ✅ 헤더 템플릿 반환 (기본 문자열 관리)
function getHeaderTemplate(type, lang = 'ko') {
  const symbols = translations[lang]?.symbols || translations['ko'].symbols;
  return symbols[type] || "#❓알 수 없는 신호";
}

// 📦 모든 필요한 함수 export (템플릿 생성 로직은 messageTemplateManager가 맡음)
module.exports = {
  formatNumber,
  formatDate,
  formatReadyLine,
  getHeaderTemplate
};
