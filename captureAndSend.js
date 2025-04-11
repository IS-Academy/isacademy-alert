// ✅👇 captureAndSend.js

require("dotenv").config();
const puppeteer = require("puppeteer-core");
const axios = require("axios");
const FormData = require("form-data");

const BROWSERLESS_TOKEN = process.env.BROWSERLESS_TOKEN;
const TV_EMAIL = process.env.TV_EMAIL;
const TV_PASSWORD = process.env.TV_PASSWORD;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// 커맨드라인에서 interval 인자 받기
const interval = process.argv.find(arg => arg.includes("--interval="))?.split("=")[1] || "1";
const chartUrl = process.env[`TV_CHART_URL_${interval}`];

if (!chartUrl) {
  console.error(`❌ TV_CHART_URL_${interval} not found in environment variables.`);
  process.exit(1);
}

(async () => {
  console.log(`🔐 Logging into TradingView and capturing chart for interval ${interval}...`);

  const browser = await puppeteer.connect({
    browserWSEndpoint: `wss://chrome.browserless.io?token=${BROWSERLESS_TOKEN}`
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });

  try {
    // 1. 로그인 시도 (영문 고정)
    await page.goto("https://www.tradingview.com/accounts/signin/?lang=en");
    await page.waitForSelector("input[name='username']", { timeout: 15000 });
    await page.type("input[name='username']", TV_EMAIL, { delay: 50 });
    await page.type("input[name='password']", TV_PASSWORD, { delay: 50 });
    await Promise.all([
      page.click("button[type='submit']"),
      page.waitForNavigation({ waitUntil: "networkidle0" })
    ]);

    // 2. 차트 열기 및 캡처
    await page.goto(chartUrl, { waitUntil: "networkidle2" });
    await page.waitForTimeout(5000); // 차트 렌더링 대기

    // 3. 스크린샷 캡처
    const buffer = await page.screenshot({ type: "png" });

    // 4. 텔레그램 전송
    const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`;

    const form = new FormData();
    form.append("chat_id", TELEGRAM_CHAT_ID);
    form.append("photo", buffer, {
      filename: `chart_${interval}min.png`,
      contentType: "image/png"
    });

    await axios.post(telegramUrl, form, {
      headers: form.getHeaders()
    });

    console.log("✅ Chart sent to Telegram successfully.");
  } catch (err) {
    console.error("❌ 실행 오류:", err.message);
  } finally {
    await browser.close();
  }
})();
