// ✅ MessageTemplates.js

const moment = require('moment-timezone');
const config = require('./config');
const { translations } = require('./lang');
const { getAllEntryInfo } = require('./utils');

function formatDate(ts, tz = config.DEFAULT_TIMEZONE, lang = 'ko') {
  const m = moment.unix(ts).tz(tz);
  const dayKey = m.format('ddd');
  const dayTranslated = translations[lang]?.days?.[dayKey] || dayKey;
  const date = m.format(`YY. MM. DD. (${dayTranslated})`);
  const time = m.format(translations[lang]?.am === 'AM' ? 'A hh:mm:ss' : 'A hh:mm:ss').replace('AM', translations[lang]?.am).replace('PM', translations[lang]?.pm);
  return { date, time };
}

function formatEntrySummary(symbol, type, lang = 'ko') {
  const entryList = getAllEntryInfo(symbol, type);
  if (entryList.length === 0) return '';
  return '\n' + (translations[lang]?.labels.entrySummary || '⏱️ 진입 현황:') + '\n' + entryList.map(e => {
    const line = translations[lang]?.labels.entryInfoByTF || "• {tf}min → ✅ {percent}% / 평균가 {avg}";
    return line.replace('{tf}', e.timeframe).replace('{percent}', e.entryCount).replace('{avg}', e.entryAvg);
  }).join('\n');
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

  const entryInfo = entryCount > 0 ? `${labels.entryInfo.replace('{entryCount}', entryCount).replace('{entryAvg}', entryAvg)}` : '';
  const pnlLine = (type === 'exitLong' || type === 'exitShort') ? generatePnLLine(price, entryAvg, entryCount, lang) : '';
  const capTime = `${labels.captured}:\n${date}\n${time}`;
  const disclaimer = labels.disclaimer_full;
  const entrySummary = formatEntrySummary(symbol, type, lang);

  const templates = {
    showSup: `${symbols.showSup}\n\n${labels.symbol}: ${symbol}\n${labels.timeframe}: ${timeframe}\n${labels.price}: ${price}\n${entryInfo}${entrySummary}\n\n${capTime}\n\n${disclaimer}`,
    showRes: `${symbols.showRes}\n\n${labels.symbol}: ${symbol}\n${labels.timeframe}: ${timeframe}\n${labels.price}: ${price}\n${entryInfo}${entrySummary}\n\n${capTime}\n\n${disclaimer}`,
    isBigSup: `${symbols.isBigSup}\n\n${labels.symbol}: ${symbol}\n${labels.timeframe}: ${timeframe}\n${labels.price}: ${price}\n${entryInfo}${entrySummary}\n\n${capTime}\n\n${disclaimer}`,
    isBigRes: `${symbols.isBigRes}\n\n${labels.symbol}: ${symbol}\n${labels.timeframe}: ${timeframe}\n${labels.price}: ${price}\n${entryInfo}${entrySummary}\n\n${capTime}\n\n${disclaimer}`,
    exitLong: `${symbols.exitLong}\n\n${labels.symbol}: ${symbol}\n${labels.timeframe}: ${timeframe}\n${labels.price}: ${price}\n${entryInfo}\n${pnlLine}${entrySummary}\n\n${capTime}\n\n${disclaimer}`,
    exitShort: `${symbols.exitShort}\n\n${labels.symbol}: ${symbol}\n${labels.timeframe}: ${timeframe}\n${labels.price}: ${price}\n${entryInfo}\n${pnlLine}${entrySummary}\n\n${capTime}\n\n${disclaimer}`,
    Ready_showSup: `${symbols.Ready_showSup} ${timeframe}⏱️\n\n${labels.symbol}: ${symbol}\n${labels.weight.replace('{weight}', weight)} / ${labels.leverage.replace('{leverage}', leverage)}`,
    Ready_showRes: `${symbols.Ready_showRes} ${timeframe}⏱️\n\n${labels.symbol}: ${symbol}\n${labels.weight.replace('{weight}', weight)} / ${labels.leverage.replace('{leverage}', leverage)}`,
    Ready_isBigSup: `${symbols.Ready_isBigSup} ${timeframe}⏱️\n\n${labels.symbol}: ${symbol}\n${labels.weight.replace('{weight}', weight)} / ${labels.leverage.replace('{leverage}', leverage)}`,
    Ready_isBigRes: `${symbols.Ready_isBigRes} ${timeframe}⏱️\n\n${labels.symbol}: ${symbol}\n${labels.weight.replace('{weight}', weight)} / ${labels.leverage.replace('{leverage}', leverage)}`,
    Ready_exitLong: `${symbols.Ready_exitLong} ${timeframe}⏱️\n\n${labels.symbol}: ${symbol}\n${labels.weight.replace('{weight}', weight)} / ${labels.leverage.replace('{leverage}', leverage)}`,
    Ready_exitShort: `${symbols.Ready_exitShort} ${timeframe}⏱️\n\n${labels.symbol}: ${symbol}\n${labels.weight.replace('{weight}', weight)} / ${labels.leverage.replace('{leverage}', leverage)}`
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
