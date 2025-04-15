// ✅👇 commands/status.js

const {
  editMessage,
  inlineKeyboard,
  getLangKeyboard,
  getTemplateTestKeyboard,
  getSymbolToggleKeyboard, // ✅ 이거 추가!
  sendTextToBot,
  sendToAdmin
} = require('../botManager');
const langManager = require('../langConfigManager');
const config = require('../config');
const {
  getLastDummyTime,
  setAdminMessageId,
  getAdminMessageId,
  getTimeString
} = require('../utils');
const { translations } = require('../lang');
const moment = require('moment-timezone');
const { getTemplate } = require('../MessageTemplates');
const fs = require('fs');
const path = require('path');
const symbolsPath = path.join(__dirname, '../trader-gate/symbols.js'); // ✅ 심볼 토글 처리용 경로

// ✅ 캐시: 중복 메시지 생략을 위한 간단한 메모리 저장소
const cache = new Map();

// ✅ 버튼 로그 메시지용 키 매핑
const logMap = {
  'choi_on': '▶️ [상태 갱신: 최실장 ON]',
  'choi_off': '⏹️ [상태 갱신: 최실장 OFF]',
  'ming_on': '▶️ [상태 갱신: 밍밍 ON]',
  'ming_off': '⏹️ [상태 갱신: 밍밍 OFF]',
  'status': '📡 [상태 확인 요청]',
  'dummy_status': '🔁 [더미 상태 확인 요청]',
  'symbol_toggle_menu': '📊 [종목 토글 패널 열기]'
};

// ✅ 텔레그램 버튼 클릭 처리 함수
async function handleAdminAction(data, ctx) {
  const chatId = ctx.chat.id;
  const messageId = ctx.callbackQuery.message.message_id;
  const callbackQueryId = ctx.callbackQuery.id;

  // ✅ 템플릿 테스트 버튼 클릭 처리
  if (data.startsWith("test_template_")) {
    const type = data.replace("test_template_", "");
    const lang = langManager.getUserConfig(chatId)?.lang || 'ko';
    const isShort = type.endsWith('Short');
    const direction = isShort ? 'short' : 'long';
    try {
      const msg = getTemplate({
        type,
        symbol: 'BTCUSDT.P',
        timeframe: '1',
        price: 62500,
        ts: Math.floor(Date.now() / 1000),
        entryCount: 1,
        entryAvg: '60000',
        leverage: 50,
        lang,
        direction
      });
      await sendTextToBot('admin', chatId, `📨 템플릿 테스트 결과 (${type})\n\n${msg}`, null);
    } catch (err) {
      await sendTextToBot('admin', chatId, `❌ 템플릿 오류: ${err.message}`, null);
    }
    return;
  }

  // ✅ 종목 ON/OFF 토글 처리
  if (data.startsWith("toggle_symbol_")) {
    const symbol = data.replace("toggle_symbol_", "");
    const raw = fs.readFileSync(symbolsPath, 'utf8');
    const lines = raw.split("\n");
    const updated = lines.map(line => {
      if (line.includes(`${symbol}: {`)) {
        return line.includes('enabled: true')
          ? line.replace('enabled: true', 'enabled: false')
          : line.replace('enabled: false', 'enabled: true');
      }
      return line;
    });
    fs.writeFileSync(symbolsPath, updated.join("\n"));
    console.log(`🔁 심볼 상태 토글됨: ${symbol}`);
    await editMessage('admin', chatId, messageId, '📊 종목 자동매매 설정 토글됨', getSymbolToggleKeyboard(), {
      callbackQueryId,
      callbackResponse: `✅ ${symbol.toUpperCase()} 상태 토글됨`
    });
    return;
  }

  // ✅ 토글 메뉴 호출
  if (data === 'symbol_toggle_menu') {
    await editMessage('admin', chatId, messageId, '📊 자동매매 종목 설정 (ON/OFF)', getSymbolToggleKeyboard(), {
      callbackQueryId,
      callbackResponse: '✅ 종목 설정 메뉴 열림'
    });
    return;
  }
  
  // ✅ 상태 토글 처리용
  let changed = false;

  switch (data) {
    case 'choi_on':
      if (!global.choiEnabled) { global.choiEnabled = true; changed = true; }
      break;
    case 'choi_off':
      if (global.choiEnabled) { global.choiEnabled = false; changed = true; }
      break;
    case 'ming_on':
      if (!global.mingEnabled) { global.mingEnabled = true; changed = true; }
      break;
    case 'ming_off':
      if (global.mingEnabled) { global.mingEnabled = false; changed = true; }
      break;
    default:
      changed = true;
      break;
  }

  // ✅ 변경 없음 → 메시지 생략
  if (!changed) {
    await editMessage('admin', chatId, messageId, '⏱️ 현재와 동일한 상태입니다.', null, {
      callbackQueryId,
      callbackResponse: '동일한 상태입니다.',
      logMessage: `${logMap[data] || '🧩 버튼'}`
    });
    return;
  }

  // ✅ 상태 패널 갱신 호출
  await sendBotStatus(undefined, data, chatId, messageId, {
    callbackQueryId,
    callbackResponse: '✅ 상태 갱신 완료',
    logMessage: logMap[data]
  });
}

