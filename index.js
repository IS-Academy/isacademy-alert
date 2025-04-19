//✅👇 index.js = 환경 설정 및 주요 모듈 불러오기

require('dotenv').config();                         // 📦 .env 환경 변수 로드
const express = require('express');                 // 🌐 웹서버 프레임워크
const dummyHandler = require('./dummyHandler');     // 🧪 테스트용 더미 라우터
const webhookHandler = require('./webhookHandler'); // 📩 트레이딩뷰 웹훅 시그널 처리
const captureApi = require('./routes/captureApi');  // 📸 스크린샷 캡처 요청 라우터
const { loadBotState } = require('./utils');        // ⚙️ 저장된 봇 상태 불러오기
const { initAdminPanel } = require('./commands/status'); // 🛠️ 관리자 패널 초기화
const { handleTradeSignal } = require('./trader-gate/tradeSignalHandler'); // 🚀 자동매매 시그널 처리 함수

// ✅👇 Express 앱 및 포트 설정
const app = express();                              // 🚀 Express 앱 생성
const PORT = process.env.PORT || 3000;              // 📡 기본 포트 설정 (.env에서 지정 가능)

// ✅👇 글로벌 상태 세팅 (봇 ON/OFF 상태 로드 및 전역 등록)
Object.assign(global, loadBotState());              // 🌍 모든 봇 상태를 전역(global)에 자동 등록

// ✅👇 요청 바디(JSON)를 파싱할 수 있도록 설정
app.use(express.json());                            // 📥 JSON 형식 요청 본문 파싱

// ✅👇 API 라우트 등록
app.use('/dummy', dummyHandler);                    // 🧪 /dummy 테스트용 라우터
app.post('/webhook', webhookHandler);               // 📩 /webhook: 시그널 수신 엔드포인트
app.use('/capture', captureApi);                    // 📸 /capture: 차트 스크린샷 캡처 API

// ✅👇 루트 엔드포인트
app.get('/', (req, res) =>                          // 🏠 /: 기본 서버 확인용 라우터
  res.send('✅ IS Academy Webhook 서버 작동 중입니다.')
);

// ✅👇 시그널 수동 트리거 (예: Postman으로 테스트 가능)
app.post('/trigger-signal', async (req, res) => {   // 🛎️ /trigger-signal: 수동 시그널 실행
  try {
    const signal = req.body;                        // 📨 요청으로부터 시그널 데이터 받기
    console.log('📥 수신된 시그널:', signal);

    await handleTradeSignal(signal);                // 🚀 자동매매 실행
    res.send('✅ 자동매매 시그널 처리 완료!');
  } catch (error) {
    console.error('❌ 시그널 처리 중 오류:', error.message);
    res.status(500).send('❌ 처리 실패');
  }
});

// ✅👇 서버 시작
app.listen(PORT, async () => {                      // 📡 서버 실행
  console.log(`🚀 서버 실행 완료: http://localhost:${PORT}`);
  await initAdminPanel();                           // 🛠️ 관리자 패널 초기화 실행
});

console.log("✅ index.js 실행 시작");

// ✅👇 관리자 전용 재시작 라우트
app.get('/restart', (req, res) => {                 // ♻️ /restart: 서버 재시작 요청
  const token = req.query.token;                    // 🔒 토큰 확인

  if (token !== process.env.RESTART_TOKEN) {        // ❌ 잘못된 토큰 거부
    console.warn('🚫 재시작 토큰 불일치 → 요청 거부됨');
    return res.status(403).send('❌ Unauthorized - Invalid token');
  }

  res.send('♻️ 서버가 곧 재시작됩니다...');
  console.log('🌀 /restart 호출됨 → 서버 종료 후 재시작 예정');
  setTimeout(() => process.exit(0), 500);           // ⏱️ 0.5초 후 서버 종료
});
