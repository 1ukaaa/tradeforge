const db = require("../core/database");
const YahooFinance = require("yahoo-finance2").default;
const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey', 'ripHistorical'] });

async function getAllInvestments() {
    const result = await db.execute("SELECT * FROM investments");
    return result.rows || [];
}

async function addInvestment(data) {
    const { ticker, quantity, average_price, buy_date, currency } = data;
    const result = await db.execute({
        sql: `INSERT INTO investments (ticker, quantity, average_price, buy_date, currency)
          VALUES (?, ?, ?, ?, ?)`,
        args: [ticker, quantity, average_price, buy_date || null, currency || 'USD']
    });
    return { id: result.lastInsertRowid.toString() };
}

async function updateInvestment(id, data) {
    const { quantity, average_price, buy_date } = data;
    await db.execute({
        sql: `UPDATE investments
          SET quantity = ?, average_price = ?, buy_date = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?`,
        args: [quantity, average_price, buy_date || null, id]
    });
    return { success: true };
}

async function deleteInvestment(id) {
    await db.execute({
        sql: "DELETE FROM investments WHERE id = ?",
        args: [id]
    });
    return { success: true };
}

// ─── Helper: fetch EUR/USD rate (with cache) ──────────────────────
async function getEurToUsdRate() {
    if (!global.quoteCache) global.quoteCache = {};
    const rateKey = 'EURUSD=X';
    const nowTime = Date.now();
    const CACHE_LIFETIME = 5 * 60 * 1000;

    let rateData;
    if (global.quoteCache[rateKey] && nowTime - global.quoteCache[rateKey].time < CACHE_LIFETIME) {
        rateData = global.quoteCache[rateKey].data;
    } else {
        rateData = await yahooFinance.quote(rateKey).catch(() => ({}));
        if (rateData && rateData.regularMarketPrice) {
            global.quoteCache[rateKey] = { time: nowTime, data: rateData };
        }
    }
    return (rateData && rateData.regularMarketPrice) ? rateData.regularMarketPrice : 1.05;
}

// ─── Helper: convert a price to EUR ──────────────────────────────
// quoteCurrency = native currency of the price (e.g. 'USD', 'EUR', 'GBp')
function toEur(price, quoteCurrency, eurToUsdRate) {
    if (!price) return 0;
    const cur = (quoteCurrency || 'USD').toUpperCase();
    if (cur === 'EUR') return price;
    if (cur === 'USD') return price / eurToUsdRate;
    // GBp (pence) → GBP → EUR. Approximate via USD as intermediary using 1.25 GBP/USD
    if (cur === 'GBP' || cur === 'GBP') return (price * 1.25) / eurToUsdRate;
    if (cur === 'GBP' || cur === 'GBP') return (price * 1.25) / eurToUsdRate;
    // GBp (pence) is 1/100th of GBP
    if (cur === 'GBP' || quoteCurrency === 'GBp') return (price / 100 * 1.25) / eurToUsdRate;
    // Fallback: assume USD
    return price / eurToUsdRate;
}

