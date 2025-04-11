// ✅👇 captureAndSend.js

// ✅ 최종 개선된 captureAndSend.js (timeout 문제 개선 버전)
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
  await page.setViewport({ width: 1280, height: 720 });

  try {
    // ✅ 빠른 로딩 옵션으로 변경
    await page.goto("https://kr.tradingview.com/accounts/signin/", {
      waitUntil: "domcontentloaded",
      timeout: 60000 // 60초로 여유 있게 설정
    });

    await page.waitForSelector('button[class*="emailButton"]', { visible: true });
    await page.click('button[class*="emailButton"]');

    await page.waitForSelector("#id_username", { visible: true });
    await page.type("#id_username", TV_EMAIL, { delay: 50 });

    await page.waitForSelector("#id_password", { visible: true });
    await page.type("#id_password", TV_PASSWORD, { delay: 50 });

    // 로그인 버튼 클릭 및 로그인 확인
    await Promise.all([
      page.click("button[class*='submitButton']"),
      page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60000 })
    ]);

    // 프로필 아이콘으로 로그인 확정 체크
    await page.waitForSelector("button[aria-label='사용자 메뉴 열기']", { visible: true, timeout: 60000 });
    console.log("✅ 로그인 성공 확인됨");

    // 차트 페이지로 이동 및 빠른 로딩 체크
    await page.goto(chartUrl, { waitUntil: "domcontentloaded", timeout: 60000 });

    // 차트 요소 명확하게 체크
    await page.waitForSelector(".chart-markup-table, canvas", { visible: true, timeout: 60000 });
    console.log("✅ 차트 로딩 완료됨");

    // 광고 제거
    const popupCloseBtn = await page.$("div[role='dialog'] button[aria-label='Close']");
    if (popupCloseBtn) {
      await popupCloseBtn.click();
      console.log("🧹 광고 팝업 닫힘");
    }

    const bottomBanner = await page.$("div[class*='layout__area--bottom']");
    if (bottomBanner) {
      await page.evaluate(el => el.remove(), bottomBanner);
      console.log("🧼 하단 배너 제거 완료");
    }

    // 이미지 캡처
    const buffer = await page.screenshot({ type: "png" });

    // 텔레그램 전송
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
      console.log("⛔ 밍밍 봇 비활성화 – 스킵됨");
    }

  } catch (err) {
    console.error("❌ 실행 오류:", err.message);
  } finally {
    await browser.close();
  }
})();
