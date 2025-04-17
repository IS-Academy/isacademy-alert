//✅👇 index.js (최종 수정본)

require('dotenv').config();
const express = require('express');

// 🔹 공통 파일 (프로젝트 최상단에 위치한 파일들)

const webhookHandler = require('./webhookHandler'); // 트레이딩뷰 신호 전달받는 웹훅 처리

// 🔹 telegram 폴더 내 파일에서 불러오는 모듈
const { loadBotState } = require('./telegram/utils'); // 봇 상태 로딩
const dummyHandler = require('./telegram/handlers/dummyHandler'); // 더미 신호 처리
const captureApi = require('./telegram/routes/captureApi'); // 차트 이미지 캡처 API
const { initAdminPanel } = require('./telegram/commands/status'); // 관리자 패널 초기화

// 📦 Express 앱 초기화
const app = express();
const PORT = process.env.PORT || 3000;

// 🌍 글로벌 봇 상태 변수 로딩 (최실장/밍밍봇 활성화 여부)
const { choiEnabled, mingEnabled } = loadBotState();
global.choiEnabled = choiEnabled;
global.mingEnabled = mingEnabled;

// 📦 Middleware 등록 (JSON 파싱 필수)
app.use(express.json()); // 🚨 JSON 요청 본문을 파싱하기 위한 필수 미들웨어

// ✅ 라우트 등록 (각 기능별 URL과 핸들러 연결)
app.use('/dummy', dummyHandler); // 더미 신호 처리용 라우트
app.post('/webhook', webhookHandler); // 트레이딩뷰 신호 처리용 웹훅 라우트
app.use('/capture', captureApi); // 차트 이미지 캡처용 라우트

// ✅ 기본 루트 (서버 작동 상태 점검용)
app.get('/', (req, res) => res.send('✅ IS Academy Webhook 서버 작동 중입니다.'));

// 🚀 서버 실행 및 관리자 패널 초기화
app.listen(PORT, async () => {
  console.log(`🚀 서버 실행 완료: http://localhost:${PORT}`);
  await initAdminPanel(); // 관리자 패널 초기화
});

// ✅ 서버 실행 로그
console.log("✅ index.js 실행 시작");
