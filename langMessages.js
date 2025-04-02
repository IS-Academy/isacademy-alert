// langMessages.js
module.exports = {
  setLangSuccess: {
    ko: (l) => `✅ 언어가 '${l}'로 설정되었습니다.`,
    en: (l) => `✅ Language set to '${l}'`,
    zh: (l) => `✅ 语言已设置为 '${l}'`
  },
  setLangFail: {
    ko: '❌ 언어 설정 실패',
    en: '❌ Failed to set language',
    zh: '❌ 设置语言失败'
  },
  setTzSuccess: {
    ko: (tz) => `✅ 시간대가 '${tz}'로 설정되었습니다.`,
    en: (tz) => `✅ Timezone set to '${tz}'`,
    zh: (tz) => `✅ 时区已设置为 '${tz}'`
  },
  setTzFail: {
    ko: '❌ 시간대 설정 실패',
    en: '❌ Failed to set timezone',
    zh: '❌ 设置时区失败'
  }
};
