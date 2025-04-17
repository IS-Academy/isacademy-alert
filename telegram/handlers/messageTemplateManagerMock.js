//✅👇 telegram/handlers/messageTemplateManagerMock.js (테스트 / 개발용 (mock용))

const templates = require("../MessageTemplates");
const lang = require("../lang-test");

function formatSignalMessage(type, data, language = "ko") {
  const t = lang.get(language);
  const header = templates[type] || "#❓Unknown Signal";

  const common =
    `${t.labels.symbol}: ${data.symbol}\n` +
    `${t.labels.timeframe}: ${data.timeframe}\n` +
    `${t.labels.price}: ${data.price}`;

  const entryInfo = data.entry
    ? `\n📊 ${t.labels.entry} ${data.entry.percent}% / ${t.labels.avgPrice} ${data.entry.avgPrice}`
    : "";

  const resultInfo = data.result
    ? `\n📈${t.labels.profit} ${data.result.pnl} / ${t.labels.roe} ${data.result.roe}`
    : "";

  const time = `\n\n🕒 ${t.labels.capturedAt}:\n${data.time}\n`;

  const footer = `\n${t.labels.notice1}\n${t.labels.notice2}`;

  return `ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
${header}
${common}${entryInfo}${resultInfo}${time}${footer}
ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ`;
}

module.exports = { formatSignalMessage };
