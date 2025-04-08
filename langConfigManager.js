// langConfigManager.js

const fs = require('fs');
const path = './langConfig.json';

function ensureLangConfigFile() {
  if (!fs.existsSync(path)) {
    saveLangConfig({});
