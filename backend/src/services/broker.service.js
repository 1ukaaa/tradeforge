// backend/src/services/broker.service.js
const path = require("path");
const { spawn } = require("child_process");
const db = require("../core/database");
const { serializeMetadata, parseMetadata } = require("../core/utils");
const { encrypt, decrypt } = require("../core/crypto");
const { fetchMt5Data } = require("./integrations/mt5.mock");

const HISTORY_DAYS = 30;
const MONTH_WINDOW_DAYS = 30;
const WEEK_WINDOW_DAYS = 7;
const HYPERLIQUID_SCRIPT = path.resolve(__dirname, "../../scripts/hyperliquid_fetch.py");
const PYTHON_BIN = process.env.HYPERLIQUID_PYTHON || "python3";

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toTimestampMs = (value) => {
  if (value === null || value === undefined || value === "") return null;
  if (value instanceof Date) {
    const time = value.getTime();
    return Number.isNaN(time) ? null : time;
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const numeric = Number(trimmed);
    if (Number.isFinite(numeric)) return numeric;
    const parsed = Date.parse(trimmed);
    return Number.isNaN(parsed) ? null : parsed;
  }
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const toIsoTimestamp = (value) => {
  const ms = toTimestampMs(value);
  return typeof ms === "number" ? new Date(ms).toISOString() : null;
};

const fetchHyperliquidFromScript = (address, lastSyncAt) => {
  return new Promise((resolve, reject) => {
    if (!address) {
      return reject(new Error("Adresse HyperLiquid manquante."));
    }
    const args = [HYPERLIQUID_SCRIPT, "--address", address];
    if (lastSyncAt) {
      const sinceMs = Date.parse(lastSyncAt);
      if (!Number.isNaN(sinceMs)) {
        args.push("--since", String(sinceMs));
      }
    }
    const child = spawn(PYTHON_BIN, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", (error) => reject(error));
    child.on("close", (code) => {
      if (code !== 0) {
        return reject(new Error(stderr || `Script HyperLiquid terminé avec le code ${code}`));
      }
      try {
        const parsed = JSON.parse(stdout || "{}");
        resolve(parsed);
      } catch (error) {
        reject(new Error(`Réponse HyperLiquid invalide : ${error.message}`));
      }
    });
  });
};

const getBrokerAccounts = () => {
  const rows = db.prepare("SELECT * FROM broker_accounts").all();
  return rows.map((row) => ({
    ...row,
    initialBalance: toNumber(row.initialBalance),
    currentBalance: toNumber(row.currentBalance),
    metadata: parseMetadata(row.metadata),
  }));
};

const getBrokerAccountById = (id) => {
  const row = db.prepare("SELECT * FROM broker_accounts WHERE id = ?").get(id);
  if (!row) return null;
  return {
    ...row,
    initialBalance: toNumber(row.initialBalance),
    currentBalance: toNumber(row.currentBalance),
    metadata: parseMetadata(row.metadata),
  };
};

const getTradeCountForAccount = (accountId) => {
  const { count } = db
    .prepare("SELECT COUNT(*) as count FROM broker_trades WHERE brokerAccountId = ?")
    .get(accountId);
  return Number(count) || 0;
};

const accountHasTrades = (accountId) => getTradeCountForAccount(accountId) > 0;

const getIntegrationByAccountId = (accountId) => {
  const row = db.prepare("SELECT * FROM broker_integrations WHERE brokerAccountId = ?").get(accountId);
  if (!row) return null;
  return {
    ...row,
    metadata: parseMetadata(row.metadata),
  };
};

const getBrokerTrades = ({ accountId = null, limit = null, order = "desc", accountsMap = null } = {}) => {
  const clauses = [];
  const params = [];
  if (accountId) {
    clauses.push("brokerAccountId = ?");
    params.push(accountId);
  }

  const whereClause = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const orderBy = order === "asc" ? "ASC" : "DESC";
  const limitClause = limit ? `LIMIT ${Number(limit)}` : "";

  const query = `
    SELECT * FROM broker_trades
    ${whereClause}
    ORDER BY openedAt ${orderBy}
    ${limitClause}
  `;

  const rows = db.prepare(query).all(...params);
  const map =
    accountsMap || new Map(getBrokerAccounts().map((account) => [account.id, account]));

  return rows.map((row) => {
    const account = map.get(row.brokerAccountId);
    const openedAt = toIsoTimestamp(row.openedAt) || row.openedAt;
    const closedAt = toIsoTimestamp(row.closedAt) || row.closedAt;
    return {
      ...row,
      pnl: toNumber(row.pnl),
      volume: toNumber(row.volume),
      metadata: parseMetadata(row.metadata),
      accountName: account?.name,
      currency: row.pnlCurrency || account?.currency,
      openedAt,
      closedAt,
    };
  });
};

const normalizeDirectionInfo = (directionRaw = "") => {
  const direction = String(directionRaw || "").toUpperCase();
  const isOpen = direction.includes("OPEN");
  const isClose = direction.includes("CLOSE");
  const isLong = direction.includes("LONG");
  const isShort = direction.includes("SHORT");
  let side = null;
  if (isLong) side = "long";
  if (isShort) side = "short";
  return { direction, isOpen, isClose, side };
};

const aggregateTradesToPositions = (trades = []) => {
  const sorted = [...trades].sort((a, b) => {
    const aMs = toTimestampMs(a.openedAt || a.closedAt) || 0;
    const bMs = toTimestampMs(b.openedAt || b.closedAt) || 0;
    return aMs - bMs;
  });

  const openPositions = new Map();
  const positions = [];

  const finalizePosition = (key) => {
    const state = openPositions.get(key);
    if (!state || !state.hasActivity) return;
    const totalOpened = state.openVolume || state.closedVolume;
    const totalClosed = state.closedVolume;
    const status = totalClosed >= totalOpened - 1e-8 ? "closed" : "open";
    const entryPrice =
      state.entryNotional && totalOpened
        ? state.entryNotional / totalOpened
        : null;
    const exitPrice =
      state.exitNotional && totalClosed
        ? state.exitNotional / totalClosed
        : null;

    positions.push({
      id: state.fills[0] || `${state.brokerAccountId || "acc"}-${state.symbol}-${state.openedAtMs || Date.now()}`,
      brokerAccountId: state.brokerAccountId,
      accountName: state.accountName,
      symbol: state.symbol,
      direction: state.side === "short" ? "SHORT" : "LONG",
      pnl: state.pnl,
      currency: state.currency,
      volume: totalClosed || totalOpened || null,
      entryPrice,
      exitPrice,
      openedAt: state.openedAtMs ? new Date(state.openedAtMs).toISOString() : null,
      closedAt: state.closedAtMs ? new Date(state.closedAtMs).toISOString() : null,
      status,
      fillsCount: state.fills.length,
      fillIds: state.fills,
    });

    openPositions.delete(key);
  };

  sorted.forEach((trade) => {
    const info = normalizeDirectionInfo(trade.direction);
    if (!info.side) {
      return;
    }
    const key = `${trade.brokerAccountId || "unknown"}-${trade.symbol || "asset"}-${info.side}`;
    let state = openPositions.get(key);
    if (!state) {
      state = {
        brokerAccountId: trade.brokerAccountId,
        accountName: trade.accountName,
        symbol: trade.symbol || "Trade",
        side: info.side,
        openVolume: 0,
        closedVolume: 0,
        entryNotional: 0,
        exitNotional: 0,
        pnl: 0,
        currency: trade.currency,
        openedAtMs: null,
        closedAtMs: null,
        fills: [],
        hasActivity: false,
      };
      openPositions.set(key, state);
    }

    const volume = toNumber(trade.volume, 0);
    const price = toNumber(trade.entryPrice);
    const timestamp = toTimestampMs(trade.closedAt || trade.openedAt);
    const pnl = toNumber(trade.pnl, 0);

    state.accountName = state.accountName || trade.accountName;
    state.currency = state.currency || trade.currency;

    if (info.isOpen || (!info.isClose && !info.isOpen)) {
      state.openVolume += volume;
      if (Number.isFinite(price)) {
        state.entryNotional += volume * price;
      }
      if (!state.openedAtMs || (timestamp && timestamp < state.openedAtMs)) {
        state.openedAtMs = timestamp || state.openedAtMs;
      }
    }

    if (info.isClose || (!info.isClose && !info.isOpen)) {
      state.closedVolume += volume;
      if (Number.isFinite(price)) {
        state.exitNotional += volume * price;
      }
      if (Number.isFinite(pnl)) {
        state.pnl += pnl;
      }
      if (timestamp) {
        state.closedAtMs = timestamp;
      }
    }

    state.fills.push(trade.id);
    state.hasActivity = true;

    const totalOpened = state.openVolume;
    if (info.isClose && totalOpened > 0 && state.closedVolume >= totalOpened - 1e-8) {
      finalizePosition(key);
    }
  });

  // Inclure les positions partiellement ouvertes
  Array.from(openPositions.keys()).forEach((key) => {
    finalizePosition(key);
  });

  return positions.sort((a, b) => {
    const aMs = toTimestampMs(a.closedAt || a.openedAt) || 0;
    const bMs = toTimestampMs(b.closedAt || b.openedAt) || 0;
    return bMs - aMs;
  });
};

const sortByTimestamp = (items, { order = "desc", getter }) => {
  const sorted = [...items].sort((a, b) => {
    const aMs = toTimestampMs(getter(a)) || 0;
    const bMs = toTimestampMs(getter(b)) || 0;
    return order === "asc" ? aMs - bMs : bMs - aMs;
  });
  return sorted;
};

const getBrokerPositions = ({ accountId = null, order = "desc" } = {}) => {
  const accounts = getBrokerAccounts();
  const accountsMap = new Map(accounts.map((account) => [account.id, account]));
  const tradesAsc = getBrokerTrades({ accountId, order: "asc", accountsMap });
  const positions = aggregateTradesToPositions(tradesAsc)
    .filter((position) => position.status === "closed")
    .map((position) => {
      const account = accountsMap.get(position.brokerAccountId);
      return {
        ...position,
        accountName: position.accountName || account?.name,
        currency: position.currency || account?.currency,
        asset: position.symbol,
        accountId: position.brokerAccountId,
        date: position.closedAt || position.openedAt,
      };
    });

  return sortByTimestamp(positions, {
    order,
    getter: (item) => item.closedAt || item.openedAt,
  });
};

const buildTradesForSummary = (positionsDesc) =>
  positionsDesc.map((position) => {
    const rawDirection = String(position.direction || "").toUpperCase();
    let direction = rawDirection;
    if (rawDirection === "SHORT") direction = "SELL";
    if (rawDirection === "LONG") direction = "BUY";
    if (!direction) {
      direction = position.side === "short" ? "SELL" : "BUY";
    }
    return {
      ...position,
      asset: position.asset || position.symbol,
      direction,
      currency: position.currency,
      brokerAccountId: position.brokerAccountId,
      date: position.date || position.closedAt || position.openedAt,
    };
  });

const getDashboardSummary = () => {
  const accounts = getBrokerAccounts();
  if (!accounts.length) {
    return {
      accounts: [],
      aggregate: null,
      trades: [],
    };
  }

  const positionsAsc = getBrokerPositions({ order: "asc" });
  const positionsDesc = [...positionsAsc].reverse();
  const enrichedAccounts = accounts.map((account) =>
    computeAccountMetrics(account, positionsAsc)
  );

  const totalInitial = enrichedAccounts.reduce((sum, account) => sum + account.initialBalance, 0);
  const totalRealized = enrichedAccounts.reduce((sum, account) => sum + account.realizedPnl, 0);
  const totalMonthly = enrichedAccounts.reduce((sum, account) => sum + account.monthlyProfit, 0);
  const totalWeekly = enrichedAccounts.reduce((sum, account) => sum + account.weeklyProfit, 0);

  const aggregateHistory = buildPerformanceHistory(positionsAsc, totalInitial);

  const aggregate = {
    id: "all-accounts",
    name: "Tous les comptes",
    currency: enrichedAccounts[0]?.currency || "EUR",
    initialBalance: totalInitial,
    realizedPnl: totalRealized,
    monthlyProfit: totalMonthly,
    weeklyProfit: totalWeekly,
    currentBalance: totalInitial + totalRealized,
    gainPercent: totalInitial ? (totalRealized / totalInitial) * 100 : 0,
    lastTrade: positionsDesc[0] || null,
    history: aggregateHistory,
    color: "#0ea5e9",
  };

  return {
    accounts: enrichedAccounts,
    aggregate,
    trades: buildTradesForSummary(positionsDesc),
  };
};

const upsertBrokerAccount = (account) => {
  const timestamp = new Date().toISOString();
  const stmt = db.prepare(`
    INSERT INTO broker_accounts
    (externalId, name, provider, type, currency, color, initialBalance, currentBalance, status, lastSyncAt, metadata, createdAt, updatedAt)
    VALUES (@externalId, @name, @provider, @type, @currency, @color, @initialBalance, @currentBalance, @status, @lastSyncAt, @metadata, @createdAt, @updatedAt)
    ON CONFLICT(externalId) DO UPDATE SET
      name=excluded.name,
      provider=excluded.provider,
      type=excluded.type,
      currency=excluded.currency,
      color=excluded.color,
      initialBalance=excluded.initialBalance,
      currentBalance=excluded.currentBalance,
      status=excluded.status,
      lastSyncAt=excluded.lastSyncAt,
      metadata=excluded.metadata,
      updatedAt=excluded.updatedAt
  `);

  const payload = {
    externalId: account.externalId,
    name: account.name,
    provider: account.provider,
    type: account.type,
    currency: account.currency,
    color: account.color,
    initialBalance: toNumber(account.initialBalance),
    currentBalance: toNumber(account.currentBalance ?? account.initialBalance),
    status: account.status || "connected",
    lastSyncAt: account.lastSyncAt || null,
    metadata: serializeMetadata(account.metadata || {}),
    createdAt: account.createdAt || timestamp,
    updatedAt: timestamp,
  };

  stmt.run(payload);
  return getBrokerAccounts().find((acc) => acc.externalId === account.externalId);
};

const bulkUpsertBrokerTrades = (accountId, trades = []) => {
  const beforeCount = getTradeCountForAccount(accountId);
  const stmt = db.prepare(`
    INSERT INTO broker_trades
    (brokerAccountId, externalTradeId, symbol, direction, volume, entryPrice, exitPrice, pnl, pnlCurrency, openedAt, closedAt, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(brokerAccountId, externalTradeId) DO UPDATE SET
      symbol=excluded.symbol,
      direction=excluded.direction,
      volume=excluded.volume,
      entryPrice=excluded.entryPrice,
      exitPrice=excluded.exitPrice,
      pnl=excluded.pnl,
      pnlCurrency=excluded.pnlCurrency,
      openedAt=excluded.openedAt,
      closedAt=excluded.closedAt,
      metadata=excluded.metadata
  `);

  const insert = db.transaction((items) => {
    items.forEach((trade) => {
      const openedAt = toIsoTimestamp(trade.openedAt);
      const closedAt = toIsoTimestamp(trade.closedAt);
      const metadata = {
        ...(trade.metadata || {}),
      };
      if (trade.raw && !metadata.raw) {
        metadata.raw = trade.raw;
      }
      stmt.run(
        accountId,
        trade.externalTradeId || null,
        trade.symbol,
        trade.direction,
        toNumber(trade.volume),
        toNumber(trade.entryPrice),
        toNumber(trade.exitPrice),
        toNumber(trade.pnl),
        trade.pnlCurrency,
        openedAt,
        closedAt,
        serializeMetadata(metadata)
      );
    });
  });

  insert(trades);
  const afterCount = getTradeCountForAccount(accountId);
  return Math.max(afterCount - beforeCount, 0);
};

const saveIntegration = (accountId, { type, status, credentials, metadata, lastSyncAt, error }) => {
  const timestamp = new Date().toISOString();
  const existing = getIntegrationByAccountId(accountId);
  const stmt = db.prepare(`
    INSERT INTO broker_integrations
    (brokerAccountId, type, status, credentials, metadata, lastSyncAt, error, createdAt, updatedAt)
    VALUES (@brokerAccountId, @type, @status, @credentials, @metadata, @lastSyncAt, @error, @createdAt, @updatedAt)
    ON CONFLICT(brokerAccountId) DO UPDATE SET
      type=excluded.type,
      status=excluded.status,
      credentials=excluded.credentials,
      metadata=excluded.metadata,
      lastSyncAt=excluded.lastSyncAt,
      error=excluded.error,
      updatedAt=excluded.updatedAt
  `);

  stmt.run({
    brokerAccountId: accountId,
    type,
    status: status || "connected",
    credentials: credentials || null,
    metadata: serializeMetadata(metadata || {}),
    lastSyncAt: lastSyncAt || null,
    error: error || null,
    createdAt: existing?.createdAt || timestamp,
    updatedAt: timestamp,
  });

  return getIntegrationByAccountId(accountId);
};

const createMt5Account = ({
  name,
  currency,
  color,
  initialBalance,
  login,
  password,
  server,
}) => {
  if (!login || !password || !server) {
    throw new Error("Identifiants MT5 incomplets.");
  }
  const timestamp = new Date().toISOString();
  const externalId = `mt5-${login}`;
  const insertStmt = db.prepare(`
    INSERT INTO broker_accounts
    (externalId, name, provider, type, currency, color, initialBalance, currentBalance, status, lastSyncAt, metadata, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const info = insertStmt.run(
    externalId,
    name || `MT5 #${login}`,
    "mt5",
    "forex",
    currency || "EUR",
    color || "#6366f1",
    toNumber(initialBalance) || 0,
    toNumber(initialBalance) || 0,
    "connected",
    null,
    serializeMetadata({}),
    timestamp,
    timestamp
  );

  const credentialsPayload = encrypt(
    JSON.stringify({ login, password, server })
  );

  saveIntegration(info.lastInsertRowid, {
    type: "mt5",
    status: "connected",
    credentials: credentialsPayload,
    metadata: { server },
  });

  return getBrokerAccountById(info.lastInsertRowid);
};

const createHyperliquidAccount = ({
  name,
  currency,
  color,
  initialBalance,
  address,
}) => {
  if (!address) {
    throw new Error("Adresse HyperLiquid requise.");
  }
  const timestamp = new Date().toISOString();
  const externalId = `hyper-${address}`;
  const insertStmt = db.prepare(`
    INSERT INTO broker_accounts
    (externalId, name, provider, type, currency, color, initialBalance, currentBalance, status, lastSyncAt, metadata, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const info = insertStmt.run(
    externalId,
    name || `HyperLiquid ${address.substring(0, 6)}...`,
    "hyperliquid",
    "crypto",
    currency || "USDT",
    color || "#8b5cf6",
    toNumber(initialBalance) || 0,
    toNumber(initialBalance) || 0,
    "connected",
    null,
    serializeMetadata({}),
    timestamp,
    timestamp
  );

  saveIntegration(info.lastInsertRowid, {
    type: "hyperliquid",
    status: "connected",
    credentials: null,
    metadata: { address },
  });

  return getBrokerAccountById(info.lastInsertRowid);
};

const syncBrokerAccount = async (accountId) => {
  const account = getBrokerAccountById(accountId);
  if (!account) {
    throw new Error("Compte introuvable.");
  }
  const integration = getIntegrationByAccountId(accountId);
  if (!integration) {
    throw new Error("Aucune intégration trouvée pour ce compte.");
  }

  try {
    let result;
    if (integration.type === "mt5") {
      const credentialsRaw = integration.credentials ? decrypt(integration.credentials) : null;
      if (!credentialsRaw) {
        throw new Error("Aucun identifiant MT5 enregistré.");
      }
      const credentials = JSON.parse(credentialsRaw);
      result = await fetchMt5Data(credentials);
    } else if (integration.type === "hyperliquid") {
      const address = integration.metadata?.address;
      if (!address) {
        throw new Error("Adresse HyperLiquid introuvable.");
      }
      const hasTrades = accountHasTrades(accountId);
      const lastSync = hasTrades ? integration.lastSyncAt : null;
      result = await fetchHyperliquidFromScript(address, lastSync);
      if ((!result.trades || result.trades.length === 0) && lastSync) {
        result = await fetchHyperliquidFromScript(address, null);
      }
    } else {
      throw new Error("Type d'intégration non supporté.");
    }

    const trades = result.trades || [];
    const insertedTrades = bulkUpsertBrokerTrades(accountId, trades);
    const timestamp = new Date().toISOString();
    const newBalance = toNumber(result.account?.currentBalance) || account.currentBalance;
    const latestTradeIso = getLatestTradeTimestamp(trades, integration.lastSyncAt);
    db.prepare(`
      UPDATE broker_accounts
      SET currentBalance = ?, lastSyncAt = ?, status = ?, updatedAt = ?
      WHERE id = ?
    `).run(newBalance, latestTradeIso || timestamp, "synced", timestamp, accountId);

    const tradesCount = insertedTrades;
    const retrievedCount = trades.length;

    saveIntegration(accountId, {
      type: integration.type,
      status: "synced",
      credentials: integration.credentials,
      metadata: integration.metadata,
      lastSyncAt: latestTradeIso || timestamp,
    });

    return { account: getBrokerAccountById(accountId), tradesCount, retrievedCount };
  } catch (error) {
    saveIntegration(accountId, {
      type: integration.type,
      status: "error",
      credentials: integration.credentials,
      metadata: integration.metadata,
      lastSyncAt: integration.lastSyncAt,
      error: error.message,
    });
    throw error;
  }
};

const buildPerformanceHistory = (trades, initialBalance) => {
  const sorted = [...trades].sort((a, b) => new Date(a.openedAt) - new Date(b.openedAt));
  const today = new Date();
  const startDate = new Date(today.getTime() - (HISTORY_DAYS - 1) * 24 * 60 * 60 * 1000);
  let runningValue = initialBalance;
  const applied = new Set();

  sorted.forEach((trade) => {
    if (new Date(trade.closedAt || trade.openedAt) < startDate) {
      runningValue += trade.pnl;
      applied.add(trade.id || trade.externalTradeId || `${trade.brokerAccountId}-${trade.openedAt}`);
    }
  });

  const history = [];
  for (let day = 0; day < HISTORY_DAYS; day += 1) {
    const currentDay = new Date(startDate.getTime() + day * 24 * 60 * 60 * 1000);
    const endOfDay = new Date(currentDay);
    endOfDay.setHours(23, 59, 59, 999);

    sorted.forEach((trade) => {
      const closeDate = new Date(trade.closedAt || trade.openedAt);
      const tradeKey = trade.id || trade.externalTradeId || `${trade.brokerAccountId}-${trade.openedAt}`;
      if (!applied.has(tradeKey) && closeDate <= endOfDay) {
        runningValue += trade.pnl;
        applied.add(tradeKey);
      }
    });

    history.push({
      date: currentDay.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }),
      value: Math.round(runningValue * 100) / 100,
    });
  }

  return history;
};

const computeAccountMetrics = (account, trades) => {
  const accountTrades = trades.filter((trade) => trade.brokerAccountId === account.id);
  const initialBalance = toNumber(account.initialBalance);
  const realizedPnl = accountTrades.reduce((sum, trade) => sum + trade.pnl, 0);
  const now = Date.now();
  const monthStart = now - MONTH_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  const weekStart = now - WEEK_WINDOW_DAYS * 24 * 60 * 60 * 1000;

  const monthlyProfit = accountTrades.reduce((sum, trade) => {
    const closeDate = new Date(trade.closedAt || trade.openedAt).getTime();
    return closeDate >= monthStart ? sum + trade.pnl : sum;
  }, 0);

  const weeklyProfit = accountTrades.reduce((sum, trade) => {
    const closeDate = new Date(trade.closedAt || trade.openedAt).getTime();
    return closeDate >= weekStart ? sum + trade.pnl : sum;
  }, 0);

  return {
    ...account,
    realizedPnl,
    monthlyProfit,
    weeklyProfit,
    currentBalance: initialBalance + realizedPnl,
    gainPercent: initialBalance ? (realizedPnl / initialBalance) * 100 : 0,
    lastTrade: accountTrades.slice().sort((a, b) => new Date(b.openedAt) - new Date(a.openedAt))[0] || null,
    history: buildPerformanceHistory(accountTrades, initialBalance),
  };
};

const getLatestTradeTimestamp = (trades, fallbackIso) => {
  const fallbackMs = toTimestampMs(fallbackIso);
  const latest = trades.reduce((max, trade) => {
    const candidateMs = toTimestampMs(trade?.closedAt || trade?.openedAt);
    if (!candidateMs) return max;
    return candidateMs > max ? candidateMs : max;
  }, fallbackMs || 0);
  return latest > 0 ? new Date(latest).toISOString() : fallbackIso;
};

module.exports = {
  getBrokerAccounts,
  getBrokerAccountById,
  getBrokerTrades,
  getBrokerPositions,
  upsertBrokerAccount,
  bulkUpsertBrokerTrades,
  createMt5Account,
  createHyperliquidAccount,
  syncBrokerAccount,
  getDashboardSummary,
};
