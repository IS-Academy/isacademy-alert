// ✅👇 captureAndSend.js

require("dotenv").config();
const puppeteer = require("puppeteer-core");
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");

const BROWSERLESS_TOKEN = process.env.BROWSERLESS_TOKEN;
const TV_EMAIL = process.env.TV_EMAIL;
const TV_PASSWORD = process.env.TV_PASSWORD;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const TELEGRAM_BOT_TOKEN_A = process.env.TELEGRAM_BOT_TOKEN_A;
const TELEGRAM_CHAT_ID_A = process.env.TELEGRAM_CHAT_ID_A;

const interval = process.argv.find(arg => arg.includes("--interval="))?.split("=")[1] || "1";
const chartUrl = process.env[`TV_CHART_URL_${interval}`];
if (!chartUrl) {
  console.error(`❌ TV_CHART_URL_${interval} not found in environment variables.`);
  process.exit(1);
}

// 상태 불러오기 (최실장/밍밍 전송 여부)
let choiEnabled = true;
let mingEnabled = true;
try {
  const botState = JSON.parse(fs.readFileSync("./botState.json", "utf8"));
  choiEnabled = botState.choiEnabled;
  mingEnabled = botState.mingEnabled;
} catch (err) {
  console.warn("⚠️ botState.json 불러오기 실패, 기본값 사용됨 (true)");
}

const CAPTURE_TYPES = ["exitLong", "exitShort"];
const fsMessagePath = `./telegramMessage_${interval}.json`;
if (!fs.existsSync(fsMessagePath)) {
  console.warn("⚠️ 텔레그램 메시지 데이터 없음, 종료됨");
  process.exit(1);
}

const messageData = JSON.parse(fs.readFileSync(fsMessagePath, "utf8"));
const { type, textMessage } = messageData;

(async () => {
  console.log(`🚀 캡처 전송 실행 시작 → interval=${interval}, type=${type}`);

  // ✅ 메시지 우선 전송
  if (choiEnabled) {
    await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      chat_id: TELEGRAM_CHAT_ID,
      text: textMessage,
      parse_mode: "HTML"
    });
    console.log("✅ 최실장 메시지 전송 완료");
  }
  if (mingEnabled) {
    await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN_A}/sendMessage`, {
      chat_id: TELEGRAM_CHAT_ID_A,
      text: textMessage,
      parse_mode: "HTML"
    });
    console.log("✅ 밍밍 메시지 전송 완료");
  }

  // ✅ 청산 신호 아닐 경우 스크린샷 생략
  if (!CAPTURE_TYPES.includes(type)) {
    console.log("📵 청산 신호 아님 → 스크린샷 생략 완료");
    return;
  }

  const browser = await puppeteer.connect({
    browserWSEndpoint: `wss://chrome.browserless.io?token=${BROWSERLESS_TOKEN}`
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });

  try {
    // ✅ 로그인 (신버전 흐름)
    await page.goto("https://www.tradingview.com/accounts/signin/?lang=en");
    await page.waitForSelector("button[data-name='email']", { timeout: 10000 });
    await page.click("button[data-name='email']");

    await page.waitForSelector("input[name='username']", { timeout: 15000 });
    await page.type("input[name='username']", TV_EMAIL, { delay: 50 });

    await page.waitForSelector("input[name='password']", { timeout: 15000 });
    await page.type("input[name='password']", TV_PASSWORD, { delay: 50 });

    await Promise.all([
      page.click("button[type='submit']"),
      page.waitForNavigation({ waitUntil: "networkidle0" })
    ]);

    console.log("✅ 트레이딩뷰 로그인 성공");

    // ✅ 차트 열기 및 캡처
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
