// ✅ index.js

// ✅ 환경설정 로드 (.env)
require('dotenv').config();
const path = require('path');

// ✅ 모듈 불러오기
const { sendTelegramAlert } = require('./modules/alertSender');
const { fetchMarketData } = require('./modules/fetcher');
const { getStrategyResult } = require('./strategies/basicStrategy');

// 실행 주기 (ms)
const INTERVAL = process.env.FETCH_INTERVAL
  ? parseInt(process.env.FETCH_INTERVAL, 10)
  : 10000;

async function runBot() {
  try {
    console.log(`[START] Bot started at ${new Date().toISOString()}`);

    const marketData = await fetchMarketData();
    if (!marketData) {
      console.warn('[WARN] No market data received.');
      return;
    }

    const result = getStrategyResult(marketData);
    if (!result || !result.shouldAlert) {
      console.log('[INFO] No alert needed.');
      return;
    }

    await sendTelegramAlert(result.message);
    console.log('[SUCCESS] Alert sent via Telegram');
  } catch (error) {
    console.error('[ERROR] Unexpected issue in runBot:', error);
  }
}

// 일정 주기로 실행
setInterval(runBot, INTERVAL);
