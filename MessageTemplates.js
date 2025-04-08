// MessageTemplates.js

const moment = require('moment-timezone');
const config = require('./config');
const { translations } = require('./lang');

function formatDate(ts, tz = config.DEFAULT_TIMEZONE, lang = 'ko') {
  const m = moment.unix(ts).tz(tz);
  const dayKey = m.format('ddd');
  const dayTranslated = translations[lang]?.days?.[dayKey] || dayKey;
  const date = m.format(`YY. MM. DD. (${dayTranslated})`);
  const time = m.format(translations[lang]?.am === 'AM' ? 'A hh:mm:ss' : 'A hh:mm:ss').replace('AM', translations[lang]?.am).replace('PM', translations[lang]?.pm);
  return { date, time };
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

  const entryInfo = entryCount > 0 ? labels.entryInfo.replace('{entryCount}', entryCount).replace('{entryAvg}', entryAvg) : '';
  const capTime = `${labels.captured}:\n${date}\n${time}`;
  const disclaimer = labels.disclaimer_full;

  const templates = {
    showSup: `#🩵${translations[lang]?.symbols.showSup}\n\n${labels.symbol}: ${symbol}\n${labels.timeframe}: ${timeframe}\n${labels.price}: ${price}\n${entryInfo}\n\n${capTime}\n\n${disclaimer}`,
    showRes: `#❤️${translations[lang]?.symbols.showRes}\n\n${labels.symbol}: ${symbol}\n${labels.timeframe}: ${timeframe}\n${labels.price}: ${price}\n${entryInfo}\n\n${capTime}\n\n${disclaimer}`,
    isBigSup: `#🚀${translations[lang]?.symbols.isBigSup}\n\n${labels.symbol}: ${symbol}\n${labels.timeframe}: ${timeframe}\n${labels.price}: ${price}\n${entryInfo}\n\n${capTime}\n\n${disclaimer}`,
    isBigRes: `#🛸${translations[lang]?.symbols.isBigRes}\n\n${labels.symbol}: ${symbol}\n${labels.timeframe}: ${timeframe}\n${labels.price}: ${price}\n${entryInfo}\n\n${capTime}\n\n${disclaimer}`,
    exitLong: `#💰${translations[lang]?.symbols.exitLong}\n\n${labels.symbol}: ${symbol}\n${labels.timeframe}: ${timeframe}\n${labels.price}: ${price}\n${entryInfo}\n\n${capTime}\n\n${disclaimer}`,
    exitShort: `#💰${translations[lang]?.symbols.exitShort}\n\n${labels.symbol}: ${symbol}\n${labels.timeframe}: ${timeframe}\n${labels.price}: ${price}\n${entryInfo ? entryInfo + '\n' : ''}\n${capTime}\n\n${disclaimer}`,
    Ready_showSup: `#${translations[lang]?.symbols.Ready_showSup} ${timeframe}⏱️\n\n${labels.symbol}: ${symbol}\n${labels.weight.replace('{weight}', weight)} / ${labels.leverage.replace('{leverage}', leverage)}`,
    Ready_showRes: `#${translations[lang]?.symbols.Ready_showRes} ${timeframe}⏱️\n\n${labels.symbol}: ${symbol}\n${labels.weight.replace('{weight}', weight)} / ${labels.leverage.replace('{leverage}', leverage)}`,
    Ready_isBigSup: `#${translations[lang]?.symbols.Ready_isBigSup} ${timeframe}⏱️\n\n${labels.symbol}: ${symbol}\n${labels.weight.replace('{weight}', weight)} / ${labels.leverage.replace('{leverage}', leverage)}`,
    Ready_isBigRes: `#${translations[lang]?.symbols.Ready_isBigRes} ${timeframe}⏱️\n\n${labels.symbol}: ${symbol}\n${labels.weight.replace('{weight}', weight)} / ${labels.leverage.replace('{leverage}', leverage)}`,
    Ready_exitLong: `#${translations[lang]?.symbols.Ready_exitLong} ${timeframe}⏱️\n\n${labels.symbol}: ${symbol}\n${labels.weight.replace('{weight}', weight)} / ${labels.leverage.replace('{leverage}', leverage)}`,
    Ready_exitShort: `#${translations[lang]?.symbols.Ready_exitShort} ${timeframe}⏱️\n\n${labels.symbol}: ${symbol}\n${labels.weight.replace('{weight}', weight)} / ${labels.leverage.replace('{leverage}', leverage)}`
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
