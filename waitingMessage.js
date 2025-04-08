function getWaitingMessage(signalType, symbol, timeframe, weight, leverage) {
  const tfStr = `${timeframe}⏱️`;
  const infoLine = `📌 종목: ${symbol}\n🗝️ 비중: ${weight} / 🎲 배율: ${leverage}`;

  let message = 'ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ\n';

  switch (signalType) {
    case 'strong_short':
      message += `#🛸강한 숏 대기 📉 ${tfStr}\n\n${infoLine}`;
      break;
    case 'strong_long':
      message += `#🚀강한 롱 대기 📈 ${tfStr}\n\n${infoLine}`;
      break;
    case 'short':
      message += `#❤️숏 대기 📉 ${tfStr}\n\n${infoLine}`;
      break;
    case 'long':
      message += `#🩵롱 대기 📈 ${tfStr}\n\n${infoLine}`;
      break;
    default:
      message += `#❓알 수 없는 신호 ${tfStr}\n\n${infoLine}`;
  }

  message += '\nㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ';
  return message;
}

module.exports = {
  getWaitingMessage
};
