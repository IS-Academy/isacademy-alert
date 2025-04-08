// AlertMessage.js

const config = require('./config');
const moment = require('moment-timezone');
const { getUserLang, getTranslation } = require('./lang');

function escapeHTML(str) {
  return String(str).replace(/[&<>"']/g, (s) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[s]);
}

// ✅ 템플릿 자동 치환 유틸
function replaceTemplate(str, values = {}) {
  return str.replace(/\{(.*?)\}/g, (_, key) => values[key] ?? `{${key}}`);
}

const TYPE_MAP = {
  showSup: 'showSup', showRes: 'showRes', isBigSup: 'isBigSup', isBigRes: 'isBigRes',
  Ready_showSup: 'Ready_showSup', Ready_showRes: 'Ready_showRes', Ready_isBigSup: 'Ready_isBigSup', Ready_isBigRes: 'Ready_isBigRes',
  Ready_exitLong: 'Ready_exitLong', Ready_exitShort: 'Ready_exitShort', exitLong: 'exitLong', exitShort: 'exitShort'
};

function normalizeType(type) {
  return TYPE_MAP[type] || type;
}

function getWaitingMessage(type, symbol, timeframe, weight = config.DEFAULT_WEIGHT, leverage = config.DEFAULT_LEVERAGE, lang = 'ko') {
  const normalizedType = normalizeType(type);
  const userLang = getUserLang(lang);

  const symbolText = getTranslation(userLang, 'symbols', normalizedType) || '#❓Unknown Signal';
  const labelSymbol = getTranslation(userLang, 'labels', 'symbol');
  const labelWeight = replaceTemplate(getTranslation(userLang, 'labels', 'weight'), { weight });
  const labelLeverage = replaceTemplate(getTranslation(userLang, 'labels', 'leverage'), { leverage });

  return `${symbolText} ${timeframe}⏱️\n\n${labelSymbol}: ${symbol}\n${labelWeight} / ${labelLeverage}`;
}

function generateAlertMessage({
  type, symbol, timeframe, price, date, clock,
  lang = 'ko', ts = null, timezone = config.DEFAULT_TIMEZONE,
  entryCount = 0, entryAvg = null,
  entryLimit = config.MAX_ENTRY_PERCENT,
  weight = config.DEFAULT_WEIGHT, leverage = config.DEFAULT_LEVERAGE,
  htmlEscape = false
}) {
  const normalizedType = normalizeType(type);
  const userLang = getUserLang(lang);

  const signal = getTranslation(userLang, 'symbols', normalizedType) || '#📢알 수 없는 신호';
  const L = (key) => getTranslation(userLang, 'labels', key);

  const timestamp = Number(ts) || Math.floor(Date.now() / 1000);
  const time = moment.unix(timestamp).tz(timezone);
  const dayKey = time.format('ddd');
  const ampm = time.format('A') === 'AM' ? getTranslation(userLang, 'am') : getTranslation(userLang, 'pm');

  const dateFormatted = time.format(`YY. MM. DD. (${getTranslation(userLang, 'days', dayKey) || dayKey})`);
  const clockFormatted = lang === 'ko' ? `${ampm} ${time.format('hh:mm:ss')}` : time.format('hh:mm:ss A');

  const entryTypes = ['showSup', 'showRes', 'isBigSup', 'isBigRes', 'exitLong', 'exitShort'];
  const waitTypes = ['Ready_showSup', 'Ready_showRes', 'Ready_isBigSup', 'Ready_isBigRes'];
  const prepareTypes = ['Ready_exitLong', 'Ready_exitShort'];

  const isEntry = entryTypes.includes(normalizedType);
  const isWait = waitTypes.includes(normalizedType);
  const isPrepare = prepareTypes.includes(normalizedType);

  const safe = (str) => htmlEscape ? escapeHTML(str) : str;

  let msg = 'ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ\n';
  msg += `${signal}\n\n`;
  msg += `${L('symbol')}: ${safe(symbol)}\n`;
  msg += `${L('timeframe')}: ${safe(timeframe)}\n`;

  if (isEntry && price !== null) {
    msg += `${L('price')}: ${safe(Number(price).toLocaleString())}\n`;
  }

  if (isEntry && entryCount > 0) {
    msg += replaceTemplate(L('entryInfo'), {
      entryCount,
      entryAvg: entryAvg && !isNaN(entryAvg) ? Number(entryAvg).toLocaleString() : 'N/A'
    }) + '\n';
    if (entryCount >= entryLimit) {
      msg += `${L('entryLimitReached')}\n`;
    }
  }

  if (isWait) {
    msg += replaceTemplate(L('weight'), { weight }) + '\n';
    msg += replaceTemplate(L('leverage'), { leverage }) + '\n';
  }

  if (isEntry) {
    msg += `\n${L('captured')}:\n${dateFormatted}\n${clockFormatted}\n`;
  }

  msg += `\n${(isEntry || isPrepare) ? L('disclaimer_full') : L('disclaimer_short')}`;
  msg += '\nㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ';

  return msg;
}

module.exports = {
  generateAlertMessage,
  getWaitingMessage
};
