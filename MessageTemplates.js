// ✅ MessageTemplates.js

const moment = require('moment-timezone');
const config = require('./config');
const { translations } = require('./lang');
const { getEntryInfo } = require('./utils');

function formatDate(ts, tz = config.DEFAULT_TIMEZONE, lang = 'ko') {
  const m = moment.unix(ts).tz(tz);
  const dayKey = m.format('ddd');
  const dayTranslated = translations[lang]?.days?.[dayKey] || dayKey;
  const date = m.format(`YY. MM. DD. (${dayTranslated})`);
  const time = m.format(translations[lang]?.am === 'AM' ? 'A hh:mm:ss' : 'A hh:mm:ss')
    .replace('AM', translations[lang]?.am)
    .replace('PM', translations[lang]?.pm);
  return { date, time };
}

function generatePnLLine(price, entryAvg, entryCount, lang = 'ko') {
  const avg = parseFloat(entryAvg);
  const cur = parseFloat(price);
  const percent = parseFloat(entryCount);
  if (!avg || !cur || !percent) return '';

  const pnl = ((cur - avg) / avg * 100).toFixed(2);
  const capital = ((pnl * percent) / 100).toFixed(2);

  const isProfit = parseFloat(pnl) >= 0;
  const line = isProfit ? translations[lang]?.labels?.pnlLineProfit : translations[lang]?.labels?.pnlLineLoss;
  return line.replace('{pnl}', pnl).replace('{capital}', capital);
}

function getTemplate({
  type,
  symbol,
  timeframe,
  price,
  ts,
  entryCount = 0,
  entryAvg = 'N/A',
  weight = config.DEFAULT_WEIGHT,
  leverage = config.DEFAULT_LEVERAGE,
  lang = 'ko'
}) {
  const { date, time } = formatDate(ts, config.DEFAULT_TIMEZONE, lang);
  const labels = translations[lang]?.labels || translations['ko'].labels;
  const symbols = translations[lang]?.symbols || translations['ko'].symbols;

  const entryInfo = entryCount > 0
    ? `${labels.entryInfo.replace('{entryCount}', entryCount).replace('{entryAvg}', entryAvg)}`
    : '';
  const pnlLine = (type === 'exitLong' || type === 'exitShort')
    ? generatePnLLine(price, entryAvg, entryCount, lang)
    : '';
  const capTime = `${labels.captured}:
${date}
${time}`;
  const disclaimer = labels.disclaimer_full;

  const templates = {
    showSup: `${symbols.showSup}

${labels.symbol}: ${symbol}
${labels.timeframe}: ${timeframe}
${labels.price}: ${price}
${entryInfo}

${capTime}

${disclaimer}`,
    showRes: `${symbols.showRes}

${labels.symbol}: ${symbol}
${labels.timeframe}: ${timeframe}
${labels.price}: ${price}
${entryInfo}

${capTime}

${disclaimer}`,
    isBigSup: `${symbols.isBigSup}

${labels.symbol}: ${symbol}
${labels.timeframe}: ${timeframe}
${labels.price}: ${price}
${entryInfo}

${capTime}

${disclaimer}`,
    isBigRes: `${symbols.isBigRes}

${labels.symbol}: ${symbol}
${labels.timeframe}: ${timeframe}
${labels.price}: ${price}
${entryInfo}

${capTime}

${disclaimer}`,
    exitLong: `${symbols.exitLong}

${labels.symbol}: ${symbol}
${labels.timeframe}: ${timeframe}
${labels.price}: ${price}
${entryInfo}
${pnlLine}

${capTime}

${disclaimer}`,
    exitShort: `${symbols.exitShort}

${labels.symbol}: ${symbol}
${labels.timeframe}: ${timeframe}
${labels.price}: ${price}
${entryInfo}
${pnlLine}

${capTime}

${disclaimer}`,
    Ready_showSup: `${symbols.Ready_showSup} ${timeframe}⏱️

${labels.symbol}: ${symbol}
${labels.weight.replace('{weight}', weight)} / ${labels.leverage.replace('{leverage}', leverage)}`,
    Ready_showRes: `${symbols.Ready_showRes} ${timeframe}⏱️

${labels.symbol}: ${symbol}
${labels.weight.replace('{weight}', weight)} / ${labels.leverage.replace('{leverage}', leverage)}`,
    Ready_isBigSup: `${symbols.Ready_isBigSup} ${timeframe}⏱️

${labels.symbol}: ${symbol}
${labels.weight.replace('{weight}', weight)} / ${labels.leverage.replace('{leverage}', leverage)}`,
    Ready_isBigRes: `${symbols.Ready_isBigRes} ${timeframe}⏱️

${labels.symbol}: ${symbol}
${labels.weight.replace('{weight}', weight)} / ${labels.leverage.replace('{leverage}', leverage)}`,
    Ready_exitLong: `${symbols.Ready_exitLong} ${timeframe}⏱️

${labels.symbol}: ${symbol}
${labels.weight.replace('{weight}', weight)} / ${labels.leverage.replace('{leverage}', leverage)}`,
    Ready_exitShort: `${symbols.Ready_exitShort} ${timeframe}⏱️

${labels.symbol}: ${symbol}
${labels.weight.replace('{weight}', weight)} / ${labels.leverage.replace('{leverage}', leverage)}`
  };

  if (templates[type]) {
    return templates[type];
  } else {
    console.warn(`⚠️ MessageTemplates: 알 수 없는 type='${type}'`);
    return `⚠️ 알 수 없는 신호 타입입니다: ${type}`;
  }
}

module.exports = {
  getTemplate
};
