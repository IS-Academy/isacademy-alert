// ✅👇 langMessages.js

const DISPLAY_LANG = {
  ko: '한국어',
  en: 'English',
  zh: '中文',
  ja: '日本語'
};

function getDisplayLang(lang) {
  return DISPLAY_LANG[lang] || lang;
}

module.exports = {
  setLangSuccess: {
    ko: (lang) => `✅ 언어가 <b>${getDisplayLang(lang)}</b>로 설정되었습니다.`,
    en: (lang) => `✅ Language set to <b>${getDisplayLang(lang)}</b>.`,
    zh: (lang) => `✅ 语言已设置为 <b>${getDisplayLang(lang)}</b>。`,
    ja: (lang) => `✅ 言語が <b>${getDisplayLang(lang)}</b> に設定されました。`
  },

  setLangFail: {
    ko: () => `❌ 언어 설정 실패. (ko, en, zh, ja 중 하나여야 합니다)`,
    en: () => `❌ Failed to set language. Use one of: ko, en, zh, ja.`,
    zh: () => `❌ 语言设置失败，请使用 ko, en, zh, ja 之一。`,
    ja: () => `❌ 言語の設定に失敗しました。ko, en, zh, ja のいずれかを使用してください。`
  },

  setTzSuccess: {
    ko: (tz) => `✅ 시간대가 <b>${tz}</b>로 설정되었습니다.`,
    en: (tz) => `✅ Timezone set to <b>${tz}</b>.`,
    zh: (tz) => `✅ 时区已设置为 <b>${tz}</b>。`,
    ja: (tz) => `✅ タイムゾーンが <b>${tz}</b> に設定されました。`
  },

  setTzFail: {
    ko: () => `❌ 시간대 설정 실패. Asia/Seoul 형식으로 입력해주세요.`,
    en: () => `❌ Failed to set timezone. Use format like Asia/Seoul.`,
    zh: () => `❌ 时区设置失败，请使用 Asia/Seoul 这样的格式。`,
    ja: () => `❌ タイムゾーンの設定に失敗しました。Asia/Seoul の形式で入力してください。`
  }
};
