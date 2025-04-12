// ✅👇 captureAndSend.js

require("dotenv").config();
const puppeteer = require("puppeteer-core");
const axios = require("axios");
const FormData = require("form-data");
const { loadBotState } = require('./utils');

// 기존 파일에서 글로벌 상태를 로드하기 위한 설정 추가
const {
  BROWSERLESS_TOKEN,
  TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID,
  TELEGRAM_BOT_TOKEN_A, TELEGRAM_CHAT_ID_A,
  TV_COOKIES
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

  const maxRetries = 2;
  let loaded = false;

  try {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      console.log(`🔄 로딩 시도 (${attempt + 1}/${maxRetries + 1})`);
      await page.goto(chartUrl, { waitUntil: "domcontentloaded", timeout: 15000 });

      try {
        await page.waitForSelector("canvas", { visible: true, timeout: 5000 });
        console.log("✅ 차트 로딩 성공");
        loaded = true;
        break;
      } catch {
        if (attempt < maxRetries) {
          console.log("⚠️ 로딩 실패 → 새로고침 시도");
          await page.reload({ waitUntil: "domcontentloaded", timeout: 10000 });
        } else {
          throw new Error("❌ 최대 로딩 재시도 초과");
        }
      }
    }

    if (!loaded) throw new Error("❌ 최종 로딩 실패");

    await page.evaluate(() => {
      document.querySelectorAll(
        'div[role="dialog"], div[data-dialog-name], div.toastListScroll-Hvz5Irky, ' +
        'div.toastGroup-JUpQSP8o, div[data-role="toast-container"], ' +
        'div[data-name="base-toast"], div[class*="layout__area--bottom"]'
      ).forEach(el => el.remove());

      const closeBtn = document.querySelector('button[aria-label="Close"], button[class*="close"]');
      if (closeBtn) closeBtn.click();
    });
    console.log("🧹 광고 제거 완료");

    const buffer = await page.screenshot({ type: "png" });
    console.log("📷 스크린샷 캡처 완료");

    // ✅ 추가된 부분: 파일에서 최실장, 밍밍 상태 불러오기
    const { choiEnabled, mingEnabled } = loadBotState();

    // 🔥 상태를 확인하여 이미지 전송 여부 결정
    if (choiEnabled !== false) { // undefined일 경우 기본값 true로 간주
      await sendTelegram(TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, buffer);
      console.log("✅ 최실장 이미지 전송 완료");
    } else {
      console.log("⛔ 최실장 비활성화 상태 (전송 스킵)");
    }

    if (mingEnabled !== false) {
      await sendTelegram(TELEGRAM_BOT_TOKEN_A, TELEGRAM_CHAT_ID_A, buffer);
      console.log("✅ 밍밍 이미지 전송 완료");
    } else {
      console.log("⛔ 밍밍 비활성화 상태 (전송 스킵)");
    }

  } catch (err) {
    console.error("❌ 실행 오류:", err.message);
  } finally {
    await browser.close();
  }
})();
