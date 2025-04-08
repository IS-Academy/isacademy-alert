// ✅ AlertMessage.js - 다국어 대응 메시지 모듈 통합

const moment = require('moment-timezone');
const config = require('./config');
const langMessages = require('./langMessages');

function getLangMsg(key, lang = 'ko') {
  return langMessages?.[lang]?.[key] || key;
}

function formatDate(ts, tz = config.DEFAULT_TIMEZONE) {
  return moment.unix(ts).tz(tz).format('YYYY.MM.DD (ddd) HH:mm:ss');
}

// ✅ 일반 알림 메시지 생성
function generateAlertMessage({ type, symbol, timeframe, price, ts, lang = 'ko', entryCount = 0, entryAvg = 0 }) {
  const timeStr = formatDate(ts);

  return (
    `🚨 <b>${getLangMsg(type, lang)}</b>\n` +
    `━━━━━━━━━━━━━━\n` +
    `📊 종목: <code>${symbol}</code>\n` +
    `⏱️ 타임프레임: <code>${timeframe}</code>\n` +
    `💵 가격: <b>${price}</b>\n` +
    (entryCount > 0
      ? `📈 진입 수량: <code>${entryCount}</code>\n📉 평균 단가: <code>${entryAvg}</code>\n`
      : '') +
    `🕒 포착시간: <code>${timeStr}</code>`
  );
}

// ✅ 대기 메시지 (Ready_ 시리즈)
function getWaitingMessage(type, symbol, timeframe, weight, leverage, lang = 'ko') {
  const label = getLangMsg(type, lang);
  return (
    `⏳ <b>${label}</b>\n` +
    `━━━━━━━━━━━━━━\n` +
    `📊 종목: <code>${symbol}</code>\n` +
    `⏱️ 타임프레임: <code>${timeframe}</code>\n` +
    `📦 포지션 비중: ${weight}%\n` +
    `📌 레버리지: ${leverage}x`
  );
}

// ✅ 진입 요약 메시지
function generateSummaryMessage(entryList = [], lang = 'ko') {
  if (entryList.length === 0) return getLangMsg('no_entries', lang);

  const header = `📋 <b>${getLangMsg('entry_summary', lang)}</b>`;
  const body = entryList.map(e => `• ${e.symbol} (${e.timeframe}) - ${e.price}`).join('\n');
  return `${header}\n${body}`;
}

// ✅ PnL 메시지
function generatePnLMessage({ symbol, pnlPercent, entryAvg, lang = 'ko' }) {
  const status = pnlPercent >= 0 ? '📈 수익중' : '📉 손실중';
  return (
    `💰 <b>${status}</b>\n` +
    `━━━━━━━━━━━━━━\n` +
    `📊 종목: ${symbol}\n` +
    `📉 평균 단가: ${entryAvg}\n` +
    `📈 수익률: <b>${pnlPercent.toFixed(2)}%</b>`
  );
}

module.exports = {
  getLangMsg,
  generateAlertMessage,
  getWaitingMessage,
  generateSummaryMessage,
  generatePnLMessage
};
