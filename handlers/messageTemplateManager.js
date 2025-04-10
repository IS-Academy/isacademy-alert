// handlers/messageTemplateManager.js
const templates = require("../MessageTemplates");
const lang = require("../lang");

function formatSignalMessage(type, data, language = "ko") {
  const t = lang.get(language);

  const header = templates[type] || "#❓Unknown Signal";

  const common = `
📌 ${t.symbol}: ${data.symbol}
⏱️ ${t.timeframe}: ${data.timeframe}
💲 ${t.price}: ${data.price}`;

  const entryInfo = data.entry
    ? `\n📊 ${t.entry} ${data.entry.percent}% / ${t.avgPrice} ${data.entry.avgPrice}`
    : "";

  const resultInfo = data.result
    ? `\n📈${t.profit} ${data.result.pnl} / ${t.roe} ${data.result.roe}`
    : "";

  const time = `\n\n🕒 ${t.capturedAt}:
${data.time}\n`;

  const footer = `\n${t.notice1}\n${t.notice2}`;

  return `ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
${header}
${common}${entryInfo}${resultInfo}${time}${footer}
ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ`;
}

module.exports = { formatSignalMessage };
