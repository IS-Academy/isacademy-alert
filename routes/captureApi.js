//✅👇 captureApi.js

const express = require("express");
const router = express.Router();
const { exec } = require("child_process");

// GET /capture?interval=1
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

module.exports = router;
console.log("✅ captureApi.js 라우터 정상 로딩됨");
