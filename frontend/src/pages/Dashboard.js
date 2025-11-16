import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import {
  Alert,
  alpha,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Container,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";
import { addDays, format, subDays, subMonths, subYears } from "date-fns";
import { fr } from "date-fns/locale";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDashboardSummary } from "../hooks/useDashboardSummary";
import { formatCurrencyValue, formatSignedCurrency } from "../utils/dashboardUtils";
import {
  AccountsList,
  GoalInsights,
  Goals,
  PerformanceChart,
  RecentActivity,
  StatCard,
  formatTradeDate,
} from "./dashboard/DashboardWidgets";

const userData = {
  name: "Luka",
  avatar:
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Trader&top=ShortHairShortFlat&facialHair=BeardLight&facialHairColor=BrownDark&clothes=BlazerShirt&accessories=Prescription02&skinColor=Tanned",
};

const EMPTY_ARRAY = [];
const CHART_RANGE_OPTIONS = [
  { key: "7d", label: "7 derniers jours", shortLabel: "7J", getThreshold: (endDate) => subDays(endDate, 6) },
  { key: "30d", label: "30 derniers jours", shortLabel: "30J", getThreshold: (endDate) => subDays(endDate, 29) },
  { key: "6m", label: "6 derniers mois", shortLabel: "6M", getThreshold: (endDate) => subMonths(endDate, 6) },
  { key: "1y", label: "1 an", shortLabel: "1A", getThreshold: (endDate) => subYears(endDate, 1) },
  { key: "all", label: "Depuis le début", shortLabel: "ALL" },
];
const CHART_RANGE_LOOKUP = Object.fromEntries(CHART_RANGE_OPTIONS.map((option) => [option.key, option]));
const RECENT_ACTIVITY_PAGE_SIZE = 5;

