// handlers/messageTemplateManager.js
const templates = require("../MessageTemplates");
const lang = require("../lang");

function formatSignalMessage(type, data, language = "ko") {
  const t = lang.get(language);

  // 🧩 [1] 메시지 헤더 (시그널 제목)
  const header = templates[type] || "#❓Unknown Signal";

  // 🧩 [2] 공통 정보 (심볼, 타임프레임, 현재가)
  const common = `
📌 ${t.symbol}: ${data.symbol}
⏱️ ${t.timeframe}: ${data.timeframe}${t.timeframeUnit}
💲 ${t.price}: ${data.price}`;

  // 🧩 [3] 진입 정보 (진입률, 평균가)
  const entryInfo = data.entry
    ? `\n📊 ${t.entry} ${data.entry.percent}% / ${t.avgPrice} ${data.entry.avgPrice}`
    : "";

  // 🧩 [4] 수익률 정보 (PnL / ROE)
  const resultInfo = data.result
    ? `\n📈${t.profit} ${data.result.pnl} / ${t.roe} ${data.result.roe}`
    : "";

  // 🧩 [5] 포착 시간
  const time = `\n\n🕒 ${t.capturedAt}:
${data.time}\n`;

  // 🧩 [6] 고정 푸터 (면책 문구 등)
  const footer = `\n${t.notice1}\n${t.notice2}`;

  // 🧩 [7] 최종 메시지 조립
  return `ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
${header}
${common}${entryInfo}${resultInfo}${time}${footer}
ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ`;
}

module.exports = { formatSignalMessage };
