// ✅👇 entryManager.js

const entries = { long: {}, short: {} };

const LONG_TYPES = ['showSup', 'isBigSup'];
const SHORT_TYPES = ['showRes', 'isBigRes'];
const EXIT_LONG = 'exitLong';
const EXIT_SHORT = 'exitShort';

function getDirection(type) {
  if (LONG_TYPES.includes(type) || type === EXIT_LONG) return 'long';
  if (SHORT_TYPES.includes(type) || type === EXIT_SHORT) return 'short';
  return null;
}

function addEntry(symbol, type, price, timeframe = 'default') {
  const direction = getDirection(type);
  if (!direction) return;

  entries[direction][symbol] = entries[direction][symbol] || {};
  entries[direction][symbol][timeframe] = entries[direction][symbol][timeframe] || [];
  entries[direction][symbol][timeframe].push(parseFloat(price));
}

function clearEntries(symbol, type, timeframe = 'default') {
  const direction = getDirection(type);
  if (!direction) return;

  if (entries[direction][symbol]) entries[direction][symbol][timeframe] = [];
}

function getEntryInfo(symbol, type, timeframe = 'default') {
  const direction = getDirection(type);
  if (!direction) return { entryCount: 0, entryAvg: 'N/A' };

  const list = entries[direction][symbol]?.[timeframe] || [];
  const avg = list.length ? list.reduce((a, b) => a + b, 0) / list.length : 0;
  return { entryCount: list.length, entryAvg: avg.toFixed(2) };
}

module.exports = { addEntry, clearEntries, getEntryInfo };
