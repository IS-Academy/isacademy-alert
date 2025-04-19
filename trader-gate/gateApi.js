//✅👇 /trader-gate/gateApi.js

const axios = require('axios');
const crypto = require('crypto');
const config = require('./gateConfig');

function getSignature(method, path, query, body = '') {
  const ts = Math.floor(Date.now() / 1000);
  const preHash = `${ts}\n${method}\n${path}\n${query}\n${body}`;
  const sign = crypto.createHmac('sha512', config.GATE_API_SECRET)
    .update(preHash)
    .digest('hex');

  return { sign, ts };
}

async function authenticatedRequest(method, path, query = '', bodyObj = null) {
  const url = `${config.BASE_URL}${path}?${query}`;
  const bodyStr = bodyObj ? JSON.stringify(bodyObj) : '';

  const { sign, ts } = getSignature(method, path, query, bodyStr);

  try {
    const res = await axios({
      method,
      url,
      headers: {
        KEY: config.GATE_API_KEY,
        Timestamp: ts,
        SIGN: sign,
        'Content-Type': 'application/json'
      },
      data: bodyStr
    });

    return res.data;
  } catch (err) {
    console.error('❌ API 요청 실패:', err.response?.data || err.message);
    throw err;
  }
}

module.exports = {
  authenticatedRequest
};
