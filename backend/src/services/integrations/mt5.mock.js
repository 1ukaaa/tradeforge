// backend/src/services/integrations/mt5.mock.js
const symbols = ["NAS100", "DAX", "XAUUSD", "EURUSD", "GBPUSD"];

const pseudoRandom = (seed) => {
  let hash = 0;
  const str = String(seed);
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const generateTrades = (accountId, baseTimestamp) => {
  const trades = [];
  for (let i = 0; i < 5; i += 1) {
    const symbol = symbols[(accountId + i) % symbols.length];
    const direction = i % 2 === 0 ? "BUY" : "SELL";
    const pnl = ((accountId % 3) - 1) * 150 + i * 120;
    const openedAt = new Date(baseTimestamp - i * 3600 * 1000 * 6);
    const closedAt = new Date(openedAt.getTime() + 3600 * 1000 * 2);
    trades.push({
      externalTradeId: `${accountId}-${openedAt.getTime()}`,
      symbol,
      direction,
      volume: 1 + (i % 3) * 0.5,
      entryPrice: 100 + i * 5,
      exitPrice: 100 + i * 5 + pnl / 100,
      pnl,
      pnlCurrency: "EUR",
      openedAt: openedAt.toISOString(),
      closedAt: closedAt.toISOString(),
      metadata: { comment: "Import MT5" },
    });
  }
  return trades;
};

const fetchMt5Data = async ({ login }) => {
  const base = pseudoRandom(login);
  const balance = 100000 + (base % 5000);
  const now = Date.now();
  return {
    account: {
      externalId: `MT5-${login}`,
      name: `MT5 #${login}`,
      currency: "EUR",
      initialBalance: 100000,
      currentBalance: balance,
    },
    trades: generateTrades(base, now),
  };
};

module.exports = {
  fetchMt5Data,
};

