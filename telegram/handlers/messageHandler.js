// ✅ messageHandler.js 신규 생성 (진입정보, 수익률 처리 후 메시지 생성)

// 모듈 로드
const { getEntryInfo } = require('../entryManager');
const { generateTelegramMessage, calculatePnL } = require('./messageTemplateManager');
const config = require('../config');

// 메인 함수 (데이터를 조회해서 메시지 생성까지 담당)
async function handleMessage({ symbol, type, timeframe, price, ts, leverage }) {
  const { entryAvg: avg, entryCount: ratio } = getEntryInfo(symbol, type, timeframe);
  const direction = type.endsWith('Short') ? 'short' : 'long';

  const result = calculatePnL(price, avg, ratio, leverage, direction);

  // 📌 메시지 데이터 구성 및 템플릿 매니저 호출
  const { msgChoi, msgMing } = generateTelegramMessage({ 
    symbol, type, timeframe, price, ts, leverage,
    entryAvg: avg,
    entryCount: ratio,
    direction,
    result
  });

  return { msgChoi, msgMing };
}

module.exports = { handleMessage };
