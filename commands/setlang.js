// commands/setlang.js
const { getReplyKeyboard, sendTextToTelegram } = require('../utils');
const langMessages = require('../langMessages');
const langManager = require('../langConfigManager');

module.exports = async function handleSetLangCommand(chatId, input, lang, timeStr) {
  if (!input) {
    await sendTextToTelegram('🌐 언어를 선택해주세요:', getReplyKeyboard('lang'));
    return;
  }

  const success = langManager.setUserLang(chatId, input);
  const msg = success
    ? langMessages.setLangSuccess[lang](input)
    : langMessages.setLangFail[lang]();

  await sendTextToTelegram(`${msg} (🕒 ${timeStr})`);
};
