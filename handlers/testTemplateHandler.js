const webhookHandler = require('../webhookHandler');
const config = require('../config');

module.exports = async function testTemplate(type) {
  const testWebhookData = {
    type,
    symbol: 'BTCUSDT.P',
    timeframe: '1',
    price: 62500,
    ts: Math.floor(Date.now() / 1000),
    leverage: config.DEFAULT_LEVERAGE,
    entryAvg: 62000,
    entryRatio: 5,
    isTest: true,
  };

  await webhookHandler(
    { body: testWebhookData },
    { status: () => ({ send: () => {} }), sendStatus: () => {} }
  );
};
