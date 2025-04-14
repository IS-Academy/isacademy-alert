// ✅👇 MessageTemplates.js

const moment = require('moment-timezone');
const config = require('./config');
const { translations } = require('./lang');

// ✅ [1] 날짜 포맷 함수 (언어팩 기반 요일 표시 포함)
function formatDate(ts, fallbackTz = config.DEFAULT_TIMEZONE, lang = 'ko') {
  const tz = translations[lang]?.timezone || fallbackTz;
  const m = moment.unix(ts).tz(tz);

  // ✅ 기존 문제: m.format('ddd') → "Mon", "Tue" → 언어팩과 매칭 실패
  // ✅ 수정: m.day() → 0~6 (일~토 숫자 인덱스)로 변경
  const dayIndex = m.day();
  const dayTranslated = translations[lang]?.days?.[dayIndex] || m.format('ddd');

  // 📅 날짜 문자열 조립
  const date = m.format(`YY. MM. DD. (${dayTranslated})`);

  // 🕐 시간 문자열 조립 (언어별 AM/PM 적용)
  const time = m.format(translations[lang]?.am === 'AM' ? 'A hh:mm:ss' : 'A hh:mm:ss')
    .replace('AM', translations[lang]?.am)
    .replace('PM', translations[lang]?.pm);

  return { date, time };
}

// ✅ 진입가 기반 수익률 계산 (exit 신호에서만 사용됨)
function generatePnLLine(price, entryAvg, entryCount, leverage = 50, lang = 'ko') {
  const avg = parseFloat(entryAvg);
  const cur = parseFloat(price);
  const count = parseInt(entryCount);
  const lev = parseFloat(leverage);

  if (!avg || !cur || !count || !lev || !Number.isFinite(avg) || !Number.isFinite(cur)) {
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

// ✅ 진입 비중 / 평균단가 표시
function generateEntryInfo(entryCount, entryAvg, lang = 'ko') {
  const count = parseInt(entryCount, 10);
  const avgNum = parseFloat(entryAvg);
  const avg = Number.isFinite(avgNum) ? avgNum.toFixed(1) : null;

  const valid = Number.isFinite(count) && avg !== null;
  if (!valid || count <= 0) {
    return translations[lang]?.labels?.noEntryInfo || '📊 진입 비율 정보 없음 / 평균가 계산 불가';
  }

  const labels = translations[lang]?.labels || translations['ko'].labels;
  return labels.entryInfo.replace('{entryCount}', count).replace('{entryAvg}', avg);
}

// ✅ 메시지 템플릿 생성기 (신호 타입에 따라 메시지 분기)
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

  // ✅ 진입/평단 정보 블럭 생성
  const entryInfo = generateEntryInfo(entryCount, entryAvg, lang);

  // ✅ 청산 신호인 경우만 수익률 계산 포함
  const pnlLine = (type === 'exitLong' || type === 'exitShort')
    ? generatePnLLine(price, entryAvg, entryCount, leverage, lang)
    : '';
  
  const capTime = `${labels.captured}:\n${date}\n${time}`;
  const disclaimer = labels.disclaimer_full;

  // ✅ 각 신호 유형별 템플릿 정의
  const templates = {
    showSup: `${symbols.showSup}\n\n${labels.symbol}: ${symbol}\n${labels.timeframe}: ${timeframe}${labels.timeframeUnit}\n${labels.price}: ${price}\n${entryInfo}\n\n${capTime}\n\n${disclaimer}`,
    showRes: `${symbols.showRes}\n\n${labels.symbol}: ${symbol}\n${labels.timeframe}: ${timeframe}${labels.timeframeUnit}\n${labels.price}: ${price}\n${entryInfo}\n\n${capTime}\n\n${disclaimer}`,
    isBigSup: `${symbols.isBigSup}\n\n${labels.symbol}: ${symbol}\n${labels.timeframe}: ${timeframe}${labels.timeframeUnit}\n${labels.price}: ${price}\n${entryInfo}\n\n${capTime}\n\n${disclaimer}`,
    isBigRes: `${symbols.isBigRes}\n\n${labels.symbol}: ${symbol}\n${labels.timeframe}: ${timeframe}${labels.timeframeUnit}\n${labels.price}: ${price}\n${entryInfo}\n\n${capTime}\n\n${disclaimer}`,
    exitLong: `${symbols.exitLong}\n\n${labels.symbol}: ${symbol}\n${labels.timeframe}: ${timeframe}${labels.timeframeUnit}\n${labels.price}: ${price}\n${entryInfo}\n${pnlLine}\n\n${capTime}\n\n${disclaimer}`,
    exitShort: `${symbols.exitShort}\n\n${labels.symbol}: ${symbol}\n${labels.timeframe}: ${timeframe}${labels.timeframeUnit}\n${labels.price}: ${price}\n${entryInfo}\n${pnlLine}\n\n${capTime}\n\n${disclaimer}`,
    Ready_showSup: `${symbols.Ready_showSup} ${timeframe}${labels.timeframeUnit}⏱️\n\n${labels.symbol}: ${symbol}\n${labels.weight.replace('{weight}', `${weight}%`)} / ${labels.leverage.replace('{leverage}', `${leverage}×`)}`,
    Ready_showRes: `${symbols.Ready_showRes} ${timeframe}${labels.timeframeUnit}⏱️\n\n${labels.symbol}: ${symbol}\n${labels.weight.replace('{weight}', `${weight}%`)} / ${labels.leverage.replace('{leverage}', `${leverage}×`)}`,
    Ready_isBigSup: `${symbols.Ready_isBigSup} ${timeframe}${labels.timeframeUnit}⏱️\n\n${labels.symbol}: ${symbol}\n${labels.weight.replace('{weight}', `${weight}%`)} / ${labels.leverage.replace('{leverage}', `${leverage}×`)}`,
    Ready_isBigRes: `${symbols.Ready_isBigRes} ${timeframe}${labels.timeframeUnit}⏱️\n\n${labels.symbol}: ${symbol}\n${labels.weight.replace('{weight}', `${weight}%`)} / ${labels.leverage.replace('{leverage}', `${leverage}×`)}`,
    Ready_exitLong: `${symbols.Ready_exitLong} ${timeframe}${labels.timeframeUnit}⏱️\n\n${labels.symbol}: ${symbol}\n${labels.weight.replace('{weight}', `${weight}%`)} / ${labels.leverage.replace('{leverage}', `${leverage}×`)}`,
    Ready_exitShort: `${symbols.Ready_exitShort} ${timeframe}${labels.timeframeUnit}⏱️\n\n${labels.symbol}: ${symbol}\n${labels.weight.replace('{weight}', `${weight}%`)} / ${labels.leverage.replace('{leverage}', `${leverage}×`)}`
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
