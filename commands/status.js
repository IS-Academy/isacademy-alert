// ✅👇 status.js

const { sendToAdmin } = require('../botManager');
const { setAdminMessageId } = require('../utils');

(async () => {
  const statusMsg = "📡 <b>IS 관리자봇 패널</b>\n서버 재시작 완료. 상태 초기화.";
  const sent = await sendToAdmin(statusMsg);
  if (sent?.data?.result) setAdminMessageId(sent.data.result.message_id);
})();
