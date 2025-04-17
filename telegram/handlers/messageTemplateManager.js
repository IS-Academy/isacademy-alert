//✅👇 handlers/messageTemplateManager.js

const { getTemplate: getHeaderTemplate } = require('../../MessageTemplates');
const lang = require("../lang");
const langManager = require('../langConfigManager');
const { getEntryInfo } = require('../entryManager');
const config = require('../../config');
const moment = require('moment-timezone');

const { formatDate, formatNumber, generateEntryInfo, calculatePnL, generatePnLLine, formatReadyLine } = require('../../MessageTemplates');
const { translations } = require('../../lang');

// 📌 유저의 언어 설정을 얻는 함수
function getUserLang(chatId) {
  return langManager.getUserConfig(chatId)?.lang || 'ko';
}

// 📌 웹훅 핸들러 전용 텔레그램 메시지 생성 함수
function generateTelegramMessage({ symbol, type, timeframe, price, ts, leverage }) {
  const langChoi = getUserLang(config.TELEGRAM_CHAT_ID);
  const langMing = getUserLang(config.TELEGRAM_CHAT_ID_A);
  const { entryAvg: avg, entryCount: ratio } = getEntryInfo(symbol, type, timeframe);
  const direction = type.endsWith('Short') ? 'short' : 'long';

  const dataChoi = { symbol: symbol.toUpperCase(), timeframe, price, ts, entryCount: ratio, entryAvg: avg, leverage, direction };
  const dataMing = { ...dataChoi };

  const msgChoi = formatSignalMessage(type, dataChoi, langChoi);
  const msgMing = formatSignalMessage(type, dataMing, langMing);

  return { msgChoi, msgMing };
}

// 📌 기존 formatSignalMessage 함수 유지 및 개선
function formatSignalMessage(type, data, language = "ko") {
  const t = lang.get(language);

  // 🧩 [1] 메시지 헤더 (시그널 제목)
  const header = getHeaderTemplate(type, language) || "#❓Unknown Signal";
 
  // 🧩 [2] 공통 정보 (심볼, 타임프레임, 현재가)
  const common = `
📌 ${t.symbol}: ${data.symbol}
⏱️ ${t.timeframe}: ${data.timeframe}${t.timeframeUnit}
💲 ${t.price}: ${data.price}`;

  // 🧩 [3] 진입 정보 (진입률, 평균가)
  const entryInfo = data.entryCount && data.entryAvg
    ? `\n📊 ${t.entry} ${data.entryCount}% / ${t.avgPrice} ${data.entryAvg}`
    : "";

  // 🧩 [4] 수익률 정보 (PnL / ROE)
  let resultInfo = "";
  if (data.result && typeof data.result.pnl === "number") {
    const rawPnl = data.result.pnl;
    const rawRoe = data.result.roe;

    // 👉 숏 포지션이면 손익 반대로 계산
    const pnl = data.direction === "short" ? -rawPnl : rawPnl;
    const roe = data.direction === "short" ? -rawRoe : rawRoe;

    // 👉 부호 포함된 수치 포맷
    const formatSigned = (n) => (n >= 0 ? `+${n.toFixed(2)}` : `${n.toFixed(2)}`);

    // 👉 수익/손실 여부에 따라 템플릿 선택
    const isProfit = pnl >= 0;
    const template = isProfit ? t.pnlLineProfit : t.pnlLineLoss;

    // 👉 메시지 구성
    resultInfo = `\n${template
      .replace("{pnl}", formatSigned(pnl))
      .replace("{capital}", formatSigned(roe))}`;
  }

  // 🧩 [5] 포착 시간
  const timeFormatted = moment.unix(data.ts).tz(config.DEFAULT_TIMEZONE);
  const dateStr = timeFormatted.format('YY.MM.DD (ddd)');
  const timeStr = timeFormatted.format('A hh:mm:ss');

  const time = `\n\n🕒 ${t.capturedAt}:\n${dateStr}\n${timeStr}\n`;

  // 🧩 [6] 고정 푸터 (면책 문구 등)
  const footer = `\n${t.notice1}\n${t.notice2}`;

  // 🧩 [7] 최종 메시지 조립
  return `ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
${header}
${common}${entryInfo}${resultInfo}${time}${footer}
ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ`;
}



// ✅ 메시지 템플릿 생성기 (신호 타입에 따라 메시지 분기)
function createSignalTemplate({ type, symbol, timeframe, price, ts, entryCount = 0, entryAvg = 'N/A', weight = config.DEFAULT_WEIGHT, leverage = config.DEFAULT_LEVERAGE, lang = 'ko' }) {
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
    const pnlStr = Math.abs(pnl);
    return isProfit
      ? labels.pnlOnlyProfit.replace('{pnl}', pnlStr)
      : labels.pnlOnlyLoss.replace('{pnl}', pnlStr);
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

// 📌 세 함수를 모두 외부에서 사용할 수 있도록 export
module.exports = { 
  generateTelegramMessage,
  formatSignalMessage,
  createSignalTemplate
};
