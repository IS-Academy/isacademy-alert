//✅👇 MessageTemplates.js

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

// ✅ 공통 수익률 + ROE 계산기 (롱/숏 방향 반영 추가)
function calculatePnL(price, entryAvg, entryCount, leverage = 50, direction = 'long', lang = 'ko') {
  const avg = parseFloat(entryAvg);
  const cur = parseFloat(price);
  const count = parseInt(entryCount);
  const lev = parseFloat(leverage);

  const valid = avg > 0 && cur > 0 && count > 0 && lev > 0;
  if (!valid || !Number.isFinite(avg) || !Number.isFinite(cur)) return null;

  let pnlRaw = ((cur - avg) / avg) * 100;
  if (direction === 'short') {
    pnlRaw *= -1; // 📉 숏 방향이면 반대로!
  }

  const pnl = pnlRaw * lev;
  const gross = (count * pnl) / 100;

  return {
    pnl: pnl.toFixed(2),
    gross: gross.toFixed(2),
    isProfit: pnl >= 0
  };
}

// ✅ 진입 비중 / 평균단가 표시 / 다국어 지원 generateEntryInfo
function generateEntryInfo(entryCount, entryAvg, lang = 'ko') {
  const labels = translations[lang]?.labels || translations['ko'].labels;
  const count = parseInt(entryCount, 10);
  const avgNum = parseFloat(entryAvg);
  const avg = Number.isFinite(avgNum) ? formatNumber(avgNum.toFixed(1)) : null;
  const valid = Number.isFinite(count) && avg !== null;
  if (!valid || count <= 0) {
    return labels.noEntryInfo; // 다국어 메시지 반환
  }
  return labels.entryInfo
    .replace('{entryCount}', count)
    .replace('{entryAvg}', avg);
}

// ✅ 진입가 기반 수익률 계산 (exit 신호에서만 사용됨) / 다국어 지원 generatePnLLine
function generatePnLLine(price, entryAvg, entryCount, leverage = 50, lang = 'ko', direction = 'long') {
  const labels = translations[lang]?.labels || translations['ko'].labels;
  const result = calculatePnL(price, entryAvg, entryCount, leverage, direction, lang);
  if (!result) return labels.pnlCalculationError; //'📈수익률 +-% / 원금대비 +-%📉 계산 불가'; / 다국어 메시지 반환

  const { pnl, gross, isProfit } = result;
  const pnlStr = (isProfit ? '+' : '') + pnl;
  const grossStr = (isProfit ? '+' : '') + gross;
  const line = isProfit ? labels.pnlLineProfit : labels.pnlLineLoss;

  return line.replace('{pnl}', pnlStr).replace('{capital}', grossStr);
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
  calculatePnL,
  generateEntryInfo,
  generatePnLLine,
  formatReadyLine,
  getHeaderTemplate
};
