import {
  Alert,
  Box,
  CircularProgress,
  Divider,
  Fade,
  Menu,
  MenuItem,
  Stack,
  Typography,
  alpha,
  useTheme
} from "@mui/material";
import { addDays, format, subDays, subMonths, subYears } from "date-fns";
import { fr } from "date-fns/locale";
import { useCallback, useMemo, useState } from "react";

// ─── Icons ────────────────────────────────────────────────────────
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import ShowChartRoundedIcon from "@mui/icons-material/ShowChartRounded";

// ─── Hooks & Components ──────────────────────────────────────────
import { useDashboardSummary } from "../hooks/useDashboardSummary";
import {
  GlassPanel,
  GoalInsights,
  Goals,
  MarketHeatmap,
  PerformanceChart,
  StatCard,
  TradeHistory,
} from "./dashboard/DashboardWidgets";

// ─── Constants ────────────────────────────────────────────────────
const MONO_FONT = `"JetBrains Mono", "SF Mono", "Fira Code", monospace`;

const CHART_RANGE_OPTIONS = [
  { key: "7d", label: "7J", getThreshold: (d) => subDays(d, 6) },
  { key: "30d", label: "30J", getThreshold: (d) => subDays(d, 29) },
  { key: "6m", label: "6M", getThreshold: (d) => subMonths(d, 6) },
  { key: "1y", label: "1A", getThreshold: (d) => subYears(d, 1) },
  { key: "all", label: "TOUT" },
];
const CHART_RANGE_LOOKUP = Object.fromEntries(CHART_RANGE_OPTIONS.map((o) => [o.key, o]));
const RECENT_ACTIVITY_PAGE_SIZE = 6;

// ─── Data Utils ──────────────────────────────────────────────────
const buildFullHistory = (trades = [], initialBalance = 0) => {
  if (!trades.length && !initialBalance) return [];
  const baseline = Number(initialBalance) || 0;
  const sortedTrades = [...trades]
    .map((t) => ({
      timestamp: new Date(t.date || t.closedAt || t.openedAt).getTime(),
      pnl: Number(t.pnl) || 0,
    }))
    .filter((t) => !isNaN(t.timestamp))
    .sort((a, b) => a.timestamp - b.timestamp);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startDate = sortedTrades.length ? new Date(sortedTrades[0].timestamp) : subDays(today, 30);
  startDate.setHours(0, 0, 0, 0);

  const history = [];
  let currentEquity = baseline;
  let tradeIdx = 0;

  for (let d = new Date(startDate); d <= today; d = addDays(d, 1)) {
    const dayEnd = d.getTime() + 86400000 - 1;
    while (tradeIdx < sortedTrades.length && sortedTrades[tradeIdx].timestamp <= dayEnd) {
      currentEquity += sortedTrades[tradeIdx].pnl;
      tradeIdx++;
    }
    history.push({
      date: format(d, "d MMM", { locale: fr }),
      value: Number(currentEquity.toFixed(2)),
      timestamp: d.getTime(),
    });
  }
  return history;
};

const buildSparkline = (history = [], n = 20) =>
  history.slice(-n).map((h) => ({ value: h.value }));

const computeDailyPnl = (trades = []) => {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return trades
    .filter((t) => new Date(t.date || t.closedAt || t.openedAt) >= today)
    .reduce((sum, t) => sum + (Number(t.pnl) || 0), 0);
};

const computeWinRate = (trades = [], initialBalance = 0) => {
  const threshold = initialBalance * 0.001; // 0.1% du capital initial
  const relevantTrades = trades.filter((t) => Math.abs(Number(t.pnl) || 0) > threshold);
  if (!relevantTrades.length) return 0;
  return (relevantTrades.filter((t) => (Number(t.pnl) || 0) > threshold).length / relevantTrades.length) * 100;
};

const computeProfitFactor = (trades = []) => {
  const grossWin = trades.filter((t) => t.pnl > 0).reduce((s, t) => s + t.pnl, 0);
  const grossLoss = Math.abs(trades.filter((t) => t.pnl < 0).reduce((s, t) => s + t.pnl, 0));
  if (!grossLoss) return grossWin > 0 ? 99.9 : 0;
  return grossWin / grossLoss;
};

