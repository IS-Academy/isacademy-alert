// ✅👇 browserlessHandler.js

const axios = require('axios');
const FormData = require('form-data');
const config = require('./config');

// 실시간 차트 캡처 후 텔레그램 전송 (최실장용 테스트)
async function sendChartWithSignal({ chartUrl, message, chatId = config.TELEGRAM_CHAT_ID }) {
  try {
    const browserlessToken = config.BROWSERLESS_TOKEN;
    const screenshotUrl = `https://chrome.browserless.io/screenshot?token=${browserlessToken}&url=${encodeURIComponent(chartUrl)}&viewport.width=1280&viewport.height=720&fullPage=true`;

    const screenshotResponse = await axios.get(screenshotUrl, { responseType: 'arraybuffer' });
    const imageBuffer = Buffer.from(screenshotResponse.data, 'binary');

    const form = new FormData();
    form.append('chat_id', chatId);
    form.append('caption', message);
    form.append('parse_mode', 'HTML');
    form.append('photo', imageBuffer, { filename: 'chart.png', contentType: 'image/png' });

    await axios.post(`https://api.telegram.org/bot${config.TELEGRAM_BOT_TOKEN}/sendPhoto`, form, {
      headers: form.getHeaders()
    });

    console.log('✅ 차트 전송 완료 (최실장)');
  } catch (error) {
    console.error('❌ 차트 전송 실패:', error.message || error);
  }
}

module.exports = { sendChartWithSignal };
