// ✅👇 captureAndSend.js (광고 닫기 + 관리자봇 온오프 연동 + 상태캡처 제거)
require("dotenv").config();
const puppeteer = require("puppeteer-core");
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const { loadBotState } = require("./utils"); // 관리자 상태 파일 불러오기

const BROWSERLESS_TOKEN = process.env.BROWSERLESS_TOKEN;
const TV_EMAIL = process.env.TV_EMAIL;
const TV_PASSWORD = process.env.TV_PASSWORD;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const TELEGRAM_BOT_TOKEN_A = process.env.TELEGRAM_BOT_TOKEN_A;
const TELEGRAM_CHAT_ID_A = process.env.TELEGRAM_CHAT_ID_A;

const interval = process.argv.find(arg => arg.includes("--interval="))?.split("=")[1] || "1";
const type = process.argv.find(arg => arg.includes("--type="))?.split("=")[1] || "unknown";
const chartUrl = process.env[`TV_CHART_URL_${interval}`];
if (!chartUrl) {
  console.error(`❌ TV_CHART_URL_${interval} not found in environment variables.`);
  process.exit(1);
}

// ✅ 관리자봇 상태 불러오기
const { choiEnabled, mingEnabled } = loadBotState();
const CAPTURE_TYPES = ["exitLong", "exitShort"];
if (!CAPTURE_TYPES.includes(type)) {
  console.log("📵 이미지 캡처 대상이 아님 → 종료");
  process.exit(0);
}

(async () => {
  console.log(`📸 이미지 캡처 시작: interval=${interval}, type=${type}`);

  const browser = await puppeteer.connect({
    browserWSEndpoint: `wss://chrome.browserless.io?token=${BROWSERLESS_TOKEN}`
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });

  try {
    await page.goto("https://www.tradingview.com/accounts/signin/?lang=en");
    await page.waitForTimeout(3000);

    await page.waitForSelector('button[class*="emailButton"]', { timeout: 10000 });
    await page.click('button[class*="emailButton"]');

    await page.waitForSelector("input#id_username", { timeout: 15000 });
    await page.type("input#id_username", TV_EMAIL, { delay: 50 });

    await page.waitForSelector("input#id_password", { timeout: 15000 });
    await page.type("input#id_password", TV_PASSWORD, { delay: 50 });

    await Promise.all([
      page.click("button[class*='submitButton']"),
      page.waitForNavigation({ waitUntil: "networkidle0" })
    ]);

    console.log("✅ 트레이딩뷰 로그인 성공");

    await page.goto(chartUrl, { waitUntil: "networkidle2" });

    // ✅ 광고 닫기 시도
    try {
      await page.waitForSelector("div[role='dialog'] button[aria-label='Close']", { timeout: 3000 });
      await page.click("div[role='dialog'] button[aria-label='Close']");
      console.log("🧹 광고 팝업 닫기 완료");
    } catch {
      console.log("ℹ️ 광고 팝업 없음");
    }

    await page.waitForTimeout(5000);
    const buffer = await page.screenshot({ type: "png" });

    if (choiEnabled) {
      const form = new FormData();
      form.append("chat_id", TELEGRAM_CHAT_ID);
      form.append("photo", buffer, {
        filename: `chart_${interval}min.png`,
        contentType: "image/png"
      });
      await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`, form, {
        headers: form.getHeaders()
      });
      console.log("✅ 최실장 이미지 전송 완료");
    }

    if (mingEnabled) {
      const formA = new FormData();
      formA.append("chat_id", TELEGRAM_CHAT_ID_A);
      formA.append("photo", buffer, {
        filename: `chart_${interval}min.png`,
        contentType: "image/png"
      });
      await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN_A}/sendPhoto`, formA, {
        headers: formA.getHeaders()
      });
      console.log("✅ 밍밍 이미지 전송 완료");
    }
  } catch (err) {
    console.error("❌ 실행 오류:", err.message);
  } finally {
    await browser.close();
  }
})();
