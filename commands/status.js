//✅👇 commands/status.js

const moment = require('moment-timezone');
const config = require('../config');
const { getLastDummyTime, getAdminMessageId, saveAdminMessageId, loadAdminMessageId } = require('../utils');
const { loadBotState, saveBotState } = require('../utils');
const { resetBotStateToDefault, backupBotState } = require('../utils');  // ✅ 기본값으로 상태 리셋 & 백업
const langManager = require('../langConfigManager');
const { translations } = require('../lang');
const { getEntryInfo } = require('../entryManager');
const { editMessage, getLangKeyboard, getLangMenuKeyboard, getUserToggleKeyboard, getSymbolToggleKeyboard, getTemplateTestKeyboard, sendTextToBot, getDynamicInlineKeyboard, sendToAdmin } = require('../botManager');
const { getTemplate } = require('../MessageTemplates');
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

// ✅ 콜백 예외 안전 버전
const safeAnswerCallback = (id, text = '✅ 처리 완료!') => {
  return answerCallback(id, text).catch(e => {
    if (e.response?.data?.description?.includes('query is too old')) {
      console.warn(`⚠️ Callback 만료됨: ${id}`);
    } else {
      console.error(`❌ Callback 에러: ${e.message}`);
    }
  });
};

async function handleAdminAction(data, ctx) {
  const chatId = config.ADMIN_CHAT_ID;
  const messageId = getAdminMessageId(); // 직접 불러오기 최적화
  const callbackQueryId = ctx.callbackQuery.id;

  let newText, newKeyboard, responseText;

  switch (data) {
    case 'choi_toggle':
    case 'ming_toggle':
    case 'english_toggle':
    case 'china_toggle':
    case 'japan_toggle': {
      const botState = loadBotState();  // ✅ 파일 상태 로딩
      const key = data.replace('_toggle', '') + 'Enabled';
      botState[key] = !botState[key];
      saveBotState(botState);  // ✅ 파일에 상태 저장
      global[key] = botState[key];

      const label =
        data === 'choi_toggle' ? '👨‍💼 최실장' :
        data === 'ming_toggle' ? '👩‍💼 밍밍' :
        data === 'english_toggle' ? '🌍 영어' :
        data === 'china_toggle' ? '🇨🇳 중국' :
        data === 'japan_toggle' ? '🇯🇵 일본' :
        '❓기타';

      responseText = `${label} ${botState[key] ? '✅ ON' : '❌ OFF'}`;

      console.log(`📩 [${data}] ${label} → ${botState[key] ? 'ON' : 'OFF'} | fromButton: true`);

      await Promise.all([
        sendBotStatus(chatId, messageId, { allowCreateKeyboard: false, fromButton: true }),
        answerCallback(callbackQueryId, responseText)
      ]);
      const source = true ? '🔘버튼' : '⏱자동';
      console.log(`📡 sendBotStatus 호출 → ${label}: ${botState[key] ? 'ON' : 'OFF'} | ${source}`);
      return;
    }

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
        sendBotStatus(chatId, messageId, { allowCreateKeyboard: false, fromButton: true }),
        answerCallback(callbackQueryId, data === 'status' ? '✅ 최신 상태로 업데이트 완료' : '♻️ 더미 상태 최신화 완료')
      ]);
      console.log(`📡 sendBotStatus 호출 (fromButton: true)`);     
      return;

    case 'backup_bot_state':
      const backup = backupBotState();
      await answerCallback(callbackQueryId, backup ? '✅ 상태 백업 완료' : '❌ 백업 실패');
      return;

    case 'reset_bot_state':
      resetBotStateToDefault();
      await Promise.all([
        sendBotStatus(chatId, messageId, { allowCreateKeyboard: false, fromButton: true }),
        answerCallback(callbackQueryId, '♻️ 상태 기본값으로 리셋됨')
      ]);
      console.log(`📡 sendBotStatus 호출 (fromButton: true)`);     
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
        sendBotStatus(chatId, messageId, { allowCreateKeyboard: false, fromButton: true }),
        answerCallback(callbackQueryId, '↩️ 메인 메뉴로 돌아갑니다')
      ]);
      console.log(`📡 sendBotStatus 호출 (fromButton: true)`);     
      return;

    default:
      if (data.startsWith('lang_') && data.split('_').length === 3) {
        const [_, bot, langCode] = data.split('_');
        langManager.setUserLang(bot === 'choi' ? config.TELEGRAM_CHAT_ID : config.TELEGRAM_CHAT_ID_A, langCode);
        await Promise.all([
          sendBotStatus(chatId, messageId, { allowCreateKeyboard: false, fromButton: true }),
          answerCallback(callbackQueryId, `✅ ${bot.toUpperCase()} 언어가 ${langCode.toUpperCase()}로 변경됨`)
        ]);
        console.log(`📡 sendBotStatus 호출 (fromButton: true)`);     
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
        console.log(`📡 sendBotStatus 호출 (fromButton: true)`);     
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
          console.log(`📡 sendBotStatus 호출 (fromButton: true)`);         
        }
        return;
      }
  }

  if (newText && newKeyboard) {
    await Promise.all([
      editMessage('admin', chatId, messageId, newText, newKeyboard),
      answerCallback(callbackQueryId, responseText)
    ]);
    console.log(`📡 sendBotStatus 호출 (fromButton: true)`);
  }
}