const buildFullHistory = (trades = [], initialBalance = 0) => {
  const baseline = Number(initialBalance) || 0;
  const normalizedTrades = trades
    .map((trade) => {
      const rawDate = trade.date || trade.closedAt || trade.openedAt;
      if (!rawDate) return null;
      const date = new Date(rawDate);
      if (Number.isNaN(date.getTime())) return null;
      return {
        timestamp: date.getTime(),
        pnl: Number(trade.pnl) || 0,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.timestamp - b.timestamp);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startDate = normalizedTrades.length ? new Date(normalizedTrades[0].timestamp) : new Date(today);
  startDate.setHours(0, 0, 0, 0);
  const history = [];
  let runningValue = baseline;
  let tradeIndex = 0;

  for (let cursor = new Date(startDate); cursor <= today; cursor = addDays(cursor, 1)) {
    const dayEndTs = cursor.getTime() + 86400000 - 1;
    while (tradeIndex < normalizedTrades.length && normalizedTrades[tradeIndex].timestamp <= dayEndTs) {
      runningValue += normalizedTrades[tradeIndex].pnl;
      tradeIndex += 1;
    }
    const pnlValue = runningValue - baseline;
    history.push({
      date: format(cursor, "dd MMM", { locale: fr }),
      value: Math.round(runningValue * 100) / 100,
      pnl: Math.round(pnlValue * 100) / 100,
      timestamp: cursor.getTime(),
      iso: cursor.toISOString(),
    });
  }

  return history;
};

const filterHistoryByRange = (history = [], rangeKey = "30d") => {
  if (!history.length) return [];
  const range = CHART_RANGE_LOOKUP[rangeKey];
  if (!range || !range.getThreshold) {
    return history;
  }
  const endDate = new Date(history[history.length - 1].timestamp);
  const startDate = range.getThreshold(new Date(endDate));
  startDate.setHours(0, 0, 0, 0);
  const thresholdTs = startDate.getTime();
  return history.filter((entry) => entry.timestamp >= thresholdTs);
};

const buildGoalsData = (stats, trades) => {
  if (!stats) return [];
  const monthlyTarget = stats.initialBalance > 0 ? stats.initialBalance * 0.05 : 0;
  const winTrades = trades.filter((trade) => trade.pnl > 0).length;
  const totalTrades = trades.length;
  const winRate = totalTrades ? (winTrades / totalTrades) * 100 : 0;

  return [
    {
      id: 1,
      title: "Objectif mensuel",
      current: stats.monthlyProfit,
      target: monthlyTarget,
      color: "#10b981",
      type: "currency",
      currency: stats.currency,
    },
    {
      id: 2,
      title: "Taux de réussite",
      current: Math.round(winRate),
      target: 60,
      color: "#3b82f6",
      isPercent: true,
    },
  ];
};

const buildGoalInsights = (stats, goals, trades) => {
  if (!stats) return [];
  const monetaryGoal = goals.find((goal) => goal.type === "currency");
  const monthlyTarget = monetaryGoal?.target || 0;
  const monthlyProgress = monetaryGoal?.current || 0;
  const remaining = monthlyTarget ? monthlyTarget - Math.max(0, monthlyProgress) : 0;

  const monthlyInsight = monthlyTarget && remaining > 0
    ? {
        id: 1,
        title: "Renforcer le profit mensuel",
        description: `Encore ${formatCurrencyValue(remaining, stats.currency)} pour atteindre l'objectif.`,
        tag: `-${formatCurrencyValue(remaining, stats.currency)}`,
        color: "#6366f1",
      }
    : {
        id: 1,
        title: "Objectif mensuel atteint",
        description: "Sécurisez une partie du gain et réduisez l'exposition sur les prochains trades.",
        tag: "Atteint",
        color: "#10b981",
      };

  let losingStreak = 0;
  for (const trade of trades) {
    if (trade.pnl < 0) {
      losingStreak += 1;
    } else {
      break;
    }
  }

  const executionInsight = trades.length
    ? {
        id: 2,
        title: losingStreak >= 2 ? "Stopper la série de pertes" : "Continuer la dynamique",
        description:
          losingStreak >= 2
            ? "Réduire la taille des prochaines positions jusqu'à ce qu'un gain apparaisse."
            : "Profiter des signaux forts pour verrouiller des profits partiels.",
        tag:
          losingStreak >= 2 ? `${losingStreak} pertes d'affilée` : `${trades.length} trades suivis`,
        color: losingStreak >= 2 ? "#f97316" : "#0ea5e9",
      }
    : {
        id: 2,
        title: "Collecter plus de trades",
        description: "Ajoutez de nouvelles positions pour générer des statistiques exploitables.",
        tag: "Aucune donnée",
        color: "#94a3b8",
      };

  return [monthlyInsight, executionInsight];
};

export default function TradingDashboard() {
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const [chartRange, setChartRange] = useState("30d");
  const [chartMetric, setChartMetric] = useState("equity");
  const [recentPage, setRecentPage] = useState(1);
  const {
    loading,
    error,
    accounts,
    aggregate,
    trades,
    accountsMap,
    tradesByAccount,
  } = useDashboardSummary();

  const currentStats = useMemo(() => {
    if (!selectedAccountId) {
      return aggregate;
    }
    return accountsMap.get(selectedAccountId) || null;
  }, [aggregate, selectedAccountId, accountsMap]);

  const visibleTrades = useMemo(() => {
    if (!selectedAccountId) return trades;
    return tradesByAccount.get(selectedAccountId) || EMPTY_ARRAY;
  }, [selectedAccountId, trades, tradesByAccount]);
  const fullHistory = useMemo(() => {
    if (!currentStats) return [];
    return buildFullHistory(visibleTrades, currentStats.initialBalance || 0);
  }, [visibleTrades, currentStats]);
  const chartHistory = useMemo(
    () => filterHistoryByRange(fullHistory, chartRange),
    [fullHistory, chartRange]
  );

  const goals = useMemo(() => buildGoalsData(currentStats, visibleTrades), [currentStats, visibleTrades]);
  const insights = useMemo(() => buildGoalInsights(currentStats, goals, visibleTrades), [currentStats, goals, visibleTrades]);
  const statCards = useMemo(() => {
    if (!currentStats) return EMPTY_ARRAY;
    const baseBalance = currentStats.initialBalance || 0;
    const percentFromBase = (value) => (baseBalance > 0 ? (value / baseBalance) * 100 : 0);
    return [
      {
        title: "Solde total",
        value: currentStats.currentBalance,
        change: currentStats.realizedPnl,
        changePercent: currentStats.gainPercent,
        icon: AccountBalanceWalletIcon,
        color: "#6366f1",
      },
      {
        title: "Profit mensuel",
        value: currentStats.monthlyProfit,
        change: currentStats.monthlyProfit,
        changePercent: percentFromBase(currentStats.monthlyProfit),
        icon: TrendingUpIcon,
        color: "#10b981",
      },
      {
        title: "Profit hebdomadaire",
        value: currentStats.weeklyProfit,
        change: currentStats.weeklyProfit,
        changePercent: percentFromBase(currentStats.weeklyProfit),
        icon: TrendingUpIcon,
        color: "#8b5cf6",
      },
    ];
  }, [currentStats]);

  const handleAccountSelect = useCallback((accountId) => {
    setSelectedAccountId((prev) => (prev === accountId ? null : accountId));
    setRecentPage(1);
  }, [setRecentPage, setSelectedAccountId]);

  useEffect(() => {
    const maxPage = Math.max(
      1,
      Math.ceil((visibleTrades.length || 0) / RECENT_ACTIVITY_PAGE_SIZE)
    );
    if (recentPage > maxPage) {
      setRecentPage(maxPage);
    }
  }, [visibleTrades, recentPage]);

  const lastTrade = useMemo(
    () => visibleTrades[0] || currentStats?.lastTrade || null,
    [visibleTrades, currentStats]
  );
  const monthlyGoal = useMemo(() => goals[0] || null, [goals]);
  const monthlyGoalProgress = useMemo(() => {
    if (!monthlyGoal?.target) return 0;
    return Math.min(100, Math.max(0, (monthlyGoal.current / (monthlyGoal.target || 1)) * 100));
  }, [monthlyGoal]);
  const hasSummaryData = Boolean(aggregate || accounts.length);

  return (
    <Box sx={{ bgcolor: "#f8fafc", minHeight: "100vh", py: 6 }}>
      <Container
        maxWidth="xl"
        sx={{
          px: { xs: 2, md: 3 },
          mx: "auto",
        }}
      >
        <Stack spacing={4}>
          <Box
            sx={{
              borderRadius: { xs: 4, md: 5 },
              p: { xs: 3, md: 4 },
              background: "linear-gradient(135deg, #ffffff, #eef2ff)",
              border: "1px solid rgba(99,102,241,0.15)",
              boxShadow: "0 25px 60px rgba(15,23,42,0.08)",
              position: "relative",
              overflow: "hidden",
              color: "#0f172a",
            }}
          >
            <Box
              sx={{
                position: "absolute",
                top: -80,
                right: -10,
                width: 260,
                height: 260,
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(99,102,241,0.25), transparent 60%)",
              }}
            />
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={3}
              alignItems={{ xs: "flex-start", md: "center" }}
              justifyContent="space-between"
              sx={{ position: "relative", zIndex: 1 }}
            >
              <Stack direction="row" spacing={2.5} alignItems="center">
                <Box sx={{ position: "relative", width: 78, height: 78 }}>
                  <Box
                    sx={{
                      width: "100%",
                      height: "100%",
                      borderRadius: "50%",
                      p: 1,
                      background: "linear-gradient(135deg, rgba(99,102,241,0.18), rgba(59,130,246,0.08))",
                      boxShadow: "0 18px 36px rgba(15,23,42,0.12)",
                    }}
                  >
                    <Box
                      sx={{
                        width: "100%",
                        height: "100%",
                        borderRadius: "50%",
                        bgcolor: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                      }}
                    >
                      <Avatar src={userData.avatar} sx={{ width: "100%", height: "100%" }} />
                    </Box>
                  </Box>
                  <Box
                    sx={{
                      position: "absolute",
                      bottom: 0,
                      right: -4,
                      width: 30,
                      height: 30,
                      borderRadius: "50%",
                      bgcolor: "#4338ca",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 10px 25px rgba(67,56,202,0.35)",
                    }}
                  >
                    <AutoAwesomeIcon sx={{ fontSize: 18, color: "#fde68a" }} />
                  </Box>
                </Box>
                <Box>
                  <Typography variant="h4" fontWeight={700}>
                    Bonjour, {userData.name}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {format(new Date(), "EEEE dd MMMM yyyy", { locale: fr })}
                  </Typography>
                </Box>
              </Stack>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <Button
                  variant="contained"
                  startIcon={<RocketLaunchIcon />}
                  sx={{
                    borderRadius: 3,
                    textTransform: "none",
                    px: 3,
                    py: 1.5,
                    fontWeight: 600,
                    background: "linear-gradient(90deg, #4f46e5, #7c3aed)",
                    boxShadow: "0 15px 30px rgba(79,70,229,0.3)",
                    "&:hover": {
                      background: "linear-gradient(90deg, #4338ca, #6d28d9)",
                    },
                  }}
                >
                  Lancer une stratégie
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<FileDownloadIcon />}
                  sx={{
                    borderRadius: 3,
                    textTransform: "none",
                    px: 3,
                    py: 1.5,
                    fontWeight: 600,
                    borderColor: "rgba(99,102,241,0.4)",
                    color: "#4338ca",
                    bgcolor: "#fff",
                    "&:hover": {
                      borderColor: "#4f46e5",
                      backgroundColor: "rgba(255,255,255,0.9)",
                    },
                  }}
                >
                  Exporter
                </Button>
              </Stack>
            </Stack>

            <Box
              sx={{
                mt: { xs: 3, md: 4 },
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", md: "repeat(3, minmax(0, 1fr))" },
                gap: 2,
                position: "relative",
                zIndex: 1,
              }}
            >
              <Box
                sx={{
                  borderRadius: 4,
                  p: 2.5,
                  bgcolor: "#fff",
                  border: "1px solid rgba(226,232,240,0.9)",
                  boxShadow: "0 10px 30px rgba(15,23,42,0.08)",
                }}
              >
                <Typography variant="overline" sx={{ color: "#6366f1", letterSpacing: 1 }}>
                  Croissance cumulée
                </Typography>
                <Typography variant="h4" fontWeight={700}>
                  {currentStats ? `${currentStats.gainPercent >= 0 ? "+" : ""}${currentStats.gainPercent.toFixed(2)}%` : "-"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Performance depuis la création du compte
                </Typography>
              </Box>
              {monthlyGoal && (
                <Box
                  sx={{
                    borderRadius: 4,
                    p: 2.5,
                    bgcolor: "#fff",
                    border: "1px solid rgba(226,232,240,0.9)",
                    boxShadow: "0 10px 30px rgba(15,23,42,0.08)",
                  }}
                >
                  <Typography variant="overline" sx={{ color: "#0f172a", letterSpacing: 1 }}>
                    Objectif mensuel
                  </Typography>
                  <Typography variant="h5" fontWeight={700}>
                    {formatCurrencyValue(monthlyGoal.current, monthlyGoal.currency)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {monthlyGoalProgress.toFixed(0)}% du but atteint
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={monthlyGoalProgress}
                    sx={{
                      mt: 1.5,
                      height: 6,
                      borderRadius: 3,
                      bgcolor: alpha("#6366f1", 0.1),
                      "& .MuiLinearProgress-bar": {
                        bgcolor: "#4f46e5",
                        borderRadius: 3,
                      },
                    }}
                  />
                </Box>
              )}
              {lastTrade && (
                <Box
                  sx={{
                    borderRadius: 4,
                    p: 2.5,
                    bgcolor: "#fff",
                    border: "1px solid rgba(226,232,240,0.9)",
                    boxShadow: "0 10px 30px rgba(15,23,42,0.08)",
                  }}
                >
                  <Typography variant="overline" sx={{ color: "#0f172a", letterSpacing: 1 }}>
                    Dernière opération
                  </Typography>
                  <Typography variant="h5" fontWeight={700}>
                    {lastTrade.asset}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: lastTrade.pnl >= 0 ? "#10b981" : "#ef4444", fontWeight: 600 }}
                  >
                    {formatSignedCurrency(lastTrade.pnl, lastTrade.currency)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatTradeDate(lastTrade.date)}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>

          {error && !loading && (
            <Alert severity="error">{error}</Alert>
          )}

          {loading && !hasSummaryData && (
            <Stack alignItems="center" spacing={2}>
              <CircularProgress />
              <Typography color="text.secondary">Chargement du dashboard...</Typography>
            </Stack>
          )}

          {!loading && !error && !hasSummaryData && (
            <Alert severity="info">
              Aucun compte broker n'est configuré pour le moment. Importez vos données FTMO/MT5 pour alimenter ce dashboard.
            </Alert>
          )}

          {currentStats && hasSummaryData && (
            <>
              <Box
                sx={{
                  display: "grid",
                  gap: { xs: 2, md: 3 },
                  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                }}
              >
                {statCards.map((stat) => (
                  <StatCard key={stat.title} currency={currentStats.currency} {...stat} />
                ))}
              </Box>

              <Box
                sx={{
                  display: "grid",
                  gap: { xs: 2, md: 3 },
                  gridTemplateColumns: { xs: "1fr", lg: "1.7fr 1fr" },
                }}
              >
                <Stack spacing={3}>
                  <PerformanceChart
                    history={chartHistory}
                    currency={currentStats?.currency || "USD"}
                    rangeKey={chartRange}
                    onRangeChange={setChartRange}
                    rangeOptions={CHART_RANGE_OPTIONS}
                    metricKey={chartMetric}
                    onMetricChange={setChartMetric}
                  />
                  <RecentActivity
                    trades={visibleTrades}
                    page={recentPage}
                    pageSize={RECENT_ACTIVITY_PAGE_SIZE}
                    onPageChange={setRecentPage}
                  />
                </Stack>
                <Stack spacing={3}>
                  <AccountsList
                    accounts={accounts}
                    selectedAccountId={selectedAccountId}
                    onSelectAccount={handleAccountSelect}
                  />
                  <Goals goals={goals} />
                  <GoalInsights insights={insights} />
                </Stack>
              </Box>
            </>
          )}
        </Stack>
      </Container>
    </Box>
  );
}
