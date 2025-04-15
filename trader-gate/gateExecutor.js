// ✅ /trader/gateExecutor.js

const { authenticatedRequest } = require('./gateApi');
const config = require('./gateConfig');

// ✅ Gate.io 매수 주문 함수 (롱 진입용)
async function placeLongOrder({
  pair = config.DEFAULT_PAIR,
  price = '60000',
  amount = config.DEFAULT_AMOUNT
} = {}) {
  const order = {
    currency_pair: pair,
    side: 'buy',
    type: 'limit', // 또는 'market'
    price: price.toString(),
    amount: amount.toString()
  };

  try {
    const res = await authenticatedRequest('POST', '/spot/orders', '', order);
    console.log('✅ 주문 성공:', res);
    return res;
  } catch (err) {
    console.error('❌ 주문 실패:', err.response?.data || err.message);
    return null;
  }
}

// ✅ CLI에서 단독 실행 가능하도록
if (require.main === module) {
  placeLongOrder();
}

module.exports = {
  placeLongOrder
};
