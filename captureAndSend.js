// ✅👇 captureAndSend.js (입력창 id 기반 셀렉터로 강화)
require("dotenv").config();
const puppeteer = require("puppeteer-core");
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");

const BROWSERLESS_TOKEN = process.env.BROWSERLESS_TOKEN;
const TV_EMAIL = process.env.TVI_EMAIL;
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

let choiEnabled = true;
let mingEnabled = true;
try {
  const botState = JSON.parse(fs.readFileSync("./botState.json", "utf8"));
  choiEnabled = botState.choiEnabled;
  mingEnabled = botState.mingEnabled;
} catch (err) {
  console.warn("⚠️ botState.json 불러오기 실패, 기본값(true) 사용됨");
}

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
    await page.screenshot({ path: "login_fail_debug.png", fullPage: true });
    console.log("📸 로그인 페이지 상태 캡처 완료 → login_fail_debug.png");

    await page.evaluate(() => {
      const emailBtn = [...document.querySelectorAll("button")]
        .find(el => el.textContent?.trim() === "Email");
      if (emailBtn) emailBtn.click();
    });

    await page.waitForSelector("input#id_username", { timeout: 15000 });
    await page.type("input#id_username", TV_EMAIL, { delay: 50 });

    await page.waitForSelector("input[name='password']", { timeout: 15000 });
    await page.type("input[name='password']", TV_PASSWORD, { delay: 50 });

    await Promise.all([
      page.click("button[type='submit']"),
      page.waitForNavigation({ waitUntil: "networkidle0" })
    ]);

    console.log("✅ 트레이딩뷰 로그인 성공");

    await page.goto(chartUrl, { waitUntil: "networkidle2" });
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
