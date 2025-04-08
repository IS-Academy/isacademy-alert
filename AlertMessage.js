// ✅ AlertMessage.js - 이모지 포맷 보강 적용

const moment = require('moment-timezone');
const config = require('./config');
const langMessages = require('./langMessages');

function getLangMsg(key, lang = 'ko') {
  return langMessages?.[lang]?.[key] || key;
}

function formatDate(ts, tz = config.DEFAULT_TIMEZONE) {
  const m = moment.unix(ts).tz(tz);
  return `${m.format('YY. MM. DD. (ddd)')}\n${m.format('A hh:mm:ss')}`;
}

function getEmojiByType(type) {
  if (type.includes('Short')) return '📉';
  if (type.includes('Long')) return '📈';
  return '📊';
}

function getSymbolEmoji(type) {
  if (type.includes('강한') && type.includes('Long')) return '🚀';
  if (type.includes('강한') && type.includes('Short')) return '🛸';
  if (type.includes('Long')) return '🩵';
  if (type.includes('Short')) return '❤️';
  return '💰';
}

// ✅ 진입 및 청산 알림 메시지
function generateAlertMessage({ type, symbol, timeframe, price, ts, lang = 'ko', entryCount = 0, entryAvg = 0 }) {
  const label = getLangMsg(type, lang);
  const timeStr = formatDate(ts);
  const emoji = getSymbolEmoji(label);

  const avgDisplay = entryCount > 0 ? `📊 진입 ${entryCount}% / 평균가 ${entryAvg}` : '';

  return (
    `#${emoji}${label}${emoji}관점공유${emoji}\n\n` +
    `📌 종목: ${symbol}\n` +
    `⏱️ 타임프레임: ${timeframe}\n` +
    `💲 가격: ${price}\n` +
    (avgDisplay ? `${avgDisplay}\n` : ``) +
    `\n` +
    `🕒 포착시간:\n${timeStr}\n` +
    `\n` +
    `⚠️관점공유는 언제나【자율적 참여】\n⚠️모든 투자와 판단은 본인의 몫입니다.`
  );
}

// ✅ 대기 메시지 (4줄 고정 + 이모지)
function getWaitingMessage(type, symbol, timeframe, weight = config.DEFAULT_WEIGHT, leverage = config.DEFAULT_LEVERAGE, lang = 'ko') {
  const label = getLangMsg(type, lang);
  const icon = getEmojiByType(label);

  return (
    `#${label} ${icon}${timeframe}⏱️\n\n` +
    `📌 종목: ${symbol}\n` +
    `🗝️ 비중: ${weight}% / 🎲 배율: ${leverage}×`
  );
}

function generateSummaryMessage(entryList = [], lang = 'ko') {
  if (entryList.length === 0) return getLangMsg('no_entries', lang);
  const header = `📋 <b>${getLangMsg('entry_summary', lang)}</b>`;
  const body = entryList.map(e => `• ${e.symbol} (${e.timeframe}) - ${e.price}`).join('\n');
  return `${header}\n${body}`;
}

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
