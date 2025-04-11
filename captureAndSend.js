// ✅👇 captureAndSend.js (로딩 없이 차트 흐름만 따라가는 최종 버전)
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
  console.error(`❌ TV_CHART_URL_${interval} not found in environment variables.`);
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
    await page.waitForTimeout(3000);

    await page.waitForSelector('button[class*="emailButton"]');
    await page.click('button[class*="emailButton"]');

    await page.waitForSelector("input#id_username");
    await page.type("input#id_username", TV_EMAIL, { delay: 50 });

    await page.waitForSelector("input#id_password");
    await page.type("input#id_password", TV_PASSWORD, { delay: 50 });

    await page.click("button[class*='submitButton']");

    // ✅ 로그인 후 자연스러운 흐름 확보
    await page.waitForTimeout(1000);
    console.log("✅ 로그인 입력 후 흐름 유지됨");

    await page.goto(chartUrl, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000); // 차트 초기 렌더 대기

    // ✅ 광고 닫기 시도
    try {
      const popup = await page.$("div[role='dialog'] button[aria-label='Close']");
      if (popup) {
        await popup.click();
        console.log("🧹 중앙 광고 팝업 닫힘");
      }
    } catch {}

    try {
      const banner = await page.$("div[class*='layout__area--bottom']");
      if (banner) {
        await page.evaluate(() => {
          const el = document.querySelector("div[class*='layout__area--bottom']");
          if (el) el.remove();
        });
        console.log("🧼 하단 배너 제거 완료");
      }
    } catch {}

    await page.waitForTimeout(1000);
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
    } else {
      console.log("⛔ 밍밍 봇 비활성화 상태 – 이미지 전송 스킵됨");
    }
  } catch (err) {
    console.error("❌ 실행 오류:", err.message);
  } finally {
    await browser.close();
  }
})();
