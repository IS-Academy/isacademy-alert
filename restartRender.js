//✅👇 restartRender.js

require('dotenv').config();
const axios = require('axios');

const SERVER_URL = process.env.SERVER_URL;
const RESTART_TOKEN = process.env.RESTART_TOKEN;

async function triggerRestart() {
  try {
    const res = await axios.get(`${SERVER_URL}/restart?token=${RESTART_TOKEN}`);
    console.log('♻️ 서버 재시작 요청 완료:', res.data);
  } catch (err) {
    console.error('❌ 재시작 요청 실패:', err.message);
  }
}

triggerRestart();
