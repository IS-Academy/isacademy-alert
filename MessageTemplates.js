module.exports.getTemplate = ({ type, symbol, timeframe, price, ts, entryCount, entryAvg, lang }) => {
  return `${type}\nSymbol: ${symbol}\nTimeframe: ${timeframe}\nPrice: ${price}\nEntry: ${entryCount}% / Avg: ${entryAvg}`;
};