import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import AddIcon from "@mui/icons-material/Add";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import {
  Alert,
  alpha,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import React, { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { fetchJournalEntries } from "../services/journalClient";
import { fetchSettings } from "../services/settingsClient";
import { ACCOUNT_IDS } from "../utils/accountUtils";
import {
  buildDashboardData,
  formatCurrencyValue,
  formatSignedCurrency,
} from "../utils/dashboardUtils";

const userData = {
  name: "Luka",
  avatar:
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Trader&top=ShortHairShortFlat&facialHair=BeardLight&facialHairColor=BrownDark&clothes=BlazerShirt&accessories=Prescription02&skinColor=Tanned",
};

const buildGoalsData = (stats, trades) => {
  if (!stats) return [];
  const monthlyTarget = stats.initialBalance > 0 ? stats.initialBalance * 0.05 : 0;
  const winTrades = trades.filter((trade) => trade.amount > 0).length;
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
    if (trade.amount < 0) {
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

const formatTradeDate = (date) => {
  if (!date) return "-";
  try {
    return format(date, "dd MMM yyyy • HH:mm", { locale: fr });
  } catch {
    return "-";
  }
};

const StatCard = ({
  title,
  value = 0,
  change = 0,
  changePercent = 0,
  icon: Icon,
  color,
  currency,
}) => {
  const isPositive = change >= 0;
  const percentLabel = Number.isFinite(changePercent)
    ? `${changePercent >= 0 ? "+" : ""}${changePercent.toFixed(2)}%`
    : "N/A";

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 4,
        border: "1px solid",
        borderColor: alpha(color, 0.2),
        height: "100%",
        position: "relative",
        overflow: "hidden",
        background: `linear-gradient(135deg, ${alpha(color, 0.08)}, #fff)`,
        transition: "all 0.35s ease",
        "&:before": {
          content: '""',
          position: "absolute",
          inset: 0,
          background: `radial-gradient(circle at top right, ${alpha(color, 0.25)}, transparent 55%)`,
          opacity: 0.9,
        },
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: `0 16px 32px ${alpha(color, 0.25)}`,
        },
      }}
    >
      <CardContent sx={{ p: 3, position: "relative", zIndex: 1 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Box>
            <Typography variant="overline" sx={{ color: alpha("#0f172a", 0.7), letterSpacing: 1 }}>
              {title}
            </Typography>
            <Typography variant="h4" fontWeight={700}>
              {formatCurrencyValue(value, currency)}
            </Typography>
          </Box>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: "18px",
              bgcolor: alpha(color, 0.15),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon sx={{ fontSize: 26, color }} />
          </Box>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {isPositive ? (
            <TrendingUpIcon sx={{ fontSize: 18, color: "#10b981" }} />
          ) : (
            <TrendingDownIcon sx={{ fontSize: 18, color: "#ef4444" }} />
          )}
          <Typography
            variant="body2"
            sx={{ color: isPositive ? "#10b981" : "#ef4444", fontWeight: 600 }}
          >
            {formatSignedCurrency(change, currency)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            ({percentLabel})
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

const PerformanceChart = ({ history = [], currency }) => {
  const values = history.map((entry) => entry.value);
  const startValue = values[0] || 0;
  const endValue = values[values.length - 1] || 0;
  const changeValue = endValue - startValue;
  const changePercent = startValue ? (changeValue / startValue) * 100 : 0;
  const maxEntry = history.reduce((prev, curr) => (curr.value > prev.value ? curr : prev), history[0] || { value: 0, date: "-" });
  const minEntry = history.reduce((prev, curr) => (curr.value < prev.value ? curr : prev), history[0] || { value: 0, date: "-" });

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 4,
        border: "1px solid",
        borderColor: "divider",
        background: "linear-gradient(180deg, #ffffff, rgba(99,102,241,0.02))",
      }}
    >
      <CardContent sx={{ p: { xs: 3, md: 4 }, pb: { xs: 3, md: 4 } }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2.5 }}>
          <Box>
            <Typography variant="h6" fontWeight={700}>
              Performance du portefeuille
            </Typography>
            <Typography variant="body2" color="text.secondary">
              30 derniers jours
            </Typography>
          </Box>
          <Chip label="1M" size="small" color="primary" />
        </Box>

        {history.length === 0 ? (
          <Stack sx={{ minHeight: 230, alignItems: "center", justifyContent: "center" }}>
            <Typography color="text.secondary">Pas encore de données disponibles.</Typography>
          </Stack>
        ) : (
          <ResponsiveContainer width="100%" height={230}>
            <AreaChart data={history}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#9ca3af" style={{ fontSize: 12 }} />
              <YAxis
                stroke="#9ca3af"
                style={{ fontSize: 12 }}
                tickFormatter={(value) => formatSignedCurrency(value, currency)}
              />
              <ChartTooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}
                formatter={(value) => formatCurrencyValue(value, currency)}
              />
              <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2} fill="url(#colorValue)" />
            </AreaChart>
          </ResponsiveContainer>
        )}

        <Box
          sx={{
            mt: 2.5,
            display: "grid",
            gridTemplateColumns: { xs: "repeat(1, minmax(0, 1fr))", sm: "repeat(3, minmax(0, 1fr))" },
            gap: 2,
          }}
        >
          {[
            {
              label: "Variation 30 jours",
              primary: formatSignedCurrency(changeValue, currency),
              secondary: `${changePercent >= 0 ? "+" : ""}${changePercent.toFixed(2)}%`,
              positive: changeValue >= 0,
            },
            {
              label: "Plus haut",
              primary: formatCurrencyValue(maxEntry?.value || 0, currency),
              secondary: maxEntry?.date || "-",
              positive: true,
            },
            {
              label: "Plus bas",
              primary: formatCurrencyValue(minEntry?.value || 0, currency),
              secondary: minEntry?.date || "-",
              positive: false,
            },
          ].map((stat) => (
            <Box
              key={stat.label}
              sx={{
                p: 2,
                borderRadius: 3,
                border: "1px solid",
                borderColor: "rgba(226,232,240,0.8)",
                backgroundColor: "#fff",
              }}
            >
              <Typography variant="caption" color="text.secondary">
                {stat.label}
              </Typography>
              <Typography
                variant="h6"
                fontWeight={700}
                sx={{ color: stat.positive ? "#4338ca" : "#ef4444" }}
              >
                {stat.primary}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {stat.secondary}
              </Typography>
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
};

const AccountsList = ({ accounts = [], selectedAccountId, onSelectAccount }) => (
  <Card
    elevation={0}
    sx={{
      borderRadius: 4,
      border: "1px solid",
      borderColor: "divider",
    }}
  >
    <CardContent sx={{ p: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h6" fontWeight={700}>
          Mes comptes
        </Typography>
        <IconButton size="small">
          <AddIcon />
        </IconButton>
      </Box>

      <Stack spacing={2}>
        {accounts.map((account) => {
          const isSelected = selectedAccountId === account.id;
          return (
            <Paper
              key={account.id}
              elevation={0}
              onClick={() => onSelectAccount(account.id)}
              sx={{
                p: 2,
                borderRadius: 3,
                cursor: "pointer",
                border: "1px solid",
                borderColor: isSelected ? account.color : alpha(account.color, 0.15),
                bgcolor: alpha(account.color, isSelected ? 0.1 : 0.05),
                transition: "all 0.2s",
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      bgcolor: account.color,
                    }}
                  />
                  <Box>
                    <Typography variant="body2" fontWeight={600}>
                      {account.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatCurrencyValue(account.currentBalance, account.currency)}
                    </Typography>
                  </Box>
                </Box>
                <Chip
                  label={`${account.gainPercent >= 0 ? "+" : ""}${account.gainPercent.toFixed(2)}%`}
                  size="small"
                  sx={{
                    bgcolor: account.gainPercent >= 0 ? alpha("#10b981", 0.1) : alpha("#ef4444", 0.1),
                    color: account.gainPercent >= 0 ? "#10b981" : "#ef4444",
                    fontWeight: 600,
                  }}
                />
              </Box>
            </Paper>
          );
        })}
      </Stack>
    </CardContent>
  </Card>
);

const RecentActivity = ({ trades = [] }) => (
  <Card
    elevation={0}
    sx={{
      borderRadius: 4,
      border: "1px solid",
      borderColor: "divider",
    }}
  >
    <CardContent sx={{ p: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h6" fontWeight={700}>
          Activité récente
        </Typography>
        <IconButton size="small">
          <MoreVertIcon />
        </IconButton>
      </Box>

      <Stack spacing={1.5}>
        {trades.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            Aucun trade n'a encore été enregistré.
          </Typography>
        )}
        {trades.slice(0, 5).map((trade) => {
          const typeColor = trade.direction === "SELL" ? "#f59e0b" : "#10b981";
          const amountColor = trade.amount >= 0 ? "#10b981" : "#ef4444";
          return (
            <Paper
              key={trade.id}
              elevation={0}
              sx={{
                p: 1.75,
                borderRadius: 3,
                border: "1px solid",
                borderColor: "rgba(226, 232, 240, 0.8)",
                backgroundColor: "#fff",
                transition: "all 0.2s",
              }}
            >
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "1.6fr 0.8fr 0.8fr 0.9fr",
                  },
                  alignItems: "center",
                  gap: { xs: 1.5, sm: 2 },
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Box
                    sx={{
                      width: 42,
                      height: 42,
                      borderRadius: 2,
                      bgcolor: alpha(typeColor, 0.12),
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: typeColor,
                    }}
                  >
                    <SwapHorizIcon />
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" fontWeight={700}>
                      {trade.asset}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatTradeDate(trade.date)}
                    </Typography>
                  </Box>
                </Box>
                <Chip
                  label={trade.direction === "SELL" ? "Vente" : "Achat"}
                  size="small"
                  sx={{
                    justifySelf: { xs: "flex-start", sm: "center" },
                    bgcolor: alpha(typeColor, 0.12),
                    color: typeColor,
                    fontWeight: 600,
                  }}
                />
                <Typography
                  variant="subtitle1"
                  fontWeight={700}
                  sx={{ color: amountColor, justifySelf: { xs: "flex-start", sm: "center" } }}
                >
                  {formatSignedCurrency(trade.amount, trade.currency)}
                </Typography>
                <Chip
                  label={trade.amount >= 0 ? "Gain confirmé" : "Perte"}
                  size="small"
                  sx={{
                    justifySelf: { xs: "flex-start", sm: "flex-end" },
                    bgcolor: trade.amount >= 0 ? alpha("#10b981", 0.12) : alpha("#ef4444", 0.12),
                    color: trade.amount >= 0 ? "#047857" : "#b91c1c",
                    fontWeight: 600,
                  }}
                />
              </Box>
            </Paper>
          );
        })}
      </Stack>
    </CardContent>
  </Card>
);

const Goals = ({ goals = [] }) => (
  <Card
    elevation={0}
    sx={{
      borderRadius: 4,
      border: "1px solid",
      borderColor: "divider",
    }}
  >
    <CardContent sx={{ p: 3 }}>
      <Typography variant="h6" fontWeight={700} sx={{ mb: 3 }}>
        Objectifs
      </Typography>

      <Stack spacing={3}>
        {goals.map((goal) => {
          const progress = goal.target
            ? Math.min(100, Math.max(0, (goal.current / (goal.target || 1)) * 100))
            : 0;
          return (
            <Box key={goal.id}>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                <Typography variant="body2" fontWeight={600}>
                  {goal.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {goal.isPercent
                    ? `${goal.current}% / ${goal.target}%`
                    : `${formatCurrencyValue(goal.current, goal.currency)} / ${formatCurrencyValue(goal.target, goal.currency)}`}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  bgcolor: alpha(goal.color, 0.1),
                  "& .MuiLinearProgress-bar": {
                    bgcolor: goal.color,
                    borderRadius: 4,
                  },
                }}
              />
            </Box>
          );
        })}
        {goals.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            Configurez des objectifs pour suivre votre progression.
          </Typography>
        )}
      </Stack>
    </CardContent>
  </Card>
);

const GoalInsights = ({ insights = [] }) => (
  <Card
    elevation={0}
    sx={{
      borderRadius: 4,
      border: "1px solid",
      borderColor: "divider",
    }}
  >
    <CardContent sx={{ p: 3 }}>
      <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
        Plan d'action
      </Typography>
      <Stack spacing={2.5}>
        {insights.map((insight) => (
          <Box
            key={insight.id}
            sx={{
              p: 2,
              borderRadius: 3,
              border: "1px solid",
              borderColor: alpha(insight.color, 0.2),
              bgcolor: alpha(insight.color, 0.05),
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
              <Typography variant="subtitle2" fontWeight={700}>
                {insight.title}
              </Typography>
              <Chip
                label={insight.tag}
                size="small"
                sx={{
                  bgcolor: "#fff",
                  border: "1px solid",
                  borderColor: alpha(insight.color, 0.3),
                  color: insight.color,
                  fontWeight: 600,
                }}
              />
            </Box>
            <Typography variant="body2" color="text.secondary">
              {insight.description}
            </Typography>
          </Box>
        ))}
        {insights.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            Les recommandations apparaîtront dès que des trades seront enregistrés.
          </Typography>
        )}
      </Stack>
    </CardContent>
  </Card>
);

export default function TradingDashboard() {
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const [dashboardState, setDashboardState] = useState({
    loading: true,
    error: "",
    accounts: [],
    accountsMap: {},
    aggregate: null,
    trades: [],
    settings: null,
  });

  useEffect(() => {
    let isMounted = true;
    const loadDashboard = async () => {
      try {
        const [settings, entries] = await Promise.all([
          fetchSettings(),
          fetchJournalEntries(),
        ]);
        if (!isMounted) return;
        const data = buildDashboardData(settings, entries);
        setDashboardState({
          loading: false,
          error: "",
          settings,
          ...data,
        });
      } catch (error) {
        if (!isMounted) return;
        setDashboardState((prev) => ({
          ...prev,
          loading: false,
          error: error.message || "Impossible de charger le dashboard.",
        }));
      }
    };
    loadDashboard();
    return () => {
      isMounted = false;
    };
  }, []);

  const currentStats = useMemo(() => {
    if (!selectedAccountId || selectedAccountId === ACCOUNT_IDS.ALL) {
      return dashboardState.aggregate;
    }
    return dashboardState.accountsMap[selectedAccountId];
  }, [dashboardState.aggregate, dashboardState.accountsMap, selectedAccountId]);

  const visibleTrades = useMemo(() => {
    if (!selectedAccountId) return dashboardState.trades;
    return dashboardState.trades.filter((trade) => trade.accountId === selectedAccountId);
  }, [dashboardState.trades, selectedAccountId]);

  const goals = useMemo(() => buildGoalsData(currentStats, visibleTrades), [currentStats, visibleTrades]);
  const insights = useMemo(() => buildGoalInsights(currentStats, goals, visibleTrades), [currentStats, goals, visibleTrades]);

  const handleAccountSelect = (accountId) => {
    setSelectedAccountId((prev) => (prev === accountId ? null : accountId));
  };

  const lastTrade = visibleTrades[0] || currentStats?.lastTrade || null;
  const monthlyGoal = goals[0];
  const monthlyGoalProgress = monthlyGoal?.target
    ? Math.min(100, Math.max(0, (monthlyGoal.current / (monthlyGoal.target || 1)) * 100))
    : 0;

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
                    sx={{ color: lastTrade.amount >= 0 ? "#10b981" : "#ef4444", fontWeight: 600 }}
                  >
                    {formatSignedCurrency(lastTrade.amount, lastTrade.currency)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatTradeDate(lastTrade.date)}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>

          {dashboardState.error && !dashboardState.loading && (
            <Alert severity="error">{dashboardState.error}</Alert>
          )}

          {dashboardState.loading && (
            <Stack alignItems="center" spacing={2}>
              <CircularProgress />
              <Typography color="text.secondary">Chargement du dashboard...</Typography>
            </Stack>
          )}

          {currentStats && !dashboardState.loading && (
            <>
              <Box
                sx={{
                  display: "grid",
                  gap: { xs: 2, md: 3 },
                  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                }}
              >
                {[
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
                    changePercent:
                      currentStats.initialBalance > 0
                        ? (currentStats.monthlyProfit / currentStats.initialBalance) * 100
                        : 0,
                    icon: TrendingUpIcon,
                    color: "#10b981",
                  },
                  {
                    title: "Profit hebdomadaire",
                    value: currentStats.weeklyProfit,
                    change: currentStats.weeklyProfit,
                    changePercent:
                      currentStats.initialBalance > 0
                        ? (currentStats.weeklyProfit / currentStats.initialBalance) * 100
                        : 0,
                    icon: TrendingUpIcon,
                    color: "#8b5cf6",
                  },
                ].map((stat) => (
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
                  <PerformanceChart history={currentStats.history} currency={currentStats.currency} />
                  <RecentActivity trades={visibleTrades} />
                </Stack>
                <Stack spacing={3}>
                  <AccountsList
                    accounts={dashboardState.accounts}
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
