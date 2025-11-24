import {
  Alert,
  alpha,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Container,
  Fade,
  Grid,
  Stack,
  Typography,
  useTheme
} from "@mui/material";
import { addDays, format, subDays, subMonths, subYears } from "date-fns";
import { fr } from "date-fns/locale";
import { useCallback, useMemo, useState } from "react";

// Icons
import AddCircleOutlineRoundedIcon from "@mui/icons-material/AddCircleOutlineRounded";
import CalendarTodayRoundedIcon from "@mui/icons-material/CalendarTodayRounded";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";

// Logic & Components
import { useDashboardSummary } from "../hooks/useDashboardSummary";
import {
  AccountsList,
  GoalInsights,
  Goals,
  PerformanceChart,
  RecentActivity,
  StatCard,
} from "./dashboard/DashboardWidgets";

// --- CONSTANTS & UTILS ---
const RECENT_ACTIVITY_PAGE_SIZE = 5;

const CHART_RANGE_OPTIONS = [
  { key: "7d", label: "7J", getThreshold: (d) => subDays(d, 6) },
  { key: "30d", label: "30J", getThreshold: (d) => subDays(d, 29) },
  { key: "6m", label: "6M", getThreshold: (d) => subMonths(d, 6) },
  { key: "1y", label: "1A", getThreshold: (d) => subYears(d, 1) },
  { key: "all", label: "TOUT" },
];
const CHART_RANGE_LOOKUP = Object.fromEntries(CHART_RANGE_OPTIONS.map((o) => [o.key, o]));

const userData = {
  name: "Luka",
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Trader&top=ShortHairShortFlat&facialHair=BeardLight&clothes=BlazerShirt&skinColor=Tanned",
};

