// MessageTemplates.js

const moment = require('moment-timezone');
const config = require('./config');

function formatDate(ts, tz = config.DEFAULT_TIMEZONE) {
  const m = moment.unix(ts).tz(tz);
  const date = m.format('YY. MM. DD. (ddd)');
  const time = m.format('A hh:mm:ss');
  return { date, time };
}

function getTemplate({
  type,
  symbol,
  timeframe,
  price,
  ts,
  entryCount = 0,
  entryAvg = 'N/A',
  weight = config.DEFAULT_WEIGHT,
  leverage = config.DEFAULT_LEVERAGE,
  lang = 'ko'
}) {
  const { date, time } = formatDate(ts);

  const entryInfo = entryCount > 0 ? `📊 진입 ${entryCount}% / 평균가 ${entryAvg}` : '';
  const capTime = `🕒 포착시간:\n${date}\n${time}`;
  const disclaimer = `⚠️관점공유는 언제나【자율적 참여】\n⚠️모든 투자와 판단은 본인의 몫입니다.`;

  switch (type) {
    case 'showSup': return `#🩵롱 진입 📈 관점공유🩵\n\n📌 종목: ${symbol}\n⏱️ 타임프레임: ${timeframe}\n💲 가격: ${price}\n${entryInfo}\n\n${capTime}\n\n${disclaimer}`;
    case 'showRes': return `#❤️숏 진입 📉 관점공유❤️\n\n📌 종목: ${symbol}\n⏱️ 타임프레임: ${timeframe}\n💲 가격: ${price}\n${entryInfo}\n\n${capTime}\n\n${disclaimer}`;
    case 'isBigSup': return `#🚀강한 롱 진입 📈 관점공유🚀\n\n📌 종목: ${symbol}\n⏱️ 타임프레임: ${timeframe}\n💲 가격: ${price}\n${entryInfo}\n\n${capTime}\n\n${disclaimer}`;
    case 'isBigRes': return `#🛸강한 숏 진입 📉 관점공유🛸\n\n📌 종목: ${symbol}\n⏱️ 타임프레임: ${timeframe}\n💲 가격: ${price}\n${entryInfo}\n\n${capTime}\n\n${disclaimer}`;
    case 'exitLong': return `#💰롱 청산 📈 관점공유💰\n\n📌 종목: ${symbol}\n⏱️ 타임프레임: ${timeframe}\n💲 가격: ${price}\n${entryInfo}\n\n${capTime}\n\n${disclaimer}`;
    case 'exitShort': return `#💰숏 청산 📉 관점공유💰\n\n📌 종목: ${symbol}\n⏱️ 타임프레임: ${timeframe}\n💲 가격: ${price}\n\n${capTime}\n\n${disclaimer}`;
    case 'Ready_showSup': return `#🩵롱 대기 📉 ${timeframe}⏱️\n\n📌 종목: ${symbol}\n🗝️ 비중: ${weight} / 🎲 배율: ${leverage}`;
    case 'Ready_showRes': return `#❤️숏 대기 📉 ${timeframe}⏱️\n\n📌 종목: ${symbol}\n🗝️ 비중: ${weight} / 🎲 배율: ${leverage}`;
    case 'Ready_isBigSup': return `#🚀강한 롱 대기 📈 ${timeframe}⏱️\n\n📌 종목: ${symbol}\n🗝️ 비중: ${weight} / 🎲 배율: ${leverage}`;
    case 'Ready_isBigRes': return `#🛸강한 숏 대기 📉 ${timeframe}⏱️\n\n📌 종목: ${symbol}\n🗝️ 비중: ${weight} / 🎲 배율: ${leverage}`;
    case 'Ready_exitLong': return `#💲롱 청산 준비 📈 ${timeframe}⏱️\n\n📌 종목: ${symbol}\n🗝️ 비중: ${weight} / 🎲 배율: ${leverage}`;
    case 'Ready_exitShort': return `#💲숏 청산 준비 📉 ${timeframe}⏱️\n\n📌 종목: ${symbol}\n🗝️ 비중: ${weight} / 🎲 배율: ${leverage}`;
    default: return `⚠️알 수 없는 신호 타입입니다: ${type}`;
  }
}

module.exports = {
  getTemplate
};
