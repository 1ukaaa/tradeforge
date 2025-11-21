import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Container,
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
  today.setHours(0,0,0,0);
  
  const startDate = sortedTrades.length 
    ? new Date(sortedTrades[0].timestamp) 
    : subDays(today, 30);
  startDate.setHours(0,0,0,0);

  const history = [];
  let currentEquity = baseline;
  let tradeIdx = 0;

  for (let d = new Date(startDate); d <= today; d = addDays(d, 1)) {
    const dayEnd = d.getTime() + 86400000 - 1;
    while(tradeIdx < sortedTrades.length && sortedTrades[tradeIdx].timestamp <= dayEnd) {
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

  return (
    <Box sx={{ 
      minHeight: "100vh", 
      pb: 6,
      bgcolor: "background.default", 
    }}>
      
      <Container maxWidth="xl" sx={{ pt: { xs: 3, md: 4 } }}>
        
        {/* HEADER */}
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", md: "center" }} spacing={3} sx={{ mb: 4 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar 
              src={userData.avatar} 
              sx={{ width: 56, height: 56, bgcolor: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}` }} 
            />
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>Bonjour, {userData.name}</Typography>
              <Typography variant="body2" color="text.secondary">Performance du portefeuille</Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={2}>
            <Button startIcon={<TuneRoundedIcon />} color="inherit">Filtres</Button>
            <Button
              variant="contained"
              disableElevation
              startIcon={<AddCircleOutlineRoundedIcon />}
              sx={{ borderRadius: 2, fontWeight: 600 }}
            >
              Nouveau Trade
            </Button>
          </Stack>
        </Stack>

        {loading && !hasData && (
          <Box sx={{ py: 10, textAlign: 'center' }}><CircularProgress /></Box>
        )}
        
        {error && !loading && (
           <Alert severity="error" sx={{ mb: 4 }}>{error}</Alert>
        )}

        {!loading && hasData && currentStats && (
          <Stack spacing={3}>
            
            {/* 1. LIGNE DU HAUT : STATS CLÉS (4 Blocs alignés) */}
            <Grid container spacing={3}>
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

            {/* 2. MILIEU : GRAPHIQUE PLEINE LARGEUR */}
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

            {/* 3. BAS : STRUCTURE EN 2 COLONNES (Gauche: Activité / Droite: Comptes) */}
            <Grid container spacing={3} alignItems="flex-start">
              
              {/* GAUCHE (Plus large) : Tableau des derniers trades */}
              <Grid item xs={12} lg={8}>
                 <RecentActivity 
                  trades={visibleTrades} 
                  page={recentPage} 
                  setPage={setRecentPage} 
                  pageSize={RECENT_ACTIVITY_PAGE_SIZE}
                />
              </Grid>

              {/* DROITE (Plus étroite) : Comptes + Objectifs + IA */}
              <Grid item xs={12} lg={4}>
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
              </Grid>

            </Grid>

          </Stack>
        )}
      </Container>
    </Box>
  );
}