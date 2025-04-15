// ✅ /trader/gateExecutor.js

const { authenticatedRequest } = require('./gateApi');
const config = require('./gateConfig');

// ✅ 롱 포지션 진입 (BUY)
async function placeLongOrder({
  pair = config.DEFAULT_PAIR,
  price = '60000',
  amount = config.DEFAULT_AMOUNT
} = {}) {
  const order = {
    currency_pair: pair,
    side: 'buy',
    type: 'limit',
    price: price.toString(),
    amount: amount.toString()
  };

  try {
    const res = await authenticatedRequest('POST', '/spot/orders', '', order);
    console.log('✅ 롱 주문 성공:', res);
    return res;
  } catch (err) {
    console.error('❌ 롱 주문 실패:', err.response?.data || err.message);
    return null;
  }
}

// ✅ 숏 포지션 진입 (SELL)
async function placeShortOrder({
  pair = config.DEFAULT_PAIR,
  price = '60000',
  amount = config.DEFAULT_AMOUNT
} = {}) {
  const order = {
    currency_pair: pair,
    side: 'sell',
    type: 'limit',
    price: price.toString(),
    amount: amount.toString()
  };

  try {
    const res = await authenticatedRequest('POST', '/spot/orders', '', order);
    console.log('✅ 숏 주문 성공:', res);
    return res;
  } catch (err) {
    console.error('❌ 숏 주문 실패:', err.response?.data || err.message);
    return null;
  }
}

// ✅ 테스트 실행 (나중에 설명해줄게)
if (require.main === module) {
  placeShortOrder();
}

module.exports = {
  placeLongOrder,
  placeShortOrder
};