// ✅ 상태 패널 메시지 전송 함수
async function sendBotStatus(timeStr = getTimeString(), suffix = '', chatId = config.ADMIN_CHAT_ID, messageId = null, options = {}) {
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

  // ✅ 캐시 키에 더미 수신 시간도 포함하여 중복 출력 방지 개선
  const dayTranslated = translations[userLang]?.days[now.day()] || now.format('ddd');
  const lastDummy = getLastDummyTime();
  const dummyKey = lastDummy || 'no-dummy';
  const key = `${chatId}_${suffix}_${choiEnabled}_${mingEnabled}_${langChoi}_${langMing}_${dummyKey}`;
  
  const dummyMoment = moment(lastDummy, moment.ISO_8601, true).isValid() ? moment.tz(lastDummy, tz) : null;
  const elapsed = dummyMoment ? moment().diff(dummyMoment, 'minutes') : null;  
  const dummyTimeFormatted = dummyMoment ? dummyMoment.format(`YY.MM.DD (${dayTranslated}) HH:mm:ss`) : '기록 없음';
  const elapsedText = elapsed !== null ? (elapsed < 1 ? '방금 전' : `+${elapsed}분 전`) : '';

  if (cache.get(key) === nowTime) {
    if (options.callbackQueryId) {
      const axios = require('axios');
      await axios.post(`https://api.telegram.org/bot${config.ADMIN_BOT_TOKEN}/answerCallbackQuery`, {
        callback_query_id: options.callbackQueryId,
        text: '⏱️ 최신 정보입니다.',
        show_alert: false
      });
    }

    if (suffix.startsWith('lang_choi')) {
      console.log('🌐 최실장 언어선택 패널 중복 생략');
    } else if (suffix.startsWith('lang_ming')) {
      console.log('🌐 밍밍 언어선택 패널 중복 생략');
    } else if (options.logMessage) {
      const cleaned = options.logMessage.replace(/^.*\[\s?|\s?\]$/g, '').trim();
      console.log(`⚠️ ${cleaned} 중복 생략`);
    } else {
      console.log('⚠️ 상태 메시지 중복 생략');
    }
    return;
  }

  cache.set(key, nowTime);

  // ✅ 언어별 타임존 + 이모지 매핑
  const langEmojiMap = { ko: '🇰🇷', en: '🇺🇸', jp: '🇯🇵', zh: '🇨🇳' };
  const langTzChoi = translations[langChoi]?.timezone || config.DEFAULT_TIMEZONE;
  const langTzMing = translations[langMing]?.timezone || config.DEFAULT_TIMEZONE;

  const langDisplay = (lang, tz) => {
    const emoji = langEmojiMap[lang] || '';
    return `<code>${lang}</code> ${emoji} | ${tz}`;
  };

  const keyboard = suffix === 'lang_choi' ? getLangKeyboard('choi') :
                   suffix === 'lang_ming' ? getLangKeyboard('ming') :
                   suffix === 'test_menu' ? getTemplateTestKeyboard() :
                   inlineKeyboard;

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
    const existingMessageId = messageId || getAdminMessageId();
    let sent;

    if (existingMessageId) {
      sent = await editMessage('admin', chatId, existingMessageId, statusMsg, keyboard, {
        ...options, parse_mode: 'HTML'
      });
      if (sent?.data?.result?.message_id) setAdminMessageId(sent.data.result.message_id);
    } else {
      sent = await sendTextToBot('admin', chatId, statusMsg, keyboard, {
        ...options, parse_mode: 'HTML'
      });
      if (sent?.data?.result?.message_id) setAdminMessageId(sent.data.result.message_id);
    }

    return sent;
  } catch (err) {
    console.error('⚠️ 관리자 패널 오류:', err.message);
    return null;
  }
}

// ✅ 봇 실행 시 관리자 패널 초기화 및 자동 갱신 시작
async function initAdminPanel() {
  const sent = await sendBotStatus();
  if (sent && sent.data?.result) {
    console.log('✅ 관리자 패널 초기화 성공');

    // ✅ 1분마다 자동 갱신
    setInterval(() => {
      sendBotStatus(undefined, '', config.ADMIN_CHAT_ID);
    }, 60 * 1000);
  } else {
    console.warn('⚠️ 관리자 패널 초기화 시 메시지 결과 없음');
  }
}

module.exports = {
  sendBotStatus,
  initAdminPanel,
  handleAdminAction
};
