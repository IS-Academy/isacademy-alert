//✅👇 commands/status.js

const {
  editMessage,
  getLangKeyboard,
  getLangMenuKeyboard,
  getUserToggleKeyboard,
  getSymbolToggleKeyboard,
  getTemplateTestKeyboard,
  sendTextToBot,
  getDynamicInlineKeyboard,
  sendToAdmin  
} = require('../botManager');

const langManager = require('../langConfigManager');
const config = require('../config');
const {
  getLastDummyTime,
  setAdminMessageId,
  getAdminMessageId
} = require('../utils');
const { translations } = require('../lang');
const moment = require('moment-timezone');
const { getTemplate } = require('../MessageTemplates');
const { getEntryInfo } = require('../entryManager');
const { loadBotState, saveBotState } = require('../utils');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const symbolsPath = path.join(__dirname, '../trader-gate/symbols.js');

let intervalId = null; // ✅ 인터벌 변수 선언 및 초기화
const cache = new Map();

const axiosInstance = axios.create({
  timeout: 5000, // 요청 제한시간 5초
  httpAgent: new (require('http').Agent)({ keepAlive: true }), // Keep-Alive 설정
});

async function answerCallback(callbackQueryId, text = '✅ 처리 완료!') {
  return axiosInstance.post(`https://api.telegram.org/bot${config.ADMIN_BOT_TOKEN}/answerCallbackQuery`, {
    callback_query_id: callbackQueryId,
    text,
    cache_time: 1,
  });
}

async function handleAdminAction(data, ctx) {
  const chatId = config.ADMIN_CHAT_ID;
  const messageId = getAdminMessageId(); // 직접 불러오기 최적화
  const callbackQueryId = ctx.callbackQuery.id;

  let newText, newKeyboard, responseText;

  switch (data) {
    case 'choi_toggle':
    case 'ming_toggle':
      const isChoi = data === 'choi_toggle';
      const botState = loadBotState();  // ✅ 파일 상태 로딩
      botState[isChoi ? 'choiEnabled' : 'mingEnabled'] = !botState[isChoi ? 'choiEnabled' : 'mingEnabled'];
      saveBotState(botState);  // ✅ 파일에 상태 저장
      global.choiEnabled = botState.choiEnabled;  // ✅ global도 같이 동기화
      global.mingEnabled = botState.mingEnabled;  // ✅ global도 같이 동기화      
      responseText = `${isChoi ? '👨‍💼 최실장' : '👩‍💼 밍밍'} ${botState[isChoi ? 'choiEnabled' : 'mingEnabled'] ? '✅ ON' : '❌ OFF'}`;
      await Promise.all([
        sendBotStatus(chatId, messageId),
        answerCallback(callbackQueryId, responseText),
      ]);
      return;

    case 'lang_menu':
      newText = '🌐 언어 설정 대상 선택';
      newKeyboard = getLangMenuKeyboard(); // ⚠️ 관리자 키보드 바꾸는 동작
      responseText = '✅ 언어 메뉴 열림';
      break;

    case 'lang_choi':
    case 'lang_ming':
      newText = `🌐 ${data === 'lang_choi' ? '최실장' : '밍밍'} 언어 선택`;
      newKeyboard = getLangKeyboard(data.split('_')[1]); // ⚠️ 관리자 키보드 바꾸는 동작 + data.split
      responseText = '✅ 언어 선택 메뉴';
      break;
      
    case 'status':
    case 'dummy_status':
      await Promise.all([
        sendBotStatus(chatId, messageId),
        answerCallback(callbackQueryId, data === 'status' ? '✅ 최신 상태로 업데이트 완료' : '♻️ 더미 상태 최신화 완료')
      ]);
      return;

    case 'test_menu':
      newText = '🧪 템플릿 테스트 메뉴입니다';
      newKeyboard = getTemplateTestKeyboard(); // ⚠️ 관리자 키보드 바꾸는 동작
      responseText = '✅ 테스트 메뉴 열림';
      break;      

    case 'symbol_toggle_menu':
      newText = '📊 자동매매 종목 설정 (ON/OFF)';
      newKeyboard = getSymbolToggleKeyboard(); // ⚠️ 관리자 키보드 바꾸는 동작
      responseText = '✅ 종목 설정 메뉴 열림';
      break;

    case 'back_main':
      await Promise.all([
        sendBotStatus(chatId, messageId),
        answerCallback(callbackQueryId, '↩️ 메인 메뉴로 돌아갑니다')
      ]);
      return;

    default:
      if (data.startsWith('lang_') && data.split('_').length === 3) {
        const [_, bot, langCode] = data.split('_');
        langManager.setUserLang(bot === 'choi' ? config.TELEGRAM_CHAT_ID : config.TELEGRAM_CHAT_ID_A, langCode);

        await Promise.all([
          sendBotStatus(chatId, messageId),
          answerCallback(callbackQueryId, `✅ ${bot.toUpperCase()} 언어가 ${langCode.toUpperCase()}로 변경됨`)
        ]);
        return;
      }

      if (data.startsWith('test_template_')) {
        const type = data.replace('test_template_', '');
        const lang = langManager.getUserConfig(chatId)?.lang || 'ko';
        const symbol = 'btcusdt.p';
        const { entryAvg: avg, entryCount: ratio } = getEntryInfo(symbol, type, '1');

        const msg = getTemplate({
          type, symbol: symbol.toUpperCase(), timeframe: '1', price: 62500, ts: Math.floor(Date.now() / 1000),
          entryCount: ratio || 0, entryAvg: avg || 'N/A', leverage: 50, lang,
          direction: type.endsWith('Short') ? 'short' : 'long'
        });

        await Promise.all([
          sendTextToBot('admin', chatId, `📨 템플릿 테스트 결과 (${type})\n\n${msg}`),
          answerCallback(callbackQueryId, '✅ 템플릿 테스트 완료')
        ]);
        return;
      }

      if (data.startsWith('toggle_symbol_')) {
        const symbolKey = data.replace('toggle_symbol_', '').toLowerCase();
        const symbols = require('../trader-gate/symbols');
        if (symbols[symbolKey]) {
          symbols[symbolKey].enabled = !symbols[symbolKey].enabled;
          fs.writeFileSync(symbolsPath, `module.exports=${JSON.stringify(symbols,null,2)}`);
          await Promise.all([
            editMessage('admin', chatId, messageId, '📊 자동매매 종목 설정 (ON/OFF)', getSymbolToggleKeyboard()),
            answerCallback(callbackQueryId, `✅ ${symbolKey.toUpperCase()} 상태 변경됨`)
          ]);
        }
        return;
      }
  }

  if (newText && newKeyboard) {
    await Promise.all([
      editMessage('admin', chatId, messageId, newText, newKeyboard),
      answerCallback(callbackQueryId, responseText)
    ]);
  }
}

