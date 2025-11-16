// frontend/src/utils/dashboardUtils.js
import { addDays, format, subDays } from "date-fns";
import { ACCOUNT_IDS, buildAccountsFromSettings, getCurrencySymbol } from "./accountUtils";

const HISTORY_DAYS = 30;
const MONTH_WINDOW_DAYS = 30;
const WEEK_WINDOW_DAYS = 7;

const toNumber = (value, fallback = null) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parseDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const normalizeTrade = (entry, accountsMap, fallbackAccountId) => {
  const metadata = entry.metadata || {};
  const accountId = metadata.accountId || fallbackAccountId;
  if (!accountId || !accountsMap.has(accountId)) return null;
  const account = accountsMap.get(accountId);
  const pnlAmount = toNumber(metadata.pnlAmount);
  if (pnlAmount === null) return null;
  const tradeDate = parseDate(metadata.date) || parseDate(entry.createdAt);
  if (!tradeDate) return null;

  const result = (metadata.result || "").toUpperCase();
  const symbol = metadata.symbol || metadata.title || "Trade";
  const direction = (metadata.direction || "").toUpperCase();

  return {
    id: entry.id,
    asset: symbol,
    accountId,
    accountName: metadata.accountName || account?.name || "Compte",
    amount: pnlAmount,
    currency: metadata.pnlCurrency || account?.currency,
    date: tradeDate,
    timestamp: tradeDate.getTime(),
    direction: direction || (pnlAmount >= 0 ? "BUY" : "SELL"),
    result: result || "N/A",
    pnlPercent: toNumber(metadata.pnlPercent),
    raw: entry,
  };
};

const buildPerformanceHistory = (trades, initialBalance = 0) => {
  const sorted = [...trades].sort((a, b) => a.timestamp - b.timestamp);
  const today = new Date();
  const startDate = subDays(today, HISTORY_DAYS - 1);
  let runningValue = initialBalance;
  let tradeIndex = 0;

  // Intégrer les trades antérieurs à la fenêtre pour partir de la bonne base
  while (tradeIndex < sorted.length && sorted[tradeIndex].date < startDate) {
    runningValue += sorted[tradeIndex].amount;
    tradeIndex += 1;
  }

  const history = [];
  for (let day = 0; day < HISTORY_DAYS; day += 1) {
    const currentDay = addDays(startDate, day);
    const endOfDay = new Date(currentDay);
    endOfDay.setHours(23, 59, 59, 999);

    while (
      tradeIndex < sorted.length &&
      sorted[tradeIndex].date <= endOfDay
    ) {
      runningValue += sorted[tradeIndex].amount;
      tradeIndex += 1;
    }

    history.push({
      date: format(currentDay, "dd MMM"),
      value: Math.round(runningValue * 100) / 100,
    });
  }

  return history;
};

const computeAccountMetrics = (account, trades, monthStart, weekStart) => {
  const accountTrades = trades.filter((trade) => trade.accountId === account.id);
  const realizedPnl = accountTrades.reduce((sum, trade) => sum + trade.amount, 0);
  const monthlyProfit = accountTrades.reduce(
    (sum, trade) => (trade.date >= monthStart ? sum + trade.amount : sum),
    0
  );
  const weeklyProfit = accountTrades.reduce(
    (sum, trade) => (trade.date >= weekStart ? sum + trade.amount : sum),
    0
  );

  return {
    ...account,
    realizedPnl,
    monthlyProfit,
    weeklyProfit,
    currentBalance: account.initialBalance + realizedPnl,
    gainPercent:
      account.initialBalance > 0
        ? (realizedPnl / account.initialBalance) * 100
        : 0,
    lastTrade:
      accountTrades.length > 0
        ? accountTrades[accountTrades.length - 1]
        : null,
    history: buildPerformanceHistory(accountTrades, account.initialBalance),
  };
};

export const buildDashboardData = (settings, entries) => {
  const accounts = buildAccountsFromSettings(settings);
  const accountsMap = new Map(accounts.map((acc) => [acc.id, acc]));
  const fallbackAccountId = accounts.length === 1 ? accounts[0].id : null;

  const tradesChronological = entries
    .filter((entry) => entry.type === "trade")
    .map((entry) => normalizeTrade(entry, accountsMap, fallbackAccountId))
    .filter(Boolean)
    .sort((a, b) => a.timestamp - b.timestamp);

  const tradesDescending = [...tradesChronological].reverse();
  const now = new Date();
  const monthStart = subDays(now, MONTH_WINDOW_DAYS);
  const weekStart = subDays(now, WEEK_WINDOW_DAYS);

  const metrics = accounts.map((account) =>
    computeAccountMetrics(account, tradesChronological, monthStart, weekStart)
  );
  const metricsMap = Object.fromEntries(
    metrics.map((account) => [account.id, account])
  );

  const totalInitial = metrics.reduce(
    (sum, account) => sum + account.initialBalance,
    0
  );
  const totalRealized = metrics.reduce(
    (sum, account) => sum + account.realizedPnl,
    0
  );
  const totalMonthly = metrics.reduce(
    (sum, account) => sum + account.monthlyProfit,
    0
  );
  const totalWeekly = metrics.reduce(
    (sum, account) => sum + account.weeklyProfit,
    0
  );

  const aggregateHistory = buildPerformanceHistory(
    tradesChronological,
    totalInitial
  );

  const aggregate = {
    id: ACCOUNT_IDS.ALL,
    name: settings.accountName || "Portefeuille global",
    currency: metrics[0]?.currency || accounts[0]?.currency || "EUR",
    color: "#0ea5e9",
    initialBalance: totalInitial,
    realizedPnl: totalRealized,
    monthlyProfit: totalMonthly,
    weeklyProfit: totalWeekly,
    currentBalance: totalInitial + totalRealized,
    gainPercent: totalInitial > 0 ? (totalRealized / totalInitial) * 100 : 0,
    lastTrade:
      tradesChronological.length > 0
        ? tradesChronological[tradesChronological.length - 1]
        : null,
    history: aggregateHistory,
  };

  return {
    accounts: metrics,
    accountsMap: metricsMap,
    aggregate,
    trades: tradesDescending,
  };
};

export const formatCurrencyValue = (value, currency) => {
  const amount = Number(value) || 0;
  const symbol = getCurrencySymbol(currency);
  return `${symbol}${Math.abs(amount).toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export const formatSignedCurrency = (value, currency) => {
  const amount = Number(value) || 0;
  const sign = amount >= 0 ? "+" : "-";
  return `${sign}${formatCurrencyValue(Math.abs(amount), currency)}`;
};
