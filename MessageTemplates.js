exitLong: `${symbols.exitLong}

${labels.symbol}: ${symbol}
${labels.timeframe}: ${timeframe}
${labels.price}: ${price}
📊 ${labels.entryInfo.replace('{entryCount}', entryCount).replace('{entryAvg}', entryAvg)}
${generatePnLLine(price, entryAvg, entryCount, lang)}

${capTime}

${disclaimer}`,