// ─── Compact Stat Item (for Win Rate + Profit Factor) ─────────────
const CompactStat = ({ label, value, colorKey }) => {
  const theme = useTheme();
  const color = colorKey === "positive"
    ? theme.palette.success.main
    : colorKey === "negative"
      ? theme.palette.error.main
      : theme.palette.text.primary;
  return (
    <Box sx={{ px: 2, py: 1.5 }}>
      <Typography sx={{
        fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.12em",
        textTransform: "uppercase", color: "text.secondary", mb: 0.5,
      }}>
        {label}
      </Typography>
      <Typography sx={{
        fontFamily: MONO_FONT,
        fontSize: "1.3rem",
        fontWeight: 700,
        letterSpacing: "-0.03em",
        lineHeight: 1,
        color,
      }}>
        {value}
      </Typography>
    </Box>
  );
};

// ─── Main Component ───────────────────────────────────────────────
export default function TradingDashboard() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const [chartRange, setChartRange] = useState("30d");
  const [recentPage, setRecentPage] = useState(1);
  // Account dropdown menu state
  const [accountMenuAnchor, setAccountMenuAnchor] = useState(null);
  const accountMenuOpen = Boolean(accountMenuAnchor);

  const { loading, error, accounts, aggregate, trades, accountsMap, tradesByAccount } =
    useDashboardSummary();

  const currentStats = useMemo(
    () => (selectedAccountId ? accountsMap.get(selectedAccountId) : aggregate),
    [aggregate, selectedAccountId, accountsMap]
  );
  const visibleTrades = useMemo(
    () => (selectedAccountId ? tradesByAccount.get(selectedAccountId) || [] : trades),
    [selectedAccountId, trades, tradesByAccount]
  );

  const historyData = useMemo(() => buildFullHistory(visibleTrades, 0), [visibleTrades]);
  const chartData = useMemo(() => {
    if (!historyData.length) return [];
    const range = CHART_RANGE_LOOKUP[chartRange];
    if (!range?.getThreshold) return historyData;
    const threshold = range.getThreshold(new Date()).getTime();
    return historyData.filter((d) => d.timestamp >= threshold);
  }, [historyData, chartRange]);

  const sparkData = useMemo(() => buildSparkline(historyData), [historyData]);
  const dailyPnl = useMemo(() => computeDailyPnl(visibleTrades), [visibleTrades]);
  const winRate = useMemo(() => computeWinRate(visibleTrades, currentStats?.initialBalance), [visibleTrades, currentStats]);
  const profitFactor = useMemo(() => computeProfitFactor(visibleTrades), [visibleTrades]);

  const handleAccountSelect = useCallback((id) => {
    setSelectedAccountId((prev) => (prev === id ? null : id));
    setRecentPage(1);
    setAccountMenuAnchor(null);
  }, []);

  const hasData = Boolean(aggregate || accounts.length);
  const currentDate = format(new Date(), "EEEE d MMMM yyyy", { locale: fr });
  const selectedAccount = selectedAccountId ? accountsMap.get(selectedAccountId) : null;
  const accountLabel = selectedAccount
    ? `${selectedAccount.name} · ${selectedAccount.currency || "USD"}`
    : accounts.length
      ? `Tous les comptes · ${aggregate?.currency || "USD"}`
      : "Compte";

  // Shared panel style
  const panelStyle = {
    bgcolor: "background.paper",
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: "16px",
  };

  return (
    <Box sx={{
      minHeight: "100vh",
      bgcolor: "background.default",
      pb: 4,
      px: { xs: 2, sm: 3, md: 4 },
      pt: { xs: 2, md: 3 },
      overflowX: "hidden",
    }}>

      {/* ── TOP BAR ─────────────────────────────────────── */}
      <Fade in timeout={500}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          spacing={2}
          sx={{ mb: 4 }}
        >
          {/* Title */}
          <Box>
            <Typography sx={{
              fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.12em",
              textTransform: "uppercase", color: "text.secondary", mb: 0.5,
            }}>
              {currentDate}
            </Typography>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <ShowChartRoundedIcon sx={{
                fontSize: 22,
                color: "secondary.main",
                filter: isDark ? `drop-shadow(0 0 6px ${theme.palette.secondary.main}90)` : "none",
              }} />
              <Typography sx={{
                fontSize: { xs: "1.5rem", md: "1.8rem" },
                fontWeight: 800, letterSpacing: "-0.03em",
                color: "text.primary", lineHeight: 1,
              }}>
                Dashboard
              </Typography>
            </Stack>
          </Box>

          {/* ── Account selector pill — opens dropdown ─── */}
          <Stack
            direction="row" alignItems="center" spacing={1}
            onClick={(e) => setAccountMenuAnchor(e.currentTarget)}
            sx={{
              px: 2, py: 1, borderRadius: "12px",
              bgcolor: isDark ? alpha("#FFFFFF", 0.06) : "background.paper",
              border: `1px solid ${theme.palette.divider}`,
              cursor: "pointer",
              boxShadow: isDark ? "none" : "0 1px 4px rgba(15,23,42,0.08)",
              "&:hover": {
                borderColor: isDark ? alpha("#FFFFFF", 0.15) : alpha("#0F172A", 0.22),
                bgcolor: isDark ? alpha("#FFFFFF", 0.10) : theme.palette.background.default,
              },
              transition: "all 0.15s",
            }}
          >
            <Box sx={{
              width: 7, height: 7, borderRadius: "50%",
              bgcolor: theme.palette.success.main,
              boxShadow: isDark ? `0 0 7px ${theme.palette.success.main}` : "none",
            }} />
            <Typography sx={{ fontFamily: MONO_FONT, fontSize: "0.8rem", fontWeight: 700, color: "text.primary" }}>
              {accountLabel}
            </Typography>
            <KeyboardArrowDownRoundedIcon sx={{
              fontSize: 16, color: "text.secondary",
              transform: accountMenuOpen ? "rotate(180deg)" : "none",
              transition: "transform 0.2s",
            }} />
          </Stack>

          {/* ── Account dropdown menu ────────────────────── */}
          <Menu
            anchorEl={accountMenuAnchor}
            open={accountMenuOpen}
            onClose={() => setAccountMenuAnchor(null)}
            transformOrigin={{ horizontal: "right", vertical: "top" }}
            anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
            slotProps={{
              paper: {
                sx: {
                  mt: 1,
                  minWidth: 240,
                  bgcolor: "background.paper",
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: "12px",
                  boxShadow: isDark
                    ? "0 16px 40px rgba(0,0,0,0.5)"
                    : "0 8px 32px rgba(15,23,42,0.12)",
                  overflow: "hidden",
                },
              },
            }}
          >
            {/* "All accounts" option */}
            <MenuItem
              onClick={() => { setSelectedAccountId(null); setAccountMenuAnchor(null); setRecentPage(1); }}
              sx={{
                py: 1.5, px: 2,
                gap: 1.5,
                fontWeight: selectedAccountId === null ? 700 : 500,
                fontSize: "0.88rem",
                color: selectedAccountId === null ? theme.palette.secondary.main : "text.primary",
                "&:hover": { bgcolor: isDark ? alpha("#FFFFFF", 0.05) : alpha("#0F172A", 0.04) },
              }}
            >
              <Box sx={{
                width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
                bgcolor: theme.palette.success.main,
                boxShadow: isDark ? `0 0 6px ${theme.palette.success.main}` : "none",
              }} />
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontWeight: "inherit", fontSize: "inherit", color: "inherit" }}>
                  Tous les comptes
                </Typography>
                {aggregate?.currency && (
                  <Typography sx={{ fontSize: "0.72rem", color: "text.secondary", fontFamily: MONO_FONT }}>
                    {aggregate.currency}
                  </Typography>
                )}
              </Box>
              {selectedAccountId === null && (
                <CheckRoundedIcon sx={{ fontSize: 16, color: theme.palette.secondary.main }} />
              )}
            </MenuItem>

            {accounts.length > 0 && <Divider sx={{ my: 0.5 }} />}

            {accounts.map((acc) => (
              <MenuItem
                key={acc.id}
                onClick={() => handleAccountSelect(acc.id)}
                sx={{
                  py: 1.5, px: 2, gap: 1.5,
                  fontWeight: selectedAccountId === acc.id ? 700 : 500,
                  fontSize: "0.88rem",
                  color: selectedAccountId === acc.id ? theme.palette.secondary.main : "text.primary",
                  "&:hover": { bgcolor: isDark ? alpha("#FFFFFF", 0.05) : alpha("#0F172A", 0.04) },
                }}
              >
                <Box sx={{
                  width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
                  bgcolor: selectedAccountId === acc.id
                    ? theme.palette.secondary.main
                    : theme.palette.text.secondary,
                }} />
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontWeight: "inherit", fontSize: "inherit", color: "inherit" }}>
                    {acc.name}
                  </Typography>
                  <Typography sx={{ fontSize: "0.72rem", color: "text.secondary", fontFamily: MONO_FONT }}>
                    {acc.platform || "MT5"} · {acc.currency || "USD"}
                  </Typography>
                </Box>
                {selectedAccountId === acc.id && (
                  <CheckRoundedIcon sx={{ fontSize: 16, color: theme.palette.secondary.main }} />
                )}
              </MenuItem>
            ))}
          </Menu>
        </Stack>
      </Fade>

      {/* ── Loading ──────────────────────────────────────── */}
      {loading && !hasData && (
        <Box sx={{ py: 20, display: "flex", justifyContent: "center" }}>
          <CircularProgress size={40} thickness={3} sx={{
            color: "secondary.main",
            filter: isDark ? `drop-shadow(0 0 8px ${theme.palette.secondary.main})` : "none",
          }} />
        </Box>
      )}

      {/* ── Error ────────────────────────────────────────── */}
      {error && !loading && (
        <Alert severity="error" sx={{ mb: 4, borderRadius: 3 }}>{error}</Alert>
      )}

      {/* ── Bento Grid ───────────────────────────────────── */}
      {!loading && hasData && currentStats && (
        <Fade in timeout={700}>
          <Box>

            {/* ROW 1 — 2 main KPI cards + 1 compact stats panel */}
            <Box sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "1fr 1fr 200px" },
              gap: 2,
              mb: 2,
              alignItems: "stretch",
            }}>
              {/* PnL Total — full card with sparkline */}
              <StatCard
                label="PnL Total"
                value={currentStats.realizedPnl}
                type="currency"
                currency={currentStats.currency}
                trend={currentStats.realizedPnl >= 0 ? "positive" : "negative"}
                trendValue={currentStats.gainPercent}
                sparkData={sparkData}
              />
              {/* PnL Journalier — full card with sparkline */}
              <StatCard
                label="PnL Journalier"
                value={dailyPnl}
                type="currency"
                currency={currentStats.currency}
                trend={dailyPnl >= 0 ? "positive" : "negative"}
                sparkData={sparkData.slice(-10)}
              />
              {/* Win Rate + Profit Factor — compact double-stat panel */}
              <GlassPanel sx={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <CompactStat
                  label="Win Rate"
                  value={`${winRate.toFixed(1)}%`}
                  colorKey={winRate >= 50 ? "positive" : "negative"}
                />
                <Divider sx={{ mx: 2 }} />
                <CompactStat
                  label="Profit Factor"
                  value={profitFactor.toFixed(2)}
                  colorKey={profitFactor >= 1.5 ? "positive" : profitFactor >= 1 ? "neutral" : "negative"}
                />
              </GlassPanel>
            </Box>

            {/* ROW 2 — Chart + Heatmap */}
            <Box sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", lg: "1fr 300px" },
              gap: 2,
              mb: 2,
            }}>
              <Box sx={{ ...panelStyle, p: 3, height: { xs: 340, md: 420 } }}>
                <PerformanceChart
                  data={chartData}
                  range={chartRange}
                  onRangeChange={setChartRange}
                  rangeOptions={CHART_RANGE_OPTIONS}
                  currentBalance={currentStats.realizedPnl}
                  currency={currentStats.currency}
                />
              </Box>
              <Box sx={{ height: { xs: 320, lg: 420 } }}>
                <MarketHeatmap trades={visibleTrades} initialBalance={currentStats.initialBalance} />
              </Box>
            </Box>

            {/* ROW 3 — Trade History + Goals sidebar */}
            <Box sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", lg: "1fr 300px" },
              gap: 2,
            }}>
              <Box sx={{ minHeight: 360 }}>
                <TradeHistory
                  trades={visibleTrades}
                  page={recentPage}
                  setPage={setRecentPage}
                  pageSize={RECENT_ACTIVITY_PAGE_SIZE}
                  accountsMap={accountsMap}
                />
              </Box>
              {/* Sidebar: Goals only (Mes Comptes removed — use the top dropdown) */}
              <GlassPanel sx={{ p: 3, display: "flex", flexDirection: "column", gap: 3 }}>
                <Goals
                  current={currentStats.monthlyProfit}
                  target={currentStats.initialBalance * 0.05}
                  currency={currentStats.currency}
                />
                <Divider />
                <GoalInsights stats={currentStats} trades={visibleTrades} />
              </GlassPanel>
            </Box>

          </Box>
        </Fade>
      )}
    </Box>
  );
}