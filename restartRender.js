// ✅ restartRender.js (Render 서버 강제 재시작 트리거)

require('dotenv').config();
const axios = require('axios');

const RENDER_API_KEY = process.env.RENDER_API_KEY;
const SERVICE_ID = process.env.RENDER_SERVICE_ID;

async function restartRenderService() {
  try {
    const res = await axios.patch(
      `https://api.render.com/v1/services/${SERVICE_ID}/environment-variables`,
      [
        {
          key: 'DUMMY',
          value: `${Date.now()}`,
        },
      ],
      {
        headers: {
          Authorization: `Bearer ${RENDER_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('♻️ Render 서비스 재시작 트리거 성공!');
  } catch (err) {
    console.error('❌ Render 재시작 실패:', err.response?.data || err.message);
  }
}

restartRenderService();
console.log("🔐 API:", process.env.RENDER_API_KEY);
console.log("🆔 SVC:", process.env.RENDER_SERVICE_ID);