// ✅ 상태 메시지 전송
async function sendBotStatus(chatId = config.ADMIN_CHAT_ID, messageId = null, options = {}) {
  // ✅ global 전역 동기화 보정 (초기 1회용)
  const state = loadBotState();
  global.choiEnabled = state.choiEnabled;
  global.mingEnabled = state.mingEnabled;
  global.englishEnabled = state.englishEnabled;
  global.chinaEnabled = state.chinaEnabled;
  global.japanEnabled = state.japanEnabled;

  const now = moment().tz(config.DEFAULT_TIMEZONE);
  const nowTime = now.format('HH:mm:ss');

  const { choiEnabled, mingEnabled, englishEnabled, chinaEnabled, japanEnabled } = global;
  const configChoi = langManager.getUserConfig(config.TELEGRAM_CHAT_ID) || {};
  const configMing = langManager.getUserConfig(config.TELEGRAM_CHAT_ID_A) || {};
  const configEnglish = langManager.getUserConfig(config.TELEGRAM_CHAT_ID_GLOBAL) || {};
  const configChina   = langManager.getUserConfig(config.TELEGRAM_CHAT_ID_CHINA) || {};
  const configJapan   = langManager.getUserConfig(config.TELEGRAM_CHAT_ID_JAPAN) || {}; 
  const userConfig = langManager.getUserConfig(chatId) || {};

  const langChoi = configChoi.lang || 'ko';
  const langMing = configMing.lang || 'ko';
  const langEnglish = configEnglish.lang || 'en';
  const langChina   = configChina.lang   || 'zh';
  const langJapan   = configJapan.lang   || 'jp';
  const userLang = userConfig.lang || 'ko';
  const tz = userConfig.tz || config.DEFAULT_TIMEZONE;

  const dayTranslated = translations[userLang]?.days[now.day()] || now.format('ddd');
  const lastDummy = getLastDummyTime();
  const dummyKey = lastDummy || 'no-dummy';
  const key = `${chatId}_${choiEnabled}_${mingEnabled}_${englishEnabled}_${chinaEnabled}_${japanEnabled}_${langChoi}_${langMing}_${dummyKey}`;

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
  const langTzChoi    = translations[langChoi]?.timezone || config.DEFAULT_TIMEZONE;
  const langTzMing    = translations[langMing]?.timezone || config.DEFAULT_TIMEZONE;
  const langTzEnglish = translations[langEnglish]?.timezone || config.DEFAULT_TIMEZONE;
  const langTzChina   = translations[langChina]?.timezone   || config.DEFAULT_TIMEZONE;
  const langTzJapan   = translations[langJapan]?.timezone   || config.DEFAULT_TIMEZONE;
  
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
    `🌍 영어: ${englishEnabled ? '✅' : '❌'}   🇨🇳 중국: ${chinaEnabled ? '✅' : '❌'}   🇯🇵 일본: ${japanEnabled ? '✅' : '❌'}`,
    ``,
    `📅 <b>${now.format(`YY.MM.DD (${dayTranslated})`)}</b>`,
    `🛰 <b>더미 수신:</b> ${dummyMoment ? '♻️' : '❌'} <code>${dummyTimeFormatted}</code> ${elapsedText}`,
    `──────────────────────`
  ].join('\n');

  try {
    if (!messageId) {
      if (options.allowCreateKeyboard === false) {
        console.warn('⚠️ 키보드 생성 비허용 설정 → 중단');
        return null;
      }

      const sent = await sendTextToBot('admin', chatId, statusMsg, getDynamicInlineKeyboard(), {
        parse_mode: 'HTML',
        ...options
      });

      if (sent?.data?.result?.message_id || sent?.data?.result?.message_id === 0) {
        const newId = sent.data.result.message_id;
        console.log('✅ 새 메시지 생성됨, ID 저장:', newId);
        saveAdminMessageId(newId);
        adminMessageId = newId;

        if (!options.suppressInterval && !intervalId) {
          intervalId = setInterval(() => {
            const currentId = getAdminMessageId();
            sendBotStatus(chatId, currentId, { allowCreateKeyboard: false });
          }, 60000);
        }
      } else {
        console.warn('⚠️ 메시지 ID 없음 → 저장 실패 가능성');
      }

      return sent;
    } else {
      if (messageId !== getAdminMessageId()) {
        console.warn('⚠️ 오래된 메시지 갱신 시도 → 중단됨:', messageId);  // 🧤 오래된 메시지 방지
        return null;
      }

      const sent = await editMessage('admin', chatId, messageId, statusMsg, getDynamicInlineKeyboard(), {
        parse_mode: 'HTML',
        ...options
      });

      if (sent?.data?.result?.message_id || sent?.data?.result?.message_id === 0) {
        if (!options?.fromButton) {
          console.log('✅ 기존 메시지 갱신됨, ID 재저장:', sent.data.result.message_id);
        }
        saveAdminMessageId(sent.data.result.message_id);
        adminMessageId = sent.data.result.message_id;
      } else {
        console.warn('⚠️ editMessage 성공했지만 message_id 없음 → 저장 생략');
      }

      return sent;
    }
  } catch (err) {
    const errorMsg = err.message || '';
    if (errorMsg.includes('message to edit not found') && options.allowCreateKeyboard !== false) {
      if (options._fromFallback) {
        console.warn('🛡️ fallback 중복 감지 → 키보드 생성 중단');
        return null;
      }

      console.warn('⚠️ 기존 메시지 없음 → 새 키보드 생성 시도');
      const sent = await sendTextToBot('admin', chatId, statusMsg, getDynamicInlineKeyboard(), {
        parse_mode: 'HTML',
        ...options
      });

      if (sent?.data?.result?.message_id || sent?.data?.result?.message_id === 0) {
        const newId = sent.data.result.message_id;
        console.log('✅ fallback 메시지 생성됨, ID 저장:', newId);
        saveAdminMessageId(newId);
        adminMessageId = newId;
      }

      return null;
    }

    console.error('❌ 관리자 패널 오류:', errorMsg);
    await sendToAdmin(`⚠️ 관리자 패널 오류 발생: ${errorMsg}`);
    return null;
  }
}

module.exports = {
  sendBotStatus,
  initAdminPanel: async () => {
    console.log('🌀 서버 재시작 감지 → 새로운 키보드 강제 생성');

    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }

    const sent = await sendBotStatus(config.ADMIN_CHAT_ID, null, {
      allowCreateKeyboard: true,
      suppressInterval: true
    });

    if (sent?.data?.result?.message_id) {
      const newId = sent.data.result.message_id;
      saveAdminMessageId(newId);
      adminMessageId = newId;

      intervalId = setInterval(() => {
        const currentId = getAdminMessageId();
        sendBotStatus(config.ADMIN_CHAT_ID, currentId, { allowCreateKeyboard: false });
      }, 60000);
    }
  },
  handleAdminAction
};
