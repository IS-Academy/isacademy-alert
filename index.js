//✅👇 index.js (최종 수정본)

require('dotenv').config();
const express = require('express');
const dummyHandler = require('./dummyHandler');
const webhookHandler = require('./webhookHandler');
const captureApi = require('./routes/captureApi');
const { loadBotState } = require('./utils');
const { initAdminPanel } = require('./commands/status');
const { handleTradeSignal } = require('./trader-gate/tradeSignalHandler'); // ✅ 자동매매 모듈 불러오기

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ 봇 상태 불러오기 (글로벌 상태 저장용)
const { choiEnabled, mingEnabled } = loadBotState();
global.choiEnabled = choiEnabled;
global.mingEnabled = mingEnabled;

// ✅ JSON 요청 파싱
app.use(express.json()); // 🚨 이 부분을 express.json()으로 변경 (필수)

// ✅ 라우트 등록
app.use('/dummy', dummyHandler);
app.post('/webhook', webhookHandler);
app.use('/capture', captureApi);

// ✅ 기본 루트
app.get('/', (req, res) => res.send('✅ IS Academy Webhook 서버 작동 중입니다.'));

// ✅ 신규 라우트: 수동 시그널 트리거
app.post('/trigger-signal', async (req, res) => {
  try {
    const signal = req.body;
    console.log('📥 수신된 시그널:', signal);

    await handleTradeSignal(signal);
    res.send('✅ 자동매매 시그널 처리 완료!');
  } catch (error) {
    console.error('❌ 시그널 처리 중 오류:', error.message);
    res.status(500).send('❌ 처리 실패');
  }
});

// ✅ 서버 실행
app.listen(PORT, async () => {
  console.log(`🚀 서버 실행 완료: http://localhost:${PORT}`);
  await initAdminPanel();
});

console.log("✅ index.js 실행 시작");

// ✅ 서버 재시작용 라우트 (관리자용)
app.get('/restart', (req, res) => {
  const token = req.query.token;

  if (token !== process.env.RESTART_TOKEN) {
    console.warn('🚫 재시작 토큰 불일치 → 요청 거부됨');
    return res.status(403).send('❌ Unauthorized - Invalid token');
  }

  res.send('♻️ 서버가 곧 재시작됩니다...');
  console.log('🌀 /restart 호출됨 → 서버 종료 후 재시작 예정');
  setTimeout(() => process.exit(0), 500); // 0.5초 뒤 안전하게 종료
});
