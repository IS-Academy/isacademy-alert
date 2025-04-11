// ✅👇 captureAndSend.js

// ✅👇 최적화된 captureAndSend.js (명확한 선택자 & 세션 유지 추가)
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
    // ✅ 한국어로 접속하여 지역적 충돌을 최소화
    await page.goto("https://kr.tradingview.com/accounts/signin/", { waitUntil: "networkidle2" });

    // 이메일 로그인 버튼 선택 및 클릭
    await page.waitForSelector('button[class*="emailButton"]', { visible: true });
    await page.click('button[class*="emailButton"]');

    // 이메일 입력
    await page.waitForSelector("#id_username", { visible: true });
    await page.type("#id_username", TV_EMAIL, { delay: 50 });

    // 비밀번호 입력
    await page.waitForSelector("#id_password", { visible: true });
    await page.type("#id_password", TV_PASSWORD, { delay: 50 });

    // 로그인 버튼 클릭 및 내비게이션 기다림
    await Promise.all([
      page.click("button[class*='submitButton']"),
      page.waitForNavigation({ waitUntil: "networkidle2" })
    ]);

    // ✅ 프로필 아이콘이 나타날 때까지 기다려 로그인 확인
    await page.waitForSelector("button[aria-label='사용자 메뉴 열기']", { visible: true, timeout: 10000 });
    console.log("✅ 로그인 성공 및 프로필 아이콘 확인됨");

    // 차트 페이지 이동
    await page.goto(chartUrl, { waitUntil: "networkidle2" });

    // ✅ 차트 주요 엘리먼트 확인
    await page.waitForSelector(".chart-markup-table, canvas", { visible: true, timeout: 15000 });
    console.log("✅ 차트 로딩 완료됨");

    // 광고 팝업 있으면 제거 (최적화된 빠른 체크)
    const popupCloseBtn = await page.$("div[role='dialog'] button[aria-label='Close']");
    if (popupCloseBtn) {
      await popupCloseBtn.click();
      console.log("🧹 광고 팝업 닫기 성공");
    }

    const bottomBanner = await page.$("div[class*='layout__area--bottom']");
    if (bottomBanner) {
      await page.evaluate(el => el.remove(), bottomBanner);
      console.log("🧼 하단 배너 제거 완료");
    }

    // 스크린샷 캡처
    const buffer = await page.screenshot({ type: "png" });

    // 텔레그램 이미지 전송
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


