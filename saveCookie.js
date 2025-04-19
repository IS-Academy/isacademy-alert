//✅👇 saveCookie.js / 최초 1회 수동 로그인 쿠키 저장 코드 
require("dotenv").config();
const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto('https://kr.tradingview.com/accounts/signin/', { waitUntil: 'networkidle2' });

  console.log("🖐️ 브라우저에서 로그인(로봇체크까지) 완료 후 여기 터미널에서 엔터키를 눌러주세요...");
  process.stdin.resume();
  process.stdin.on('data', async () => {
    const cookies = await page.cookies();
    fs.writeFileSync('cookies.json', JSON.stringify(cookies));
    console.log("✅ 쿠키 저장 완료!");
    await browser.close();
    process.exit();
  });
})();
