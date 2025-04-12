// ✅👇 MessageTemplates.js

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

function generatePnLLine(price, entryAvg, entryCount, leverage = 50, lang = 'ko') {
  const avg = parseFloat(entryAvg);
  const cur = parseFloat(price);
  const count = parseInt(entryCount);
  const lev = parseFloat(leverage);

  if (!avg || !cur || !count || !lev) {
    return '📈수익률 +-% / 원금대비 +-%📉 계산 불가';
  }

  const pnlRaw = ((cur - avg) / avg) * 100;
  const pnl = pnlRaw * lev;
  const gross = (count * pnl) / 100;
  const pnlStr = pnl.toFixed(2);
  const grossStr = gross.toFixed(2);
  const isProfit = pnl >= 0;

  const line = isProfit
    ? translations[lang]?.labels?.pnlLineProfit
    : translations[lang]?.labels?.pnlLineLoss;

  return line.replace('{pnl}', pnlStr).replace('{capital}', grossStr);
}

function generateEntryInfo(entryCount, entryAvg, lang = 'ko') {
  const percent = parseInt(entryCount);
  const avg = parseFloat(entryAvg).toFixed(1);

  const valid = percent && avg;
  if (!valid) {
    return '📊 진입 비율 정보 없음 / 평균가 계산 불가';
  }

  const labels = translations[lang]?.labels || translations['ko'].labels;
  return `${labels.entryInfo.replace('{entryCount}', `${percent}%`).replace('{entryAvg}', avg)}`;
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

  const entryInfo = generateEntryInfo(entryCount, entryAvg, lang);
  const pnlLine = (type === 'exitLong' || type === 'exitShort')
    ? generatePnLLine(price, entryAvg, entryCount, leverage, lang)
    : '';
  const capTime = `${labels.captured}:\n${date}\n${time}`;
  const disclaimer = labels.disclaimer_full;

  const templates = {
    showSup: `${symbols.showSup}\n\n${labels.symbol}: ${symbol}\n${labels.timeframe}: ${timeframe}\n${labels.price}: ${price}\n${entryInfo}\n\n${capTime}\n\n${disclaimer}`,
    showRes: `${symbols.showRes}\n\n${labels.symbol}: ${symbol}\n${labels.timeframe}: ${timeframe}\n${labels.price}: ${price}\n${entryInfo}\n\n${capTime}\n\n${disclaimer}`,
    isBigSup: `${symbols.isBigSup}\n\n${labels.symbol}: ${symbol}\n${labels.timeframe}: ${timeframe}\n${labels.price}: ${price}\n${entryInfo}\n\n${capTime}\n\n${disclaimer}`,
    isBigRes: `${symbols.isBigRes}\n\n${labels.symbol}: ${symbol}\n${labels.timeframe}: ${timeframe}\n${labels.price}: ${price}\n${entryInfo}\n\n${capTime}\n\n${disclaimer}`,
    exitLong: `${symbols.exitLong}\n\n${labels.symbol}: ${symbol}\n${labels.timeframe}: ${timeframe}\n${labels.price}: ${price}\n${entryInfo}\n${pnlLine}\n\n${capTime}\n\n${disclaimer}`,
    exitShort: `${symbols.exitShort}\n\n${labels.symbol}: ${symbol}\n${labels.timeframe}: ${timeframe}\n${labels.price}: ${price}\n${entryInfo}\n${pnlLine}\n\n${capTime}\n\n${disclaimer}`,
    Ready_showSup: `${symbols.Ready_showSup} ${timeframe}⏱️\n\n${labels.symbol}: ${symbol}\n${labels.weight.replace('{weight}', `${weight}%`)} / ${labels.leverage.replace('{leverage}', `${leverage}×`)}`,
    Ready_showRes: `${symbols.Ready_showRes} ${timeframe}⏱️\n\n${labels.symbol}: ${symbol}\n${labels.weight.replace('{weight}', `${weight}%`)} / ${labels.leverage.replace('{leverage}', `${leverage}×`)}`,
    Ready_isBigSup: `${symbols.Ready_isBigSup} ${timeframe}⏱️\n\n${labels.symbol}: ${symbol}\n${labels.weight.replace('{weight}', `${weight}%`)} / ${labels.leverage.replace('{leverage}', `${leverage}×`)}`,
    Ready_isBigRes: `${symbols.Ready_isBigRes} ${timeframe}⏱️\n\n${labels.symbol}: ${symbol}\n${labels.weight.replace('{weight}', `${weight}%`)} / ${labels.leverage.replace('{leverage}', `${leverage}×`)}`,
    Ready_exitLong: `${symbols.Ready_exitLong} ${timeframe}⏱️\n\n${labels.symbol}: ${symbol}\n${labels.weight.replace('{weight}', `${weight}%`)} / ${labels.leverage.replace('{leverage}', `${leverage}×`)}`,
    Ready_exitShort: `${symbols.Ready_exitShort} ${timeframe}⏱️\n\n${labels.symbol}: ${symbol}\n${labels.weight.replace('{weight}', `${weight}%`)} / ${labels.leverage.replace('{leverage}', `${leverage}×`)}`
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