async function getPortfolioChartData(rawPeriod = '1y') {
    const allInvestments = await getAllInvestments();
    // Only active (qty > 0) investments for chart/valuation; all for transaction-based cost calculation
    const investments = allInvestments.filter(inv => inv.quantity > 0);
    if (allInvestments.length === 0) {
        return { investments: allInvestments, chart: [], totalInvested: 0, currentPortValue: 0 };
    }

    // ── Compute TRUE net invested from transaction history ──────────────
    // Total invested = sum(buy_amount) - sum(sell_amount) across all transactions, in EUR
    // Also load tx_date for the chart timeline
    let txRows = [];
    try {
        const txResult = await db.execute(
            `SELECT it.investment_id, it.type, it.quantity, it.price, it.currency, it.tx_date
             FROM investment_transactions it
             ORDER BY it.tx_date ASC`
        );
        txRows = txResult.rows || [];
    } catch (e) {
        // transactions table may not exist yet — fallback to old method
    }

    let startDate = new Date();
    let interval = '1d';
    const period = (rawPeriod || '1y').toLowerCase();

    if (period === '1d') {
        startDate.setDate(startDate.getDate() - 3);
        interval = '15m';
    } else if (period === '1w') {
        startDate.setDate(startDate.getDate() - 8);
        interval = '60m';
    } else if (period === '1m') {
        startDate.setMonth(startDate.getMonth() - 1);
        startDate.setDate(startDate.getDate() - 3);
    } else if (period === 'ytd') {
        startDate = new Date(startDate.getFullYear(), 0, 1);
        startDate.setDate(startDate.getDate() - 3);
    } else if (period === 'all') {
        const earliestBuyDate = investments.reduce((min, inv) => {
            if (!inv.buy_date) return min;
            const d = new Date(inv.buy_date);
            return d < min ? d : min;
        }, new Date());
        startDate = new Date(earliestBuyDate);
        startDate.setDate(startDate.getDate() - 3);
    } else { // 1y
        startDate.setFullYear(startDate.getFullYear() - 1);
        startDate.setDate(startDate.getDate() - 3);
    }

    const period1 = startDate;
    const period2 = new Date();

    // ── STEP 1: Fetch EUR/USD rate FIRST so we can normalize all prices ──
    const eurToUsdRate = await getEurToUsdRate();

    // ── Build per-investment cost map AND global total invested ─────────────
    // perInvCost[investment_id] = net EUR amount deployed into that specific position
    const perInvCost = {};
    let totalInvestedStatic = 0;

    if (txRows.length > 0) {
        for (const tx of txRows) {
            const txAmount = parseFloat(tx.quantity) * parseFloat(tx.price);
            const txAmountEur = toEur(txAmount, tx.currency || 'USD', eurToUsdRate);
            const invId = tx.investment_id ? String(tx.investment_id) : null;

            if (tx.type === 'buy') {
                totalInvestedStatic += txAmountEur;
                if (invId) perInvCost[invId] = (perInvCost[invId] || 0) + txAmountEur;
            } else if (tx.type === 'sell') {
                totalInvestedStatic -= txAmountEur;
                if (invId) perInvCost[invId] = (perInvCost[invId] || 0) - txAmountEur;
            }
        }
    }

    // ── Initialize caches ────────────────────────────────────────────────
    // Always reset domainCache so MANUAL_DOMAINS entries are never shadowed by stale nulls
    global.domainCache = {};
    if (!global.chartCache) global.chartCache = {};
    if (!global.quoteCache) global.quoteCache = {};

    const MANUAL_DOMAINS = {
        'GOOGL': 'google.com', 'GOOG': 'google.com',
        'AMZN': 'amazon.com', 'AAPL': 'apple.com',
        'MSFT': 'microsoft.com', 'META': 'meta.com',
        'NVDA': 'nvidia.com', 'TSLA': 'tesla.com',
        'NFLX': 'netflix.com', 'BABA': 'alibaba.com',
        'JPM': 'jpmorganchase.com', 'V': 'visa.com',
        'MA': 'mastercard.com', 'PYPL': 'paypal.com',
        'DIS': 'thewaltdisneycompany.com',
        'INTC': 'intel.com', 'AMD': 'amd.com',
        'SHOP': 'shopify.com', 'CRM': 'salesforce.com',
        'UBER': 'uber.com', 'LYFT': 'lyft.com',
        'SNAP': 'snap.com', 'TWTR': 'twitter.com',
        'SPOT': 'spotify.com', 'ZM': 'zoom.us',
        'TTWO': 'take2games.com', 'EA': 'ea.com',
        'ATVI': 'activision.com', 'RBLX': 'roblox.com',
        'NOV.DE': 'novonordisk.com', 'MC.PA': 'lvmh.com',
        'OR.PA': 'loreal.com', 'AI.PA': 'airliquide.com',
        'TTE.PA': 'totalenergies.com', 'BNP.PA': 'bnpparibas.com',
        'ESE.PA': 'euronext.com', 'SAN.PA': 'sanofi.com',
        'SAP.DE': 'sap.com', 'SIE.DE': 'siemens.com',
    };

    const assetHistories = {}; // { ticker: { timeMs -> closeInEUR } }
    const allTimestampsSet = new Set();
    let currentPortValueStatic = 0;
    
    let totalDividendIncome = 0;
    const allActivities = [];

    // Push all transactions into allActivities
    txRows.forEach(tx => {
         const txDate = new Date(tx.tx_date);
         const amount = tx.quantity * tx.price;
         const amountEur = toEur(amount, tx.currency || 'USD', eurToUsdRate);
         const inv = investments.find(i => String(i.id) === String(tx.investment_id));
         const ticker = inv ? inv.ticker : 'Unknown';
         const longName = inv ? inv.longName || inv.ticker : 'Unknown';

         allActivities.push({
             type: 'transaction',
             txType: tx.type, // 'buy' or 'sell'
             title: tx.type === 'buy' ? `Achat de ${ticker}` : `Vente de ${ticker}`,
             timeMs: txDate.getTime(),
             amount: amountEur,
             amountStr: (tx.type === 'buy' ? '+' : '-') + new Intl.NumberFormat('fr-FR', {style: 'currency', currency: 'EUR'}).format(amountEur),
             status: 'Complété',
             color: tx.type === 'buy' ? 'success.main' : 'error.main',
             icon: tx.type === 'buy' ? '📈' : '📉',
             ticker: ticker
         });
    });

    // ── Compute totalInvested from real transaction flows ──────────────
    // We need eurToUsdRate first — it's fetched below in STEP 1, so we'll
    // compute totalInvestedStatic AFTER the rate is known.

    // ── STEP 2: Fetch quotes & chart data; normalize everything to EUR ───
    await Promise.all(investments.map(async (inv) => {
        assetHistories[inv.ticker] = {};
        try {
            const queryOptions = { period1, period2, interval, events: 'div' };
            const chartKey = `${inv.ticker}_${period}`;
            const quoteKey = inv.ticker;
            const nowTime = Date.now();
            const CACHE_LIFETIME = 5 * 60 * 1000;

            let chartPromise;
            if (global.chartCache[chartKey] && nowTime - global.chartCache[chartKey].time < CACHE_LIFETIME) {
                chartPromise = Promise.resolve(global.chartCache[chartKey].data);
            } else {
                chartPromise = yahooFinance.chart(inv.ticker, queryOptions).then(res => {
                    global.chartCache[chartKey] = { time: nowTime, data: res };
                    return res;
                }).catch(() => ({ quotes: [] }));
            }

            let quotePromise;
            if (global.quoteCache[quoteKey] && nowTime - global.quoteCache[quoteKey].time < CACHE_LIFETIME) {
                quotePromise = Promise.resolve(global.quoteCache[quoteKey].data);
            } else {
                quotePromise = yahooFinance.quote(inv.ticker).then(res => {
                    global.quoteCache[quoteKey] = { time: nowTime, data: res };
                    return res;
                }).catch(() => ({}));
            }

            const [chartRes, quote] = await Promise.all([chartPromise, quotePromise]);

            // ── Determine native currency of this asset ─────────────────
            // Yahoo Finance returns the currency the asset is traded in
            const nativeCurrency = quote.currency || 'USD';

            // ── Normalize average_price (stored in DB) to EUR ───────────
            // The DB `currency` field tells us what currency the user entered the price in.
            // Defaults to 'USD' if not explicitly set.
            const dbCurrency = (inv.currency || 'USD').toUpperCase();
            const avgPriceEur = toEur(inv.average_price, dbCurrency, eurToUsdRate);

            // ── Normalize historical chart prices to EUR ────────────────
            const historical = chartRes.quotes || [];
            historical.forEach(point => {
                if (point.close != null) {
                    const timeMs = new Date(point.date).getTime();
                    assetHistories[inv.ticker][timeMs] = toEur(point.close, nativeCurrency, eurToUsdRate);
                    allTimestampsSet.add(timeMs);
                }
            });

            // ── Normalize current market price to EUR ───────────────────
            const rawCurrentPrice = quote.regularMarketPrice || quote.price || 0;
            const currentPriceEur = toEur(rawCurrentPrice, nativeCurrency, eurToUsdRate);

            // ── Accumulate portfolio value only (invested now from transactions) ──
            currentPortValueStatic += inv.quantity * currentPriceEur;

            // ── Enrich investment object (all values in EUR) ─────────────
            inv.current_price = currentPriceEur;
            inv.native_currency = nativeCurrency;      // expose for debugging
            inv.longName = quote.longName || quote.shortName || inv.ticker;

            inv.current_value = inv.quantity * currentPriceEur;

            // ── PRU : toujours utiliser le average_price stocké en base ──────────
            // transaction.service.js maintient ce PRU en devise native de manière
            // précise (LIFO / coût moyen pondéré). On le convertit en EUR au taux actuel.
            // IMPORTANT : on NE recalcule PAS le PRU depuis perInvCost car ce calcul
            // utilise le taux EUR/USD du JOUR et varie d'une requête à l'autre.
            inv.average_price = avgPriceEur; // PRU stable en EUR

            // ── Montant investi : utiliser les vraies transactions si dispo ──────
            const invIdStr = String(inv.id);
            const hasTxCost = perInvCost[invIdStr] !== undefined && perInvCost[invIdStr] > 0;

            if (hasTxCost) {
                // invested_amount = capital net déployé en EUR (achats - ventes)
                inv.invested_amount = perInvCost[invIdStr];
            } else {
                // Pas de transactions → fallback qty × PRU
                inv.invested_amount = inv.quantity * avgPriceEur;
            }

            inv.profit_loss = inv.current_value - inv.invested_amount;
            inv.profit_loss_pct = inv.invested_amount > 0
                ? (inv.profit_loss / inv.invested_amount) * 100
                : 0;

            // ── Website / logo domain ────────────────────────────────────
            if (MANUAL_DOMAINS[inv.ticker]) {
                inv.website = MANUAL_DOMAINS[inv.ticker];
            } else if (global.domainCache[inv.ticker] !== undefined) {
                inv.website = global.domainCache[inv.ticker];
            } else {
                const summary = await yahooFinance.quoteSummary(inv.ticker, { modules: ['summaryProfile'] }).catch(() => null);
                let rawWebsite = summary?.summaryProfile?.website || null;
                if (rawWebsite) {
                    try {
                        const urlObj = new URL(rawWebsite);
                        inv.website = urlObj.hostname.replace('www.', '');
                        global.domainCache[inv.ticker] = inv.website;
                    } catch (e) {
                        inv.website = null;
                        global.domainCache[inv.ticker] = null;
                    }
                } else {
                    inv.website = null;
                    global.domainCache[inv.ticker] = null;
                }
            }

            // ── Dividends Processing ──────────────────────────────────────
            const divs = chartRes.events?.dividends || chartRes.events?.dividend || [];
            // "dividends" might be an array or an object in some API versions, usually an array array in yahoo-finance2 chart events
            const divList = Array.isArray(divs) ? divs : Object.values(divs);
            
            const invIdStr2 = String(inv.id);
            const myTxs = txRows.filter(t => String(t.investment_id) === invIdStr2).sort((a, b) => new Date(a.tx_date) - new Date(b.tx_date));

            function getSharesAtDate(dateObj) {
                if (myTxs.length > 0) {
                    let s = 0;
                    for (const tx of myTxs) {
                        if (new Date(tx.tx_date) <= dateObj) {
                            s += (tx.type === 'buy' ? parseFloat(tx.quantity) : -parseFloat(tx.quantity));
                        } else {
                            break;
                        }
                    }
                    return s;
                } else {
                    if (!inv.buy_date || new Date(inv.buy_date) <= dateObj) {
                        return inv.quantity;
                    }
                    return 0;
                }
            }

            divList.forEach(div => {
                const divDate = new Date(div.date);
                if (divDate >= period1 && divDate <= period2) {
                    const shares = getSharesAtDate(divDate);
                    if (shares > 0) {
                        const divAmountNative = shares * div.amount;
                        const divAmountEur = toEur(divAmountNative, nativeCurrency, eurToUsdRate);
                        totalDividendIncome += divAmountEur;
                        allActivities.push({
                            type: 'dividend',
                            title: `Dividende ${inv.ticker}`,
                            timeMs: divDate.getTime(),
                            amount: divAmountEur,
                            amountStr: '+' + new Intl.NumberFormat('fr-FR', {style: 'currency', currency: 'EUR'}).format(divAmountEur),
                            status: 'Complété',
                            color: 'success.main',
                            icon: '📥',
                            ticker: inv.ticker
                        });
                    }
                }
            });

        } catch (e) {
            console.error("Error fetching yahoo finance for", inv.ticker, e);
        }
    }));

    // ── STEP 3: Build chart array (values already in EUR) ───────────────
    const sortedTimestamps = Array.from(allTimestampsSet).sort((a, b) => a - b);
    const chartArray = [];
    const lastKnownClose = {};

    let displayThresholdMs = 0;
    const now = Date.now();
    if (period === '1d') displayThresholdMs = now - 24 * 3600 * 1000;
    else if (period === '1w') displayThresholdMs = now - 7 * 24 * 3600 * 1000;
    else if (period === '1m') displayThresholdMs = new Date(now).setMonth(new Date(now).getMonth() - 1);
    else if (period === 'ytd') displayThresholdMs = new Date(new Date().getFullYear(), 0, 1).getTime();
    else if (period === 'all') displayThresholdMs = startDate.getTime() + (3 * 24 * 3600 * 1000);
    else if (period === '1y') displayThresholdMs = new Date(now).setFullYear(new Date(now).getFullYear() - 1);

    // ── Pre-build sorted transaction events for the invested timeline ────
    // Each event: { timeMs, deltaEur } where delta is +buy or -sell
    const txEvents = txRows
        .filter(tx => tx.tx_date)
        .map(tx => {
            const txAmount = parseFloat(tx.quantity) * parseFloat(tx.price);
            const txAmountEur = toEur(txAmount, tx.currency || 'USD', eurToUsdRate);
            return {
                timeMs: new Date(tx.tx_date).getTime(),
                deltaEur: tx.type === 'buy' ? txAmountEur : -txAmountEur,
            };
        })
        .sort((a, b) => a.timeMs - b.timeMs);

    // Precompute prefix sums: for any timestamp T, net invested = sum of deltas where timeMs <= T
    // We'll walk through txEvents pointer as we iterate timestamps
    let txPointer = 0;
    let runningInvested = 0;

    sortedTimestamps.forEach(timeMs => {
        let dailyValue = 0;

        // Advance transaction pointer: apply all txs up to this timestamp
        while (txPointer < txEvents.length && txEvents[txPointer].timeMs <= timeMs) {
            runningInvested += txEvents[txPointer].deltaEur;
            txPointer++;
        }

        for (const inv of investments) {
            let isHeld = true;
            if (inv.buy_date) {
                isHeld = timeMs >= new Date(inv.buy_date).getTime();
            }

            if (isHeld) {
                if (assetHistories[inv.ticker][timeMs] !== undefined) {
                    lastKnownClose[inv.ticker] = assetHistories[inv.ticker][timeMs];
                }
                const closePrice = lastKnownClose[inv.ticker] || inv.average_price;
                dailyValue += inv.quantity * closePrice;
            }
        }

        if (timeMs >= displayThresholdMs) {
            chartArray.push({
                date: new Date(timeMs).toISOString(),
                value: dailyValue,           // EUR — current market value at this date
                invested: Math.max(0, runningInvested), // EUR — cumulative net capital deployed
            });
        }
    });

    allActivities.sort((a, b) => b.timeMs - a.timeMs);
    const recentActivity = allActivities.slice(0, 15);

    return {
        investments: allInvestments, // all (active + closed) for frontend display
        chart: chartArray,
        totalInvested: totalInvestedStatic,   // EUR — net capital deployed (buys - sells)
        currentPortValue: currentPortValueStatic, // EUR — current market value of active positions
        eurToUsdRate,
        totalDividendIncome,
        recentActivity
    };
}

module.exports = {
    getAllInvestments,
    addInvestment,
    updateInvestment,
    deleteInvestment,
    getPortfolioChartData
};
