// commands/settz.js
const { getTzKeyboard, sendTextToTelegram } = require('../utils');
const langMessages = require('../langMessages');
const langManager = require('../langConfigManager');

module.exports = async function handleSetTzCommand(chatId, input, lang, timeStr) {
  if (!input) {
    await sendTextToTelegram('🕒 타임존을 선택해주세요:', getTzKeyboard());
    return;
  }

  const success = langManager.setUserTimezone(chatId, input);
  const msg = success
    ? langMessages.setTzSuccess[lang](input)
    : langMessages.setTzFail[lang]();

  await sendTextToTelegram(`${msg} (🕒 ${timeStr})`);
};
