// ✅👇 handlers/messageTemplateManager.js

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
  let resultInfo = "";
  if (data.result && typeof data.result.pnl === "number") {
    const direction = data.direction || "long"; // 기본값은 롱
    const rawPnl = data.result.pnl;
    const rawRoe = data.result.roe;

    // 👉 숏 포지션이면 손익 반대로 계산
    const pnl = direction === "short" ? -rawPnl : rawPnl;
    const roe = direction === "short" ? -rawRoe : rawRoe;

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
