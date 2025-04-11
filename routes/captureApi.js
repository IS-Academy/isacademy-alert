// ✅👇 captureApi.js
const express = require("express");
const router = express.Router();
const { exec } = require("child_process");

// POST /capture?interval=1
router.post("/capture", (req, res) => {
  const interval = req.query.interval || "1";
  console.log(`📸 Received capture request for interval: ${interval}`);

  // 실행 명령어
  const command = `node captureAndSend.js --interval=${interval}`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`❌ Error running capture: ${error.message}`);
      return res.status(500).send("Capture failed");
    }
    if (stderr) console.error(`stderr: ${stderr}`);
    if (stdout) console.log(`stdout: ${stdout}`);

    res.send("✅ Capture initiated");
  });
});

// GET /capture?interval=1 지원 추가 (브라우저에서 직접 호출 가능)
router.get("/capture", (req, res, next) => {
  req.method = "POST";
  next();
});

module.exports = router;
