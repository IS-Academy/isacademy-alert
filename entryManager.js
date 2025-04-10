// ✅👇 entryManager.js
const entries = { long: {}, short: {} };

function addEntry(symbol, type, price, timeframe = 'default') {
  const direction = ['showSup', 'isBigSup'].includes(type) ? 'long' : 'short';
  entries[direction][symbol] = entries[direction][symbol] || {};
  entries[direction][symbol][timeframe] = entries[direction][symbol][timeframe] || [];
  entries[direction][symbol][timeframe].push(parseFloat(price));
}

function clearEntries(symbol, type, timeframe = 'default') {
  const direction = ['exitLong'].includes(type) ? 'long' : 'short';
  if (entries[direction][symbol]) entries[direction][symbol][timeframe] = [];
}

function getEntryInfo(symbol, type, timeframe = 'default') {
  const direction = ['showSup', 'isBigSup', 'exitLong'].includes(type) ? 'long' : 'short';
  const list = entries[direction][symbol]?.[timeframe] || [];
  const avg = list.length ? list.reduce((a, b) => a + b) / list.length : 0;
  return { entryCount: list.length, entryAvg: avg.toFixed(2) };
}

module.exports = { addEntry, clearEntries, getEntryInfo };