// --- DATA PROCESSING ---
const buildFullHistory = (trades = [], initialBalance = 0) => {
  if (!trades.length && !initialBalance) return [];

  const baseline = Number(initialBalance) || 0;
  const sortedTrades = [...trades]
    .map(t => ({
      timestamp: new Date(t.date || t.closedAt || t.openedAt).getTime(),
      pnl: Number(t.pnl) || 0
    }))
    .filter(t => !isNaN(t.timestamp))
    .sort((a, b) => a.timestamp - b.timestamp);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startDate = sortedTrades.length
    ? new Date(sortedTrades[0].timestamp)
    : subDays(today, 30);
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

// --- MAIN COMPONENT ---
export default function TradingDashboard() {
  const theme = useTheme();

  // State
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const [chartRange, setChartRange] = useState("30d");
  const [recentPage, setRecentPage] = useState(1);

  const { loading, error, accounts, aggregate, trades, accountsMap, tradesByAccount } = useDashboardSummary();

  // Derived Data
  const currentStats = useMemo(() => selectedAccountId ? accountsMap.get(selectedAccountId) : aggregate, [aggregate, selectedAccountId, accountsMap]);
  const visibleTrades = useMemo(() => selectedAccountId ? tradesByAccount.get(selectedAccountId) || [] : trades, [selectedAccountId, trades, tradesByAccount]);

  const historyData = useMemo(() => buildFullHistory(visibleTrades, currentStats?.initialBalance), [visibleTrades, currentStats]);
  const chartData = useMemo(() => {
    if (!historyData.length) return [];
    const range = CHART_RANGE_LOOKUP[chartRange];
    if (!range?.getThreshold) return historyData;
    const threshold = range.getThreshold(new Date()).getTime();
    return historyData.filter(d => d.timestamp >= threshold);
  }, [historyData, chartRange]);

  const handleAccountSelect = useCallback((id) => {
    setSelectedAccountId(prev => prev === id ? null : id);
    setRecentPage(1);
  }, []);

  const hasData = Boolean(aggregate || accounts.length);
  const currentDate = format(new Date(), "EEEE d MMMM yyyy", { locale: fr });

  return (
    <Box sx={{
      minHeight: "100vh",
      pb: 8,
      bgcolor: "background.default",
      overflowX: "hidden"
    }}>

      <Container maxWidth="xl" sx={{ pt: { xs: 2, md: 4 }, px: { xs: 2, sm: 3 } }}>

        {/* HEADER */}
        <Fade in={true} timeout={800}>
          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", md: "center" }} spacing={3} sx={{ mb: 4 }}>
            <Stack direction="row" spacing={2.5} alignItems="center">
              <Avatar
                src={userData.avatar}
                sx={{
                  width: { xs: 48, md: 56 },
                  height: { xs: 48, md: 56 },
                  bgcolor: theme.palette.background.paper,
                  border: `2px solid ${theme.palette.background.paper}`,
                  boxShadow: theme.shadows[2]
                }}
              />
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.02em', fontSize: { xs: '1.5rem', md: '2rem' } }}>
                  Bonjour, {userData.name}
                </Typography>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ color: 'text.secondary' }}>
                  <CalendarTodayRoundedIcon sx={{ fontSize: 14 }} />
                  <Typography variant="body2" fontWeight={500} sx={{ textTransform: 'capitalize', fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                    {currentDate}
                  </Typography>
                </Stack>
              </Box>
            </Stack>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ width: { xs: "100%", sm: "auto" } }}>
              <Button
                startIcon={<TuneRoundedIcon />}
                color="inherit"
                size="large"
                sx={{
                  bgcolor: alpha(theme.palette.text.primary, 0.05),
                  '&:hover': { bgcolor: alpha(theme.palette.text.primary, 0.1) }
                }}
              >
                Filtres
              </Button>
              <Button
                variant="contained"
                disableElevation
                size="large"
                startIcon={<AddCircleOutlineRoundedIcon />}
                sx={{
                  borderRadius: 2,
                  fontWeight: 700,
                  px: 3,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                  boxShadow: `0 8px 20px ${alpha(theme.palette.primary.main, 0.3)}`,
                  '&:hover': {
                    boxShadow: `0 12px 24px ${alpha(theme.palette.primary.main, 0.4)}`,
                    transform: 'translateY(-2px)'
                  },
                  transition: 'all 0.2s'
                }}
              >
                Nouveau Trade
              </Button>
            </Stack>
          </Stack>
        </Fade>

        {loading && !hasData && (
          <Box sx={{ py: 15, display: 'flex', justifyContent: 'center' }}>
            <CircularProgress size={60} thickness={4} />
          </Box>
        )}

        {error && !loading && (
          <Alert severity="error" sx={{ mb: 4, borderRadius: 3 }}>{error}</Alert>
        )}

        {!loading && hasData && currentStats && (
          <Stack spacing={3}>

            {/* 1. LIGNE DU HAUT : STATS CLÉS */}
            <Fade in={true} timeout={1000}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} lg={3}>
                  <StatCard
                    label="Solde Actuel"
                    value={currentStats.currentBalance}
                    type="currency"
                    currency={currentStats.currency}
                    trend={currentStats.gainPercent >= 0 ? 'positive' : 'negative'}
                    trendValue={currentStats.gainPercent}
                  />
                </Grid>
                <Grid item xs={12} sm={6} lg={3}>
                  <StatCard
                    label="Profit Net (PnL)"
                    value={currentStats.realizedPnl}
                    type="currency"
                    currency={currentStats.currency}
                    trend={currentStats.realizedPnl >= 0 ? 'positive' : 'negative'}
                  />
                </Grid>
                <Grid item xs={12} sm={6} lg={3}>
                  <StatCard
                    label="Performance Mois"
                    value={currentStats.monthlyProfit}
                    type="currency"
                    currency={currentStats.currency}
                    trend={currentStats.monthlyProfit >= 0 ? 'positive' : 'negative'}
                  />
                </Grid>
                <Grid item xs={12} sm={6} lg={3}>
                  <StatCard
                    label="Win Rate"
                    value={currentStats.winRate || 0}
                    type="percent"
                    trend={currentStats.winRate > 50 ? 'positive' : 'neutral'}
                  />
                </Grid>
              </Grid>
            </Fade>

            {/* 2. MILIEU : GRAPHIQUE PLEINE LARGEUR */}
            <Fade in={true} timeout={1200}>
              <Box sx={{ height: 400 }}>
                <PerformanceChart
                  data={chartData}
                  range={chartRange}
                  onRangeChange={setChartRange}
                  rangeOptions={CHART_RANGE_OPTIONS}
                  currentBalance={currentStats.currentBalance}
                  currency={currentStats.currency}
                />
              </Box>
            </Fade>

            {/* 3. BAS : STRUCTURE EN 2 COLONNES (Refactorisé avec Stack pour robustesse) */}
            <Fade in={true} timeout={1400}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="flex-start">

                {/* GAUCHE : Activité Récente */}
                <Box sx={{ flex: { md: 2 }, width: '100%', minWidth: 0 }}>
                  <RecentActivity
                    trades={visibleTrades}
                    page={recentPage}
                    setPage={setRecentPage}
                    pageSize={RECENT_ACTIVITY_PAGE_SIZE}
                  />
                </Box>

                {/* DROITE : Comptes & Objectifs */}
                <Box sx={{ flex: { md: 1 }, width: '100%', minWidth: 0 }}>
                  <Stack spacing={3}>
                    <AccountsList
                      accounts={accounts}
                      selectedId={selectedAccountId}
                      onSelect={handleAccountSelect}
                    />
                    <Goals
                      current={currentStats.monthlyProfit}
                      target={currentStats.initialBalance * 0.05}
                      currency={currentStats.currency}
                    />
                    <GoalInsights stats={currentStats} trades={visibleTrades} />
                  </Stack>
                </Box>

              </Stack>
            </Fade>

          </Stack>
        )}
      </Container>
    </Box>
  );
}