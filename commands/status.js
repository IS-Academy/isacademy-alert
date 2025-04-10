// ✅👇 commands/status.js

const { editMessage, inlineKeyboard, getLangKeyboard, sendTextToBot } = require('../botManager');
const langManager = require('../langConfigManager');
const config = require('../config');
const {
  getLastDummyTime,
  setAdminMessageId,
  getAdminMessageId,
  getTimeString,
  loadBotState
} = require('../utils');
const { translations } = require('../lang');
const moment = require('moment-timezone');

const cache = new Map();

module.exports = async function sendBotStatus(timeStr = getTimeString(), suffix = '', chatId = config.ADMIN_CHAT_ID, messageId = null, retry = false) {
  const key = `${chatId}_${suffix}`;
  const now = moment().tz(config.DEFAULT_TIMEZONE);
  const nowTime = now.format('HH:mm:ss');

  if (cache.get(key) === nowTime) {
    console.log('⚠️ 상태 메시지 중복 생략');
    return;
  }
  cache.set(key, nowTime);

  const { choiEnabled, mingEnabled } = loadBotState();

  const langChoi = langManager.getUserConfig(config.TELEGRAM_CHAT_ID)?.lang || 'ko';
  const langMing = langManager.getUserConfig(config.TELEGRAM_CHAT_ID_A)?.lang || 'ko';
  const userLang = langManager.getUserConfig(chatId)?.lang || 'ko';
  const tz = langManager.getUserConfig(chatId)?.tz || config.DEFAULT_TIMEZONE;

  const dayKey = now.format('ddd');
  const dayTranslated = translations[userLang]?.days?.[dayKey] || dayKey;
  const dateFormatted = now.format(`YY.MM.DD (${dayTranslated})`);
  const timeFormatted = now.format('HH:mm:ss');

  const lastDummy = getLastDummyTime();
  const dummyMoment = lastDummy && lastDummy !== '❌ 기록 없음' ? moment.tz(lastDummy, tz) : null;
  const dummyTime = dummyMoment ? dummyMoment.format(`YY.MM.DD (${dayTranslated}) HH:mm:ss`) : '기록 없음';
  const elapsed = dummyMoment ? moment().diff(dummyMoment, 'minutes') : null;
  const elapsedText = dummyMoment ? (elapsed < 1 ? '방금 전' : `+${elapsed}분 전`) : '';

  const keyboard = suffix === 'lang_choi' ? getLangKeyboard('choi') :
                   suffix === 'lang_ming' ? getLangKeyboard('ming') : inlineKeyboard;

  let statusMsg = `📡 <b>IS 관리자봇 패널</b>\n`;
  statusMsg += `──────────────────────\n`;
  statusMsg += `📍 <b>현재 상태:</b> 🕐 <code>${timeFormatted}</code>\n\n`;
  statusMsg += `👨‍💼 최실장: ${choiEnabled ? '✅ ON' : '❌ OFF'} (<code>${langChoi}</code>)\n`;
  statusMsg += `👩‍💼 밍밍: ${mingEnabled ? '✅ ON' : '❌ OFF'} (<code>${langMing}</code>)\n\n`;
  statusMsg += `📅 <b>${dateFormatted}</b>\n`;
  statusMsg += `🛰 <b>더미 수신:</b> ${dummyMoment ? '✅' : '❌'} <code>${dummyTime}</code> ${elapsedText}\n`;
  statusMsg += `──────────────────────`;

  try {
    const existingMessageId = messageId || getAdminMessageId();
    let sent;

    if (existingMessageId) {
      sent = await editMessage('admin', chatId, existingMessageId, statusMsg, keyboard, { parse_mode: 'HTML' });
      if (sent && sent.data && sent.data.result) {
        setAdminMessageId(sent.data.result.message_id);
        console.log("✅ 메시지 수정 완료 (messageId 업데이트됨)");
      } else {
        throw new Error('메시지 수정 결과 없음');
      }
    } else {
      sent = await sendTextToBot('admin', chatId, statusMsg, keyboard);
      if (sent && sent.data && sent.data.result) {
        setAdminMessageId(sent.data.result.message_id);
        console.log("✅ 신규 메시지 전송 완료 (messageId 저장됨)");
      } else {
        throw new Error('신규 메시지 전송 결과 없음');
      }
    }
  } catch (err) {
    console.warn('⚠️ 메시지 처리 실패:', err.message);

    // 재시도는 최대 1회만 허용
    if (!retry) {
      console.log('🔄 메시지 1회 재전송 시도 중...');
      const sent = await sendTextToBot('admin', chatId, statusMsg, keyboard);
      if (sent && sent.data && sent.data.result) {
        setAdminMessageId(sent.data.result.message_id);
        console.log("✅ 재시도 메시지 전송 성공 (messageId 저장됨)");
      } else {
        console.error('❌ 재시도 메시지 전송 실패:', sent?.data || '응답 없음');
      }
    } else {
      console.error('❌ 재시도 이미 수행됨. 추가 재전송 없음.');
    }
  }
};

