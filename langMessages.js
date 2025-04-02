// langMessages.js
module.exports = {
  setLangSuccess: {
    ko: (code) => `✅ 언어가 <b>${code}</b>(으)로 설정되었습니다.`,
    en: (code) => `✅ Language set to <b>${code}</b>.`,
    zh: (code) => `✅ 言語已設置為 <b>${code}</b>`,
    ja: (code) => `✅ 言語が <b>${code}</b> に設定されました。`
  },
  setLangFail: {
    ko: '❌ 지원하지 않는 언어입니다. (ko, en, zh 중 선택)',
    en: '❌ Unsupported language. Choose from ko, en, zh.',
    zh: '❌ 不支援的語言。請選擇 ko, en, zh',
    ja: '❌ サポートされていない言語です。ko, en, zh, ja のいずれかを選択してください。'
  },
  setTzSuccess: {
    ko: (tz) => `✅ 시간대가 <b>${tz}</b>로 설정되었습니다.`,
    en: (tz) => `✅ Timezone set to <b>${tz}</b>.`,
    zh: (tz) => `✅ 時區已設為 <b>${tz}</b>`,
    ja: (tz) => `✅ タイムゾーンが <b>${tz}</b> に設定されました。`
  },
  setTzFail: {
    ko: '❌ 시간대 설정에 실패했습니다.',
    en: '❌ Failed to set timezone.',
    zh: '❌ 無法設置時區',
    ja: '❌ タイムゾーンの設定に失敗しました。'
  }
};