// ✅ 상태 메시지 전송
async function sendBotStatus(chatId = config.ADMIN_CHAT_ID, messageId = null, options = {}) {
  const now = moment().tz(config.DEFAULT_TIMEZONE);
  const nowTime = now.format('HH:mm:ss');

  const { choiEnabled, mingEnabled } = global;
  const configChoi = langManager.getUserConfig(config.TELEGRAM_CHAT_ID) || {};
  const configMing = langManager.getUserConfig(config.TELEGRAM_CHAT_ID_A) || {};
  const userConfig = langManager.getUserConfig(chatId) || {};

  const langChoi = configChoi.lang || 'ko';
  const langMing = configMing.lang || 'ko';
  const userLang = userConfig.lang || 'ko';
  const tz = userConfig.tz || config.DEFAULT_TIMEZONE;

  const dayTranslated = translations[userLang]?.days[now.day()] || now.format('ddd');
  const lastDummy = getLastDummyTime();
  const dummyKey = lastDummy || 'no-dummy';
  const key = `${chatId}_${choiEnabled}_${mingEnabled}_${langChoi}_${langMing}_${dummyKey}`;

  const dummyMoment = moment(lastDummy, moment.ISO_8601, true).isValid() ? moment.tz(lastDummy, tz) : null;
  const elapsed = dummyMoment ? moment().diff(dummyMoment, 'minutes') : null;
  const dummyTimeFormatted = dummyMoment ? dummyMoment.format(`YY.MM.DD (${dayTranslated}) HH:mm:ss`) : '기록 없음';
  const elapsedText = elapsed !== null ? (elapsed < 1 ? '방금 전' : `+${elapsed}분 전`) : '';

  if (options.callbackQueryId) {
    await axios.post(`https://api.telegram.org/bot${config.ADMIN_BOT_TOKEN}/answerCallbackQuery`, {
      callback_query_id: options.callbackQueryId,
      text: options.callbackResponse || '✅ 처리 완료!',
      show_alert: false,
      cache_time: 1  // 빠른 응답 속도 최적화
    });
  }
  
  cache.set(key, nowTime);

  const langEmojiMap = { ko: '🇰🇷', en: '🇺🇸', jp: '🇯🇵', zh: '🇨🇳' };
  const langTzChoi = translations[langChoi]?.timezone || config.DEFAULT_TIMEZONE;
  const langTzMing = translations[langMing]?.timezone || config.DEFAULT_TIMEZONE;

  const langDisplay = (lang, tz) => {
    const emoji = langEmojiMap[lang] || '';
    return `<code>${lang}</code> ${emoji} | ${tz}`;
  };

  // ✅ 패널 메시지 조립
  const statusMsg = [
    `📡 <b>IS 관리자봇 패널</b>`,
    `──────────────────────`,
    `📍 <b>현재 상태:</b> 🕐 <code>${nowTime}</code>`,
    ``,
    `👨‍💼 최실장: ${choiEnabled ? '✅ ON' : '❌ OFF'} (${langDisplay(langChoi, langTzChoi)})`,
    `👩‍💼 밍밍: ${mingEnabled ? '✅ ON' : '❌ OFF'} (${langDisplay(langMing, langTzMing)})`,
    ``,
    `📅 <b>${now.format(`YY.MM.DD (${dayTranslated})`)}</b>`,
    `🛰 <b>더미 수신:</b> ${dummyMoment ? '♻️' : '❌'} <code>${dummyTimeFormatted}</code> ${elapsedText}`,
    `──────────────────────`
  ].join('\n');

  try {
    let sent;

    // ✅ 키보드 자동 생성 조건 옵션 추가
    if (!messageId) {
      if (options.allowCreateKeyboard === false) { // 키보드 생성이 허용되지 않은 상황
        console.warn('⚠️ 키보드가 없지만 생성이 허용되지 않았습니다. (더미 수신 등)');
        return null; // 생성 중단하고 종료
      }

      // 아래는 키보드 생성 허용된 경우만 실행
      sent = await sendTextToBot('admin', chatId, statusMsg, getDynamicInlineKeyboard(), { parse_mode: 'HTML', ...options });

      if (sent?.data?.result?.message_id) {
        setAdminMessageId(sent.data.result.message_id);
        if (intervalId) clearInterval(intervalId);
        intervalId = setInterval(() => sendBotStatus(chatId, sent.data.result.message_id), 60 * 1000);          
      } else {
        await sendToAdmin("⚠️ 초기 키보드 생성 실패! 관리자 키보드를 수동으로 초기화 해주세요.");
      }
    } else {
      sent = await editMessage('admin', chatId, messageId, statusMsg, getDynamicInlineKeyboard(), { parse_mode: 'HTML', ...options });

      if (sent?.data?.result?.message_id) setAdminMessageId(sent.data.result.message_id);
    }

    return sent;

  } catch (err) {
    console.error('⚠️ 관리자 패널 오류:', err.message);
    await sendToAdmin(`⚠️ 관리자 패널 오류 발생: ${err.message}`);
    return null;
  }
}

