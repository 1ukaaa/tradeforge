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

async function getPortfolioChartData(rawPeriod = '1y') {
    const investments = await getAllInvestments();
    if (investments.length === 0) {
        return { investments: [], chart: [], totalInvested: 0, currentPortValue: 0 };
    }

    let startDate = new Date();
    let interval = '1d';
    const period = (rawPeriod || '1y').toLowerCase();

    if (period === '1d') {
        startDate.setDate(startDate.getDate() - 3); // Buffer for weekends
        interval = '15m';
    } else if (period === '1w') {
        startDate.setDate(startDate.getDate() - 8);
        interval = '60m';
    } else if (period === '1m') {
        startDate.setMonth(startDate.getMonth() - 1);
        startDate.setDate(startDate.getDate() - 3); // Buffer
    } else if (period === 'ytd') {
        startDate = new Date(startDate.getFullYear(), 0, 1);
        startDate.setDate(startDate.getDate() - 3); // Buffer
    } else if (period === 'all') {
        const earliestBuyDate = investments.reduce((min, inv) => {
            if (!inv.buy_date) return min;
            const d = new Date(inv.buy_date);
            return d < min ? d : min;
        }, new Date());
        startDate = new Date(earliestBuyDate);
        startDate.setDate(startDate.getDate() - 3); // Buffer
    } else { // 1y
        startDate.setFullYear(startDate.getFullYear() - 1);
        startDate.setDate(startDate.getDate() - 3); // Buffer
    }

    const period1 = startDate;
    const period2 = new Date();

    const assetHistories = {}; // { ticker: { timeMs -> close } }
    const allTimestampsSet = new Set();
    let totalInvestedStatic = 0;
    let currentPortValueStatic = 0;

    // A lightweight memory cache for websites so we skip quoteSummary repeated calls
    if (!global.domainCache) {
        global.domainCache = {};
    }
    if (!global.chartCache) {
        global.chartCache = {}; // structure: { [ticker_period]: { time, data } }
    }
    if (!global.quoteCache) {
        global.quoteCache = {}; // structure: { [ticker]: { time, data } }
    }

    const MANUAL_DOMAINS = {
        'GOOGL': 'google.com',
        'GOOG': 'google.com',
        'AMZN': 'amazon.com',
        'AAPL': 'apple.com',
        'MSFT': 'microsoft.com',
        'META': 'meta.com',
        'NVDA': 'nvidia.com',
        'MC.PA': 'lvmh.com',
        'OR.PA': 'loreal.com',
        'AI.PA': 'airliquide.com',
        'TTE.PA': 'totalenergies.com',
    };

    await Promise.all(investments.map(async (inv) => {
        totalInvestedStatic += inv.quantity * inv.average_price;
        assetHistories[inv.ticker] = {};
        try {
            const queryOptions = { period1, period2, interval };

            const chartKey = `${inv.ticker}_${period}`;
            const quoteKey = inv.ticker;
            const nowTime = Date.now();
            const CACHE_LIFETIME = 5 * 60 * 1000; // 5 minutes cache

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

            const historical = chartRes.quotes || [];

            historical.forEach(point => {
                if (point.close != null) {
                    const timeMs = new Date(point.date).getTime();
                    assetHistories[inv.ticker][timeMs] = point.close;
                    allTimestampsSet.add(timeMs);
                }
            });

            currentPortValueStatic += inv.quantity * (quote.regularMarketPrice || quote.price || 0);

            inv.current_price = quote.regularMarketPrice || quote.price || 0;
            inv.longName = quote.longName || quote.shortName || inv.ticker;

            // Fast-path for domain/website
            if (MANUAL_DOMAINS[inv.ticker]) {
                inv.website = MANUAL_DOMAINS[inv.ticker];
            } else if (global.domainCache[inv.ticker] !== undefined) {
                inv.website = global.domainCache[inv.ticker];
            } else {
                // Slower-path: fetch the website specifically
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

            inv.current_value = inv.quantity * inv.current_price;
            inv.invested_amount = inv.quantity * inv.average_price;
            inv.profit_loss = inv.current_value - inv.invested_amount;
            inv.profit_loss_pct = (inv.profit_loss / inv.invested_amount) * 100;

        } catch (e) {
            console.error("Error fetching yahoo finance for", inv.ticker, e);
        }
    }));

    const sortedTimestamps = Array.from(allTimestampsSet).sort((a, b) => a - b);
    const chartArray = [];
    const lastKnownClose = {};

    // For 1D and 1W, we fetch extra days (buffer) to ensure we have a last known close, 
    // but we only want to display the relevant timeframe to the user.
    let displayThresholdMs = 0;
    const now = Date.now();
    if (period === '1d') displayThresholdMs = now - 24 * 3600 * 1000;
    else if (period === '1w') displayThresholdMs = now - 7 * 24 * 3600 * 1000;
    else if (period === '1m') displayThresholdMs = new Date(now).setMonth(new Date(now).getMonth() - 1);
    else if (period === 'ytd') displayThresholdMs = new Date(new Date().getFullYear(), 0, 1).getTime();
    else if (period === 'all') displayThresholdMs = startDate.getTime() + (3 * 24 * 3600 * 1000); // Inverse buffer
    else if (period === '1y') displayThresholdMs = new Date(now).setFullYear(new Date(now).getFullYear() - 1);

    sortedTimestamps.forEach(timeMs => {
        let dailyValue = 0;
        let dailyInvested = 0;

        for (const inv of investments) {
            let isHeld = true;
            if (inv.buy_date) {
                // If they bought it after this timestamp, it's not held yet
                isHeld = timeMs >= new Date(inv.buy_date).getTime();
            }

            if (isHeld) {
                if (assetHistories[inv.ticker][timeMs] !== undefined) {
                    lastKnownClose[inv.ticker] = assetHistories[inv.ticker][timeMs];
                }

                const closePrice = lastKnownClose[inv.ticker] || inv.average_price;
                dailyValue += inv.quantity * closePrice;
                dailyInvested += inv.quantity * inv.average_price;
            }
        }

        // Only push to chart if it's within the actual requested display period (ignoring buffer)
        if (timeMs >= displayThresholdMs) {
            chartArray.push({
                date: new Date(timeMs).toISOString(),
                value: dailyValue,
                invested: dailyInvested
            });
        }
    });

    // Fetch EUR/USD exchange rate for frontend currency toggle
    let eurToUsdRate = 1.05; // Fallback
    try {
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
        if (rateData && rateData.regularMarketPrice) {
            eurToUsdRate = rateData.regularMarketPrice;
        }
    } catch (e) { }

    return {
        investments,
        chart: chartArray,
        totalInvested: totalInvestedStatic,
        currentPortValue: currentPortValueStatic,
        eurToUsdRate
    };
}

module.exports = {
    getAllInvestments,
    addInvestment,
    updateInvestment,
    deleteInvestment,
    getPortfolioChartData
};
