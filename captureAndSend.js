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
const TELEGRAM_BOT_TOKEN_A = process.env.TELEGRAM_BOT_TOKEN_A;
const TELEGRAM_CHAT_ID_A = process.env.TELEGRAM_CHAT_ID_A;

const interval = process.argv.find(arg => arg.includes("--interval="))?.split("=")[1] || "1";
const type = process.argv.find(arg => arg.includes("--type="))?.split("=")[1] || "unknown";
const chartUrl = process.env[`TV_CHART_URL_${interval}`];

if (!chartUrl) {
  console.error(`❌ TV_CHART_URL_${interval} not found.`);
  process.exit(1);
}

const choiEnabled = global.choiEnabled ?? true;
const mingEnabled = global.mingEnabled ?? true;
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

    await page.waitForSelector('button[class*="emailButton"]', { visible: true });
    await page.click('button[class*="emailButton"]');

    await page.waitForSelector("input#id_username", { visible: true });
    await page.type("input#id_username", TV_EMAIL, { delay: 50 });

    await page.waitForSelector("input#id_password", { visible: true });
    await page.type("input#id_password", TV_PASSWORD, { delay: 50 });

    await page.click("button[class*='submitButton']");

    // ✅ 명확한 로그인 확인 선택자 (프로필 아이콘 체크)
    await page.waitForSelector("button[aria-label='Open user menu']", { timeout: 10000 });
    console.log("✅ 로그인 완료 확정");

    await page.goto(chartUrl, { waitUntil: "networkidle0" });

    // ✅ 차트 로딩 확인 (차트 컨테이너 존재 확인)
    await page.waitForSelector(".chart-markup-table", { timeout: 15000 });
    console.log("✅ 차트 로딩 완료 확정");

    // ✅ 광고 체크 및 제거
    await page.evaluate(() => {
      document.querySelector("div[role='dialog'] button[aria-label='Close']")?.click();
      document.querySelector("div[class*='layout__area--bottom']")?.remove();
    });
    console.log("🧹 광고 정리 완료");

    const buffer = await page.screenshot({ type: "png" });

    const sendTelegram = async (token, chatId, buffer) => {
      const form = new FormData();
      form.append("chat_id", chatId);
      form.append("photo", buffer, { filename: `chart_${interval}min.png`, contentType: "image/png" });
      await axios.post(`https://api.telegram.org/bot${token}/sendPhoto`, form, { headers: form.getHeaders() });
    };

    if (choiEnabled) {
      await sendTelegram(TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, buffer);
      console.log("✅ 최실장 이미지 전송 완료");
    }

    if (mingEnabled) {
      await sendTelegram(TELEGRAM_BOT_TOKEN_A, TELEGRAM_CHAT_ID_A, buffer);
      console.log("✅ 밍밍 이미지 전송 완료");
    } else {
      console.log("⛔ 밍밍 봇 비활성화 상태 – 이미지 전송 스킵됨");
    }

  } catch (err) {
    console.error("❌ 실행 오류:", err.message);
  } finally {
    await browser.close();
  }
})();