module.exports = {
  sendBotStatus,
  initAdminPanel: async () => {
    const messageId = getAdminMessageId();

    if (!messageId) {
      console.warn("⚠️ 초기 메시지 ID 없음. 새 관리자 키보드를 생성합니다.");
      const sent = await sendBotStatus(); // 메시지 ID 없으면 자동 생성
      if (sent && sent.data?.result) {
        setAdminMessageId(sent.data.result.message_id); // 메시지 ID 설정
        console.log('✅ 관리자 패널 최초 생성 완료');
        if (intervalId) clearInterval(intervalId);
        intervalId = setInterval(() => sendBotStatus(), 60 * 1000);
      } else {
        await sendToAdmin("⚠️ 초기 키보드 자동 생성에 실패했습니다. 잠시 후 자동 재시도를 진행합니다.");
      }
    } else {
      const sent = await sendBotStatus(config.ADMIN_CHAT_ID, messageId);
      if (sent && sent.data?.result) {
        console.log('✅ 관리자 패널 상태 갱신 시작');
        if (intervalId) clearInterval(intervalId);
        intervalId = setInterval(() => sendBotStatus(config.ADMIN_CHAT_ID, messageId), 60 * 1000);
      } else {
        console.warn('⚠️ 관리자 패널 상태 갱신 실패');
        await sendToAdmin("⚠️ 관리자 패널 상태 갱신에 실패했습니다. 잠시 후 자동으로 재시도됩니다.");
      }
    }
  },
  handleAdminAction
};

