// ✅ messageHandler.js 신규 생성 (진입정보, 수익률 처리 후 메시지 생성)

// 모듈 로드
const { getEntryInfo } = require('./entryManager');
const { calculatePnL, generateEntryInfo, generatePnLLine } = require('./handlers/messageTemplateManager');
const { generateTelegramMessage } = require('./handlers/messageTemplateManager');
const config = require('../config');

// 메인 함수 (데이터를 조회해서 메시지 생성까지 담당)
async function handleMessage({ symbol, type, timeframe, price, ts, leverage }) {
  const { entryAvg: avg, entryCount: ratio } = getEntryInfo(symbol, type, timeframe);
  const direction = type.endsWith('Short') ? 'short' : 'long';

  // 📌 메시지 데이터 구성
  const data = { 
    symbol: symbol.toUpperCase(), 
    timeframe, 
    price, 
    ts, 
    entryCount: ratio, 
    entryAvg: avg, 
    leverage, 
    direction,
    result: calculatePnL(price, avg, ratio, leverage, direction)
  };

  // 📌 템플릿 매니저로 메시지 생성 요청
  const { msgChoi, msgMing } = generateTelegramMessage(data);

  return { msgChoi, msgMing };
}

module.exports = { handleMessage };
