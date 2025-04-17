//✅👇 messageHandler.js ==> 📂 entry 정보 조회, 메시지 생성 로직

//✅👇 messageHandler.js ==> 📂 entry 정보 조회, 메시지 생성 로직 (최종)

// 모듈 로드 (필요한 함수들을 명확히 불러옴)
const { getEntryInfo } = require('../entryManager');
const { generateTelegramMessage } = require('./messageTemplateManager');
const config = require('../../config');

/**
 * 💡 calculatePnL 함수 (현재가 대비 수익률 계산)
 * 
 * @param {number} price - 현재 가격
 * @param {number|string} entryAvg - 평균 진입가 (없으면 'N/A')
 * @param {number|string} entryCount - 진입 비중 (없으면 0)
 * @param {number} leverage - 레버리지 값 (배율)
 * @param {string} direction - 포지션 방향 ('long' 또는 'short')
 * @returns {object} - 수익률 및 기타 결과 데이터
 */
function calculatePnL(price, entryAvg, entryCount, leverage, direction) {
  if (entryAvg === 'N/A' || entryCount === 0) {
    return { pnl: 0, pnlPercent: 'N/A' };
  }

  const entryPrice = parseFloat(entryAvg);
  const positionRatio = parseFloat(entryCount) / 100; // 진입 비율 계산 (백분율을 소수점으로)
  let pnl = 0;

  // 포지션 방향에 따라 수익률 계산
  if (direction === 'long') {
    pnl = ((price - entryPrice) / entryPrice) * leverage * positionRatio * 100;
  } else if (direction === 'short') {
    pnl = ((entryPrice - price) / entryPrice) * leverage * positionRatio * 100;
  }

  return {
    pnl: pnl.toFixed(2), // 소수점 두자리까지 표시
    pnlPercent: `${pnl.toFixed(2)}%`
  };
}

/**
 * 📌 메인 핸들링 함수
 * @param {Object} params - 처리할 데이터 (웹훅에서 수신)
 * @param {string} params.symbol - 종목명
 * @param {string} params.type - 신호 타입
 * @param {string} params.timeframe - 타임프레임
 * @param {number} params.price - 현재 가격
 * @param {number} params.ts - 타임스탬프
 * @param {number} params.leverage - 레버리지
 * @returns {Object} - 최실장 및 밍밍 메시지
 */
async function handleMessage({ symbol, type, timeframe, price, ts, leverage }) {
  // 📈 현재 신호 기준의 entry 정보 조회
  const { entryAvg: avg, entryCount: ratio } = getEntryInfo(symbol, type, timeframe);

  // 🔎 포지션 방향 결정 (type 기준)
  const direction = type.endsWith('Short') ? 'short' : 'long';

  // 🚀 수익률 계산
  const result = calculatePnL(price, avg, ratio, leverage, direction);

  // ✉️ 텔레그램 메시지 생성 (템플릿 매니저 활용)
  const { msgChoi, msgMing } = generateTelegramMessage({ symbol, type, timeframe, price, ts, leverage, entryAvg: avg, entryCount: ratio, direction, result });

  // 📤 최종 메시지 반환
  return { msgChoi, msgMing };
}

// 모듈 외부 공개 함수
module.exports = { handleMessage };

