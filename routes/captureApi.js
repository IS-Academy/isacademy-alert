// ✅👇 captureApi.js
const express = require("express");
const router = express.Router();
const { exec } = require("child_process");

// GET / 지원 (브라우저 요청용)
router.get("/", (req, res) => {
  const interval = req.query.interval || "1";
  console.log(`📸 [GET] capture request for interval=${interval}`);
  const command = `node captureAndSend.js --interval=${interval}`;
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`❌ Error: ${error.message}`);
      return res.status(500).send("Capture failed");
    }
    res.send("✅ Capture initiated via GET");
  });
});

// POST / 지원 (웹훅용)
router.post("/", (req, res) => {
  const interval = req.query.interval || "1";
  console.log(`📸 [POST] capture request for interval=${interval}`);
  const command = `node captureAndSend.js --interval=${interval}`;
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`❌ Error: ${error.message}`);
      return res.status(500).send("Capture failed");
    }
    res.send("✅ Capture initiated via POST");
  });
});

module.exports = router;
console.log("✅ captureApi.js 라우터 정상 로딩됨");
