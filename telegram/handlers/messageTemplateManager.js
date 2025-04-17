//✅👇 telegram/handlers/messageTemplateManager.js // 템플릿 기반 메시지 조합 및 생성

// 📦 모듈 및 템플릿 관련 함수 임포트
const { getHeaderTemplate, formatDate, formatNumber, generateEntryInfo, calculatePnL, generatePnLLine, formatReadyLine } = require('../MessageTemplates');
const lang = require("../lang");
const { translations } = require('../lang'); // 🌐 언어팩 객체 명시적 로드
const langManager = require('../langConfigManager');
const config = require('../../config');
const moment = require('moment-timezone');

// 📌 유저의 언어 설정을 얻는 함수
function getUserLang(chatId) {
  return langManager.getUserConfig(chatId)?.lang || 'ko';
}

//📌 텔레그램 메시지 생성 함수 (최종 데이터만 받아서 메시지 조합)
function generateTelegramMessage({ symbol, type, timeframe, price, ts, leverage, entryCount, entryAvg, direction, result }) {
  const langChoi = getUserLang(config.TELEGRAM_CHAT_ID);
  const langMing = getUserLang(config.TELEGRAM_CHAT_ID_A);

  const dataChoi = { symbol: symbol.toUpperCase(), timeframe, price, ts, entryCount, entryAvg, leverage, direction, result };
  const dataMing = { ...dataChoi };

  const msgChoi = formatSignalMessage(type, dataChoi, langChoi);
  const msgMing = formatSignalMessage(type, dataMing, langMing);

  return { msgChoi, msgMing };
}

// 📌 기본 시그널 메시지 생성 (언어팩 활용, 푸시 알림용)
function formatSignalMessage(type, data, language = "ko") {
  const t = lang.get(language);

  // 🧩 [1] 메시지 헤더 (시그널 제목)
  const header = getHeaderTemplate(type, language) || "#❓Unknown Signal";
 
  // 🧩 [2] 공통 정보 (심볼, 타임프레임, 현재가)
  const common = `
${t.labels.symbol}: ${data.symbol}
${t.labels.timeframe}: ${data.timeframe}${t.labels.timeframeUnit}
${t.labels.price}: ${data.price}`;

  // 🧩 [3] 진입 정보 (진입률 및 평균가)
  const entryInfo = (data.entryCount > 0 && data.entryAvg && data.entryAvg !== 'N/A')
    ? `\n${t.labels.entryInfo
        .replace('{entryCount}', data.entryCount)
        .replace('{entryAvg}', data.entryAvg)}`
    : `\n${t.labels.noEntryInfo}`;

  // 🧩 [4] 수익률 정보 (PnL / ROE)
  let resultInfo = "";
  if (data.result && typeof data.result.pnl === "number") {
    const rawPnl = data.result.pnl;
    const rawRoe = data.result.roe;

    // 👉 숏 포지션이면 손익 반대로 계산
    const pnl = data.direction === "short" ? -rawPnl : rawPnl;
    const roe = data.direction === "short" ? -rawRoe : rawRoe;

    // 👉 부호 포함된 수치 포맷 (ex. +1.23)
    const formatSigned = (n) => (n >= 0 ? `+${n.toFixed(2)}` : `${n.toFixed(2)}`);

    // 👉 수익/손실 여부에 따라 템플릿 선택
    const isProfit = pnl >= 0;
    const template = isProfit ? t.pnlLineProfit : t.pnlLineLoss;

    // 👉 최종 손익 메시지 구성
    resultInfo = `\n${template
      .replace("{pnl}", formatSigned(pnl))
      .replace("{capital}", formatSigned(roe))}`;
  }

  // 🧩 [5] 시그널 포착 시간 (현지 시각 변환)
  const timeFormatted = moment.unix(data.ts).tz(t.timezone);
  const dayIndex = timeFormatted.day();
  const dayStr = t.days[dayIndex] || '';
  const dateStr = `${timeFormatted.format('YY.MM.DD')} (${dayStr})`;

  let timeStr = timeFormatted.format('A hh:mm:ss');
  timeStr = timeStr.replace('AM', t.am).replace('PM', t.pm);

  const time = `\n\n${t.labels.captured}:\n${dateStr}\n${timeStr}\n`;

  // 🧩 [6] 푸터 (면책 고지 및 안내문)
  const footer = `\n${t.labels.disclaimer_full}`;

  // 🧩 [7] 전체 메시지 조합 후 반환
  return `ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
${header}${common}${entryInfo}${resultInfo}${time}${footer}
ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ`;
}

// ✅📌 특정 시그널에 맞춘 상세 메시지 생성 (진입/청산 등 특화 템플릿)
function createSignalTemplate({ type, symbol, timeframe, price, ts, entryCount = 0, entryAvg = 'N/A', weight = config.DEFAULT_WEIGHT, leverage = config.DEFAULT_LEVERAGE, lang = 'ko' }) {
  const { date, time } = formatDate(ts, config.DEFAULT_TIMEZONE, lang);
  const labels = lang.translations[lang]?.labels || lang.translations['ko'].labels;
  const symbols = lang.translations[lang]?.symbols || lang.translations['ko'].symbols;

  // ✅ 신호 방향 판단
  const isExit = type.startsWith('exit') || type.startsWith('Ready_exit');
  const isShort = type.endsWith('Short');
  const direction = isShort ? 'short' : 'long';

  // ✅ 진입/평단 정보 텍스트 생성
  const entryInfo = generateEntryInfo(entryCount, entryAvg, lang);
  const formattedPrice = formatNumber(price);

  // ✅ 기대 수익률 계산 (Ready_계열 포함)
  const pnlResult = calculatePnL(price, entryAvg, entryCount, leverage, direction);
  const expectedPnlLine = pnlResult
    ? pnlResult.isProfit
      ? labels.pnlOnlyProfit.replace('{pnl}', Math.abs(pnlResult.pnl))
      : labels.pnlOnlyLoss.replace('{pnl}', Math.abs(pnlResult.pnl))
    : labels.noPnL || '📉수익률 계산 불가';

  // ✅ 청산 신호인 경우만 수익률 계산 포함
  const pnlLine = (type === 'exitLong' || type === 'exitShort')
    ? generatePnLLine(price, entryAvg, entryCount, leverage, language, direction)
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

// 📌 모든 함수 외부 노출
module.exports = { 
  generateTelegramMessage,
  formatSignalMessage,
  createSignalTemplate
};
