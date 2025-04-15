// ✅ /trader/gateExecutor.js

const axios = require('axios');
const config = require('../config'); // 혹은 별도 gateConfig.js로 분리 가능

// ✅ 예: API 키, 시크릿 설정 (보안상 로컬 .env 또는 gitignore 권장)
const GATE_API_KEY = process.env.GATE_API_KEY || config.GATE_API_KEY;
const GATE_API_SECRET = process.env.GATE_API_SECRET || config.GATE_API_SECRET;

// ✅ 진입 신호 예시
async function placeLongOrder(symbol = 'BTC_USDT', amount = 0.001, price = null) {
  try {
    const orderData = {
      currency_pair: symbol,
      type: 'limit',         // 또는 'market'
      side: 'buy',           // 롱 = buy, 숏 = sell
      amount: amount.toString(),
    };
    if (price) orderData.price = price.toString();

    const response = await axios.post('https://api.gate.io/api/v4/spot/orders', orderData, {
      headers: {
        'KEY': GATE_API_KEY,
        'SIGN': '...', // ✋ 여기는 추후 HMAC-SHA512 서명 로직 필요
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ 주문 성공:', response.data);
    return response.data;
  } catch (err) {
    console.error('❌ 주문 실패:', err.response?.data || err.message);
    throw err;
  }
}

// 테스트용 실행
if (require.main === module) {
  placeLongOrder('BTC_USDT', 0.001);
}
