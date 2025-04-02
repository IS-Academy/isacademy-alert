module.exports = {
  setLangSuccess: {
    ko: (lang) => `✅ 언어가 '${lang}'로 설정되었습니다.`,
    en: (lang) => `✅ Language has been set to '${lang}'.`,
    zh: (lang) => `✅ 语言已设置为 '${lang}'。`
  },
  setLangFail: {
    ko: '❌ 지원하지 않는 언어입니다. (ko/en/zh)',
    en: '❌ Unsupported language. Use ko/en/zh.',
    zh: '❌ 不支持的语言。请使用 ko/en/zh。'
  },
  setTzSuccess: {
    ko: (tz) => `✅ 시간대가 '${tz}'로 설정되었습니다.`,
    en: (tz) => `✅ Timezone set to '${tz}'.`,
    zh: (tz) => `✅ 时区已设置为 '${tz}'。`
  },
  setTzFail: {
    ko: '❌ 유효하지 않은 시간대입니다.',
    en: '❌ Invalid timezone.',
    zh: '❌ 无效的时区。'
  }
};
