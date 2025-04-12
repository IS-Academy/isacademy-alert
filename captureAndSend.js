// ✅👇 captureAndSend.js

require("dotenv").config();
const puppeteer = require("puppeteer-core");
const axios = require("axios");
const FormData = require("form-data");

const {
  BROWSERLESS_TOKEN,
  TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID,
  TELEGRAM_BOT_TOKEN_A, TELEGRAM_CHAT_ID_A,
  TV_COOKIES, MINGMING_ENABLED
} = process.env;

const args = process.argv.reduce((acc, curr) => {
  const [key, value] = curr.split('=');
  acc[key.replace('--', '')] = value;
  return acc;
}, {});

const interval = args.interval || "1";
const type = args.type || "unknown";
const chartUrl = process.env[`TV_CHART_URL_${interval}`];

if (!chartUrl || !["exitLong", "exitShort"].includes(type)) {
  console.log("📵 이미지 캡처 대상 아님 → 종료");
  process.exit(0);
}

const sendTelegram = async (token, chatId, buffer) => {
  const form = new FormData();
  form.append("chat_id", chatId);
  form.append("photo", buffer, {
    filename: `chart_${interval}min.png`,
    contentType: "image/png"
  });
  await axios.post(`https://api.telegram.org/bot${token}/sendPhoto`, form, {
    headers: form.getHeaders()
  });
};

(async () => {
  console.log(`📸 이미지 캡처 시작: interval=${interval}, type=${type}`);

  const browser = await puppeteer.connect({
    browserWSEndpoint: `wss://chrome.browserless.io?token=${BROWSERLESS_TOKEN}`
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  await page.setCookie(...JSON.parse(TV_COOKIES));

  try {
    await page.goto(chartUrl, { waitUntil: "networkidle2", timeout: 60000 });
    await page.waitForSelector("canvas", { visible: true, timeout: 30000 });
    console.log("✅ 차트 로딩 완료");

    // 🔥 빠르고 효과적인 광고 제거
    await page.evaluate(() => {
      const removeAds = () => {
        document.querySelectorAll(
          'div[role="dialog"], div[data-dialog-name], ' +
          'div.toastListScroll-Hvz5Irky, div.toastGroup-JUpQSP8o, ' +
          'div[data-role="toast-container"], div[data-name="base-toast"], ' +
          'div[class*="layout__area--bottom"]'
        ).forEach(el => el.remove());
      };
      removeAds();

      // 닫기 버튼 클릭 시도
      const closeBtn = document.querySelector('button[aria-label="Close"], button[class*="close"]');
      if (closeBtn) closeBtn.click();
    });
    console.log("🧹 광고 제거 시도 완료");

    // 짧은 추가 대기 후 광고 재확인 및 재제거 (확실한 처리)
    await page.waitForTimeout(500);
    await page.evaluate(() => {
      document.querySelectorAll(
        'div[role="dialog"], div[data-dialog-name]'
      ).forEach(el => el.remove());
    });

    const buffer = await page.screenshot({ type: "png" });
    console.log("📷 스크린샷 캡처 완료");

    await sendTelegram(TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, buffer);
    console.log("✅ 최실장 이미지 전송 완료");

    if (MINGMING_ENABLED === "true") {
      await sendTelegram(TELEGRAM_BOT_TOKEN_A, TELEGRAM_CHAT_ID_A, buffer);
      console.log("✅ 밍밍 이미지 전송 완료");
    }

  } catch (err) {
    console.error("❌ 실행 오류:", err.message);
  } finally {
    await browser.close();
  }
})();
