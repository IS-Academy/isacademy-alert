// ✅ 쿠키 환경변수에서 로드하는 완벽한 방식 (captureAndSend.js 최종버전)
require("dotenv").config();
const puppeteer = require("puppeteer-core");
const axios = require("axios");
const FormData = require("form-data");

const {
  BROWSERLESS_TOKEN,
  TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID,
  TELEGRAM_BOT_TOKEN_A, TELEGRAM_CHAT_ID_A,
  TV_COOKIES
} = process.env;

const interval = process.argv.find(a => a.startsWith("--interval="))?.split("=")[1] || "1";
const type = process.argv.find(a => a.startsWith("--type="))?.split("=")[1] || "unknown";
const chartUrl = process.env[`TV_CHART_URL_${interval}`];

if (!chartUrl) {
  console.error(`❌ TV_CHART_URL_${interval} 환경변수가 없습니다.`);
  process.exit(1);
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

  // ✅ 환경변수에서 쿠키 불러오기
  const cookies = JSON.parse(TV_COOKIES);
  await page.setCookie(...cookies);

  try {
    await page.goto(chartUrl, { waitUntil: "networkidle2", timeout: 60000 });
    await page.waitForSelector("canvas", { visible: true, timeout: 60000 });
    console.log("✅ 차트 로딩 완료됨");

    const popup = await page.$("div[role='dialog'] button[aria-label='Close']");
    if (popup) {
      await popup.click();
      console.log("🧹 광고 팝업 닫힘");
    }

    const bottomBanner = await page.$("div[class*='layout__area--bottom']");
    if (bottomBanner) {
      await page.evaluate(el => el.remove(), bottomBanner);
      console.log("🧼 하단 배너 제거 완료");
    }

    const buffer = await page.screenshot({ type: "png" });

    const sendTelegram = async (token, chatId, imageBuffer) => {
      const form = new FormData();
      form.append("chat_id", chatId);
      form.append("photo", imageBuffer, {
        filename: `chart_${interval}min.png`,
        contentType: "image/png"
      });
      await axios.post(`https://api.telegram.org/bot${token}/sendPhoto`, form, {
        headers: form.getHeaders()
      });
    };

    await sendTelegram(TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, buffer);
    console.log("✅ 최실장 이미지 전송 완료");

    if (process.env.MINGMING_ENABLED === "true") {
      await sendTelegram(TELEGRAM_BOT_TOKEN_A, TELEGRAM_CHAT_ID_A, buffer);
      console.log("✅ 밍밍 이미지 전송 완료");
    }

  } catch (err) {
    console.error("❌ 실행 오류:", err.message);
  } finally {
    await browser.close();
  }
})();
