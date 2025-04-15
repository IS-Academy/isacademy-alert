// ✅ /trader-gate/gateExecutor.js

const { authenticatedRequest } = require('./gateApi');
const config = require('./gateConfig');

// ✅ 롱 포지션 진입 (BUY)
async function placeLongOrder({
  pair = config.DEFAULT_PAIR,
  price = '60000',
  amount = config.DEFAULT_AMOUNT,
  orderType = 'limit'
} = {}) {
  const order = {
    currency_pair: pair,
    side: 'buy',
    type: orderType,
    amount: amount.toString()
  };
  if (orderType === 'limit') order.price = price.toString();

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
  amount = config.DEFAULT_AMOUNT,
  orderType = 'limit'
} = {}) {
  const order = {
    currency_pair: pair,
    side: 'sell',
    type: orderType,
    amount: amount.toString()
  };
  if (orderType === 'limit') order.price = price.toString();

  try {
    const res = await authenticatedRequest('POST', '/spot/orders', '', order);
    console.log('✅ 숏 주문 성공:', res);
    return res;
  } catch (err) {
    console.error('❌ 숏 주문 실패:', err.response?.data || err.message);
    return null;
  }
}

// ✅ CLI 테스트용 (선택 실행)
if (require.main === module) {
  placeLongOrder({ orderType: 'market' });
}

module.exports = {
  placeLongOrder,
  placeShortOrder
};
