// browserless_test.js (진단용)
require("dotenv").config();
const puppeteer = require("puppeteer-core");

(async () => {
  const browser = await puppeteer.connect({
    browserWSEndpoint: `wss://chrome.browserless.io?token=${process.env.BROWSERLESS_TOKEN}`
  });
  const page = await browser.newPage();
  
  try {
    console.time("로딩시간");
    await page.goto("https://kr.tradingview.com/", { waitUntil: "domcontentloaded", timeout: 60000 });
    console.timeEnd("로딩시간");
    console.log("✅ TradingView 메인 페이지 로딩 성공");
  } catch (err) {
    console.error("❌ 로딩 실패:", err.message);
  } finally {
    await browser.close();
  }
})();
