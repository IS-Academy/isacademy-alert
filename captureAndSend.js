// ✅ captureAndSend.js

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
  console.error(`❌ TV_CHART_URL_${interval} 환경변수가 없습니다.`);
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
  await page.setViewport({ width: 1024, height: 600 });

  // 🚨 봇 탐지 우회 옵션
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.6261.69 Safari/537.36"
  );
  await page.evaluateOnNewDocument(() => {
    delete navigator.__proto__.webdriver;
  });

  await page.setExtraHTTPHeaders({
    "Accept-Language": "ko-KR,ko;q=0.9"
  });

  // 🚀 불필요한 요청 차단 (강력 추천!)
  await page.setRequestInterception(true);
  page.on("request", req => {
    if (
      ["image", "stylesheet", "font", "media"].includes(req.resourceType()) ||
      req.url().includes("google-analytics") ||
      req.url().includes("ads")
    ) {
      req.abort();
    } else {
      req.continue();
    }
  });

  try {
    await page.goto("https://kr.tradingview.com/accounts/signin/", {
      waitUntil: "domcontentloaded",
      timeout: 60000
    });

    await page.waitForSelector('button[class*="emailButton"]', { visible: true });
    await page.click('button[class*="emailButton"]');

    await page.waitForSelector("#id_username", { visible: true });
    await page.type("#id_username", TV_EMAIL, { delay: 30 });

    await page.waitForSelector("#id_password", { visible: true });
    await page.type("#id_password", TV_PASSWORD, { delay: 30 });

    await Promise.all([
      page.click("button[class*='submitButton']"),
      page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60000 })
    ]);

    await page.waitForSelector("button[aria-label='사용자 메뉴 열기']", { visible: true, timeout: 60000 });
    console.log("✅ 로그인 성공 확인됨");

    await page.goto(chartUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForSelector("canvas", { visible: true, timeout: 60000 });
    console.log("✅ 차트 로딩 완료됨");

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

