// ✅ 최종 완벽 해결 코드 (AJAX 로그인 정확 처리)
require("dotenv").config();
const puppeteer = require("puppeteer-core");
const axios = require("axios");
const FormData = require("form-data");

const {
  BROWSERLESS_TOKEN, TV_EMAIL, TV_PASSWORD,
  TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID,
  TELEGRAM_BOT_TOKEN_A, TELEGRAM_CHAT_ID_A
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

  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.6261.69 Safari/537.36"
  );

  await page.evaluateOnNewDocument(() => {
    delete navigator.__proto__.webdriver;
  });

  try {
    // ✅ 로그인 페이지로 이동
    await page.goto("https://kr.tradingview.com/accounts/signin/", { waitUntil: "networkidle2" });

    // ✅ 이메일 버튼 클릭
    await page.waitForXPath("//span[contains(text(),'이메일')]", { visible: true });
    const [emailButton] = await page.$x("//span[contains(text(),'이메일')]");
    await emailButton.click();

    // ✅ 아이디 입력
    await page.waitForSelector("#id_username", { visible: true });
    await page.type("#id_username", TV_EMAIL, { delay: 30 });

    // ✅ 비밀번호 입력
    await page.waitForSelector("#id_password", { visible: true });
    await page.type("#id_password", TV_PASSWORD, { delay: 30 });

    // ✅ 로그인 버튼 클릭 (AJAX 처리이므로 waitForNavigation 삭제)
    await page.waitForXPath("//button[contains(., '로그인')]", { visible: true });
    const [loginButton] = await page.$x("//button[contains(., '로그인')]");
    await loginButton.click();

    // ✅ AJAX 로그인 처리 명확히 체크 (프로필 아이콘 기준으로 로그인 확인)
    await page.waitForSelector("button[aria-label='사용자 메뉴 열기']", { visible: true, timeout: 60000 });
    console.log("✅ AJAX 로그인 완료 확실히 확인됨");

    // ✅ 로그인 완료 후 차트 페이지 이동
    await page.goto(chartUrl, { waitUntil: "networkidle2", timeout: 60000 });
    await page.waitForSelector("canvas", { visible: true, timeout: 60000 });
    console.log("✅ 차트 로딩 완료됨");

    // ✅ 광고 제거
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

    // ✅ 차트 캡처
    const buffer = await page.screenshot({ type: "png" });

    // ✅ 텔레그램 전송 함수
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
