//✅👇 handlers/messageTemplateManager.js

const { getTemplate } = require('../MessageTemplates');
const lang = require("../lang");
const langManager = require('../langConfigManager');
const { getEntryInfo } = require('../entryManager');
const config = require('../config');
const moment = require('moment-timezone');

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
  const header = getTemplate({ type, lang: language }) || "#❓Unknown Signal";

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

// 📌 두 함수를 모두 외부에서 사용할 수 있도록 export
module.exports = { 
  generateTelegramMessage,
  formatSignalMessage
};
