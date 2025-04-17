//✅👇 entryManager.js

// 📦 내부 상태 저장 (롱/숏 → 심볼 → 타임프레임 → [가격배열])
const entries = { long: {}, short: {} };

// 🎯 시그널 분류용 타입 정의
const LONG_TYPES = ['showSup', 'isBigSup'];
const SHORT_TYPES = ['showRes', 'isBigRes'];
const EXIT_LONG = 'exitLong';
const EXIT_SHORT = 'exitShort';

// 👉 방향 결정 함수 (롱 / 숏 / 나머지 null)
function getDirection(type) {
  if (LONG_TYPES.includes(type) || type === EXIT_LONG) return 'long';
  if (SHORT_TYPES.includes(type) || type === EXIT_SHORT) return 'short';
  return null;
}

// ✅ 진입가 저장 함수
function addEntry(symbol, type, price, timeframe = 'default') {
  const direction = getDirection(type);
  if (!direction) return;

  // ⛑️ 구조 초기화
  entries[direction][symbol] = entries[direction][symbol] || {};
  entries[direction][symbol][timeframe] = entries[direction][symbol][timeframe] || [];

  // ✅ 가격 추가
  entries[direction][symbol][timeframe].push(parseFloat(price));
}

// ✅ 진입정보 초기화 함수 (exit 발생 시 호출)
function clearEntries(symbol, type, timeframe = 'default') {
  const direction = getDirection(type);
  if (!direction) return;

  if (entries[direction][symbol]) entries[direction][symbol][timeframe] = [];
}

// ✅ 평균단가 및 진입횟수 조회 함수
function getEntryInfo(symbol, type, timeframe = 'default') {
  const direction = getDirection(type);
  if (!direction) return { entryCount: 0, entryAvg: 'N/A' };

  const list = entries[direction][symbol]?.[timeframe] || [];
  
  if (list.length === 0) {
    return { entryCount: 0, entryAvg: 'N/A' };
  }

  const sum = list.reduce((a, b) => a + b, 0);
  const avg = sum / list.length;

  return {
    entryCount: list.length,
    entryAvg: avg.toFixed(2),
    direction
  };
}

module.exports = {
  addEntry,
  clearEntries,
  getEntryInfo
};
