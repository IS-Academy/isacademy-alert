// ✅ 최종 정확한 2단계 로그인 처리 코드 (새로 작성)
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
    // ✅ 로그인 페이지 접속
    await page.goto("https://kr.tradingview.com/accounts/signin/", {
      waitUntil: "networkidle2", timeout: 60000
    });

    // ✅ 1단계: 이메일 버튼 클릭 (정확한 텍스트 기준)
    await page.waitForXPath("//span[contains(text(),'이메일')]", { visible: true, timeout: 30000 });
    const [emailButton] = await page.$x("//span[contains(text(),'이메일')]");
    if (emailButton) await emailButton.click();
    else throw new Error("1단계 이메일 버튼 클릭 실패");

    // ✅ 2단계: 아이디 입력
    await page.waitForSelector("input#id_username", { visible: true, timeout: 30000 });
    await page.type("input#id_username", TV_EMAIL, { delay: 50 });

    // ✅ 2단계: 비밀번호 입력
    await page.waitForSelector("input#id_password", { visible: true, timeout: 30000 });
    await page.type("input#id_password", TV_PASSWORD, { delay: 50 });

    // ✅ 2단계: 최종 로그인 버튼 클릭 (텍스트로 정확히 클릭)
    await page.waitForXPath("//button[contains(., '로그인')]", { visible: true, timeout: 30000 });
    const [loginButton] = await page.$x("//button[contains(., '로그인')]");
    if (loginButton) {
      await Promise.all([
        loginButton.click(),
        page.waitForNavigation({ waitUntil: "networkidle2", timeout: 60000 })
      ]);
    } else throw new Error("2단계 로그인 버튼 클릭 실패");

    // ✅ 로그인 완료 확인 (프로필 아이콘)
    await page.waitForSelector("button[aria-label='사용자 메뉴 열기']", { visible: true, timeout: 60000 });
    console.log("✅ 로그인 성공 확인됨");

    // ✅ 차트 페이지 이동
    await page.goto(chartUrl, { waitUntil: "networkidle2", timeout: 60000 });

    // ✅ 차트 로딩 확인
    await page.waitForSelector("canvas", { visible: true, timeout: 60000 });
    console.log("✅ 차트 로딩 완료됨");

    // ✅ 광고 있으면 제거
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

    // ✅ 차트 스크린샷 캡처
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

    // ✅ 최실장 봇 전송
    await sendTelegram(TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, buffer);
    console.log("✅ 최실장 이미지 전송 완료");

    // ✅ 밍밍 봇 전송
    if (process.env.MINGMING_ENABLED === "true") {
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
