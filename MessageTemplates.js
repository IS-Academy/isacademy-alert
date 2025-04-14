// ✅👇 MessageTemplates.js

const moment = require('moment-timezone');
const config = require('./config');
const { translations } = require('./lang');

function formatNumber(num) {
  return Number(num).toLocaleString(); // ✅ 쉼표 포맷 적용
}

// ✅ [1] 날짜 포맷 함수 (언어팩 기반 요일 표시 포함)
function formatDate(ts, fallbackTz = config.DEFAULT_TIMEZONE, lang = 'ko') {
  const tz = translations[lang]?.timezone || fallbackTz;
  const m = moment.unix(ts).tz(tz);

  const dayIndex = m.day();
  const dayTranslated = translations[lang]?.days?.[dayIndex] || m.format('ddd');

  // 📅 날짜 문자열 조립
  const date = `${m.format('YY')}. ${m.format('MM')}. ${m.format('DD')}. (${dayTranslated})`;

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

// ✅ 진입가 기반 수익률 계산 (exit 신호에서만 사용됨)
function generatePnLLine(price, entryAvg, entryCount, leverage = 50, lang = 'ko', direction = 'long') {
  const labels = translations[lang]?.labels || translations['ko'].labels;
  const result = calculatePnL(price, entryAvg, entryCount, leverage, direction, lang);
  if (!result) return '📈수익률 +-% / 원금대비 +-%📉 계산 불가';

  const { pnl, gross, isProfit } = result;
  const line = isProfit ? labels.pnlLineProfit : labels.pnlLineLoss;
  return line.replace('{pnl}', pnl).replace('{capital}', gross);
}

// ✅ 진입 비중 / 평균단가 표시
function generateEntryInfo(entryCount, entryAvg, lang = 'ko') {
  const count = parseInt(entryCount, 10);
  const avgNum = parseFloat(entryAvg);
  const avg = Number.isFinite(avgNum) ? formatNumber(avgNum.toFixed(1)) : null;
  const valid = Number.isFinite(count) && avg !== null;
  if (!valid || count <= 0) {
    return translations[lang]?.labels?.noEntryInfo || '📊 진입 비율 정보 없음 / 평균가 계산 불가';
  }
  const labels = translations[lang]?.labels || translations['ko'].labels;
  return labels.entryInfo.replace('{entryCount}', count).replace('{entryAvg}', avg);
}

// ✅ Ready_용 메시지 줄 구성 포맷
function formatReadyLine(symbolText, symbol, timeframe, weight, leverage, labels) {
  return `${symbolText} ${timeframe}${labels.timeframeUnit}⏱️\n\n` +
         `${labels.symbol}: ${symbol}\n` +
         `${labels.weight.replace('{weight}', `${weight}%`)} / ` +
         `${labels.leverage.replace('{leverage}', `${leverage}×`)}`;
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

  // ✅ 신호 방향 판단
  const isExit = type.startsWith('exit') || type.startsWith('Ready_exit');
  const isShort = type.endsWith('Short');
  const direction = isShort ? 'short' : 'long';

  // ✅ 진입/평단 정보 블럭 생성
  const entryInfo = generateEntryInfo(entryCount, entryAvg, lang);
  const formattedPrice = formatNumber(price);

  // ✅ 수익률만 계산 (Ready_계열 포함)
  const pnlResult = calculatePnL(price, entryAvg, entryCount, leverage, direction);
  const expectedPnlLine = (() => {
    if (!pnlResult) return labels.noPnL || '📉수익률 계산 불가';
    const { pnl, isProfit } = pnlResult;
    return isProfit
      ? labels.pnlOnlyProfit.replace('{pnl}', pnl)
      : labels.pnlOnlyLoss.replace('{pnl}', pnl);
  })();

  // ✅ 청산 신호인 경우만 수익률 계산 포함
  const pnlLine = (type === 'exitLong' || type === 'exitShort')
    ? generatePnLLine(price, entryAvg, entryCount, leverage, lang, direction)
    : '';
  
  const capTime = `${labels.captured}:\n${date}\n${time}`;
  const disclaimer = labels.disclaimer_full;

  // ✅ 각 신호 유형별 템플릿 정의
  const templates = {
    showSup: `${symbols.showSup}\n\n${labels.symbol}: ${symbol}\n${labels.timeframe}: ${timeframe}${labels.timeframeUnit}\n${labels.price}: ${formattedPrice}\n${entryInfo}\n\n${capTime}\n\n${disclaimer}`,
    showRes: `${symbols.showRes}\n\n${labels.symbol}: ${symbol}\n${labels.timeframe}: ${timeframe}${labels.timeframeUnit}\n${labels.price}: ${formattedPrice}\n${entryInfo}\n\n${capTime}\n\n${disclaimer}`,
    isBigSup: `${symbols.isBigSup}\n\n${labels.symbol}: ${symbol}\n${labels.timeframe}: ${timeframe}${labels.timeframeUnit}\n${labels.price}: ${formattedPrice}\n${entryInfo}\n\n${capTime}\n\n${disclaimer}`,
    isBigRes: `${symbols.isBigRes}\n\n${labels.symbol}: ${symbol}\n${labels.timeframe}: ${timeframe}${labels.timeframeUnit}\n${labels.price}: ${formattedPrice}\n${entryInfo}\n\n${capTime}\n\n${disclaimer}`,
    exitLong: `${symbols.exitLong}\n\n${labels.symbol}: ${symbol}\n${labels.timeframe}: ${timeframe}${labels.timeframeUnit}\n${labels.price}: ${formattedPrice}\n${entryInfo}\n${pnlLine}\n\n${capTime}\n\n${disclaimer}`,
    exitShort: `${symbols.exitShort}\n\n${labels.symbol}: ${symbol}\n${labels.timeframe}: ${timeframe}${labels.timeframeUnit}\n${labels.price}: ${formattedPrice}\n${entryInfo}\n${pnlLine}\n\n${capTime}\n\n${disclaimer}`,
    
    Ready_showSup: formatReadyLine(symbols.Ready_showSup, symbol, timeframe, weight, leverage, labels),
    Ready_showRes: formatReadyLine(symbols.Ready_showRes, symbol, timeframe, weight, leverage, labels),
    Ready_isBigSup: formatReadyLine(symbols.Ready_isBigSup, symbol, timeframe, weight, leverage, labels),
    Ready_isBigRes: formatReadyLine(symbols.Ready_isBigRes, symbol, timeframe, weight, leverage, labels),
    
    // ✅ 수정된 Ready_exit 템플릿들
    Ready_exitLong:
      `${symbols.Ready_exitLong} ${timeframe}${labels.timeframeUnit}⏱️\n\n` +
      `${labels.symbol}: ${symbol}\n\n` +
//      `${generateEntryInfo(entryCount, entryAvg, lang)}\n\n` + //✅ 진입&평균가
      `${labels.expectedCloseLong.replace('{price}', formatNumber(price))}\n` +
      `${expectedPnlLine}`,

    Ready_exitShort:
      `${symbols.Ready_exitShort} ${timeframe}${labels.timeframeUnit}⏱️\n\n` +
      `${labels.symbol}: ${symbol}\n\n` +
//      `${generateEntryInfo(entryCount, entryAvg, lang)}\n\n` + //✅ 진입&평균가
      `${labels.expectedCloseShort.replace('{price}', formatNumber(price))}\n` +
      `${expectedPnlLine}`
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
