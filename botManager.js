// ✅👇 botManager.js (최종 리팩토링 + 필수 기능 복원)

const axios = require('axios');
const config = require('./config');

// ✅ 관리자 인라인 키보드 패널 (기존 유지)
const inlineKeyboard = {
  inline_keyboard: [
    [{ text: '👨‍💼 최실장', callback_data: 'choi_toggle' }, { text: '👩‍💼 밍밍', callback_data: 'ming_toggle' }],
    [{ text: '🌐 언어선택', callback_data: 'lang_menu' }],
    [{ text: '📡 상태 확인', callback_data: 'status' }, { text: '🔁 더미 상태', callback_data: 'dummy_status' }],
    [{ text: '🧪 템플릿 테스트', callback_data: 'test_menu' }],
    [{ text: '📊 종목 ON/OFF 관리', callback_data: 'symbol_toggle_menu' }]
  ]
};

// ✅ 언어 선택 하위 메뉴
function getLangMenuKeyboard() {
  return {
    inline_keyboard: [
      [{ text: '🌐 최실장 언어', callback_data: 'lang_choi' }, { text: '🌐 밍밍 언어', callback_data: 'lang_ming' }],
      [{ text: '🔙 돌아가기', callback_data: 'back_main' }]
    ]
  };
}

// 🌐 언어 선택 키보드 (최실장 or 밍밍)
function getLangKeyboard(bot) {
  return {
    inline_keyboard: [[
      { text: '🇰🇷 한국어', callback_data: `lang_${bot}_ko` },
      { text: '🇺🇸 English', callback_data: `lang_${bot}_en` },
      { text: '🇨🇳 中文', callback_data: `lang_${bot}_zh` },
      { text: '🇯🇵 日本語', callback_data: `lang_${bot}_jp` }
    ], [{ text: '🔙 돌아가기', callback_data: 'lang_menu' }]]
  };
}

// ✅ 사용자 토글 메뉴 (ON/OFF)
function getUserToggleKeyboard(target) {
  return {
    inline_keyboard: [[
      { text: '▶️ 켜기', callback_data: `${target}_on` },
      { text: '⏹️ 끄기', callback_data: `${target}_off` }
    ], [{ text: '🔙 돌아가기', callback_data: 'back_main' }]]
  };
}

// ✅ 종목 ON/OFF 전환용 인라인 키보드 생성
function getSymbolToggleKeyboard() {
  const symbols = require('./trader-gate/symbols');
  const buttons = Object.entries(symbols).map(([symbol, info]) => {
    return [{
      text: `${info.enabled ? '✅' : '❌'} ${symbol.toUpperCase()}`,
      callback_data: `toggle_symbol_${symbol}`
    }];
  });
  buttons.push([{ text: '🔙 돌아가기', callback_data: 'back_main' }]);
  return { inline_keyboard: buttons };
}

// ✅ 템플릿 테스트용 인라인 키보드
function getTemplateTestKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: '💰롱 청산📈', callback_data: 'test_template_exitLong' },
        { text: '💰숏 청산📉', callback_data: 'test_template_exitShort' }
      ],
      [
        { text: '💲롱 청산 준비📈', callback_data: 'test_template_Ready_exitLong' },
        { text: '💲숏 청산 준비📉', callback_data: 'test_template_Ready_exitShort' }
      ],
      [
        { text: '🚀강한 롱 진입📈', callback_data: 'test_template_isBigSup' },
        { text: '🛸강한 숏 진입📉', callback_data: 'test_template_isBigRes' }
      ],
      [
        { text: '🩵롱 진입📈', callback_data: 'test_template_showSup' },
        { text: '❤️숏 진입📉', callback_data: 'test_template_showRes' }
      ],
      [
        { text: '🚀강한 롱 대기📈', callback_data: 'test_template_Ready_isBigSup' },
        { text: '🛸강한 숏 대기📉', callback_data: 'test_template_Ready_isBigRes' }
      ],
      [
        { text: '🩵롱 대기📈', callback_data: 'test_template_Ready_showSup' },
        { text: '❤️숏 대기📉', callback_data: 'test_template_Ready_showRes' }
      ]
    ]
  };
}

// ✅ 메시지 전송
async function sendTextToBot(botType, chatId, text, replyMarkup = null, options = {}) {
  const token = botType === 'choi' ? config.TELEGRAM_BOT_TOKEN :
                botType === 'ming' ? config.TELEGRAM_BOT_TOKEN_A :
                config.ADMIN_BOT_TOKEN;

  return axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
    chat_id: chatId,
    text,
    parse_mode: options.parse_mode || 'HTML',
    reply_markup: replyMarkup || undefined
  });
}

// ✅ 메시지 수정
async function editMessage(botType, chatId, messageId, text, replyMarkup = null, options = {}) {
  const token = config.ADMIN_BOT_TOKEN;

  return axios.post(`https://api.telegram.org/bot${token}/editMessageText`, {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: options.parse_mode || 'HTML',
    reply_markup: replyMarkup || inlineKeyboard
  });
}

// ✅ export 모듈
module.exports = {
  editMessage,
  inlineKeyboard,
  getLangKeyboard,
  getLangMenuKeyboard,
  getUserToggleKeyboard,
  getSymbolToggleKeyboard,
  getTemplateTestKeyboard,
  sendTextToBot
};
