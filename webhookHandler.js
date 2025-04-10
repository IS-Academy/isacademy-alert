const { addEntry, clearEntries, getEntryInfo } = require('./entryManager');

if (["showSup", "isBigSup", "showRes", "isBigRes"].includes(type)) {
  addEntry(symbol, type, price, timeframe);
}
if (["exitLong", "exitShort"].includes(type)) {
  clearEntries(symbol, type, timeframe);
}

const { entryCount, entryAvg } = getEntryInfo(symbol, type, timeframe);