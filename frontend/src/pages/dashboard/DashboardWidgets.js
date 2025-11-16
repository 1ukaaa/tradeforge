import React, { memo, useCallback, useMemo } from "react";
import AddIcon from "@mui/icons-material/Add";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import {
  Box,
  Card,
  CardContent,
  Chip,
  IconButton,
  LinearProgress,
  Pagination,
  Paper,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrencyValue, formatSignedCurrency } from "../../utils/dashboardUtils";

export const formatTradeDate = (input) => {
  if (!input) return "-";
  try {
    const date = input instanceof Date ? input : new Date(input);
    if (Number.isNaN(date.getTime())) return "-";
    return format(date, "dd MMM yyyy • HH:mm", { locale: fr });
  } catch {
    return "-";
  }
};

const METRIC_OPTIONS = [
  { key: "equity", label: "Capital", shortLabel: "CAP" },
  { key: "pnl", label: "PnL", shortLabel: "PnL" },
];

export const StatCard = memo(function StatCard({
  title,
  value = 0,
  change = 0,
  changePercent = 0,
  icon: Icon,
  color,
  currency,
}) {
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
});

export const PerformanceChart = memo(function PerformanceChart({
  history = [],
  currency = "USD",
  rangeKey = "30d",
  onRangeChange,
  rangeOptions = [],
  metricOptions = METRIC_OPTIONS,
  metricKey,
  onMetricChange,
}) {
  const metricKeySafe = metricKey || metricOptions[0]?.key || "equity";
  const hasMetricControl = Boolean(onMetricChange);
  const selectedRange =
    rangeOptions.find((option) => option.key === rangeKey) ||
    rangeOptions[0] ||
    { label: "30 derniers jours", shortLabel: "30J" };
  const rangeLabel = selectedRange.label;
  const handleRangeChange = (_, newValue) => {
    if (!newValue || newValue === rangeKey) return;
    onRangeChange?.(newValue);
  };
  const selectedMetric =
    metricOptions.find((option) => option.key === metricKeySafe) ||
    metricOptions[0] ||
    { label: "Capital", shortLabel: "CAP" };
  const handleMetricChange = (_, newMetric) => {
    if (!newMetric || newMetric === metricKeySafe) return;
    onMetricChange?.(newMetric);
  };
  const chartData = history.map((entry) => ({
    ...entry,
    plottedValue:
      metricKeySafe === "pnl" ? entry.pnl ?? entry.value - (history[0]?.value || 0) : entry.value,
  }));
  const values = chartData.map((entry) => entry.plottedValue);
  const startValue = values[0] || 0;
  const endValue = values[values.length - 1] || 0;
  const changeValue = endValue - startValue;
  const changePercent =
    metricKeySafe === "equity" && startValue ? (changeValue / startValue) * 100 : null;
  const maxEntry =
    chartData.length > 0
      ? chartData.reduce(
          (prev, curr) => (curr.plottedValue > prev.plottedValue ? curr : prev),
          chartData[0]
        )
      : { plottedValue: 0, date: "-" };
  const minEntry =
    chartData.length > 0
      ? chartData.reduce(
          (prev, curr) => (curr.plottedValue < prev.plottedValue ? curr : prev),
          chartData[0]
        )
      : { plottedValue: 0, date: "-" };
  const formatMetricValue = (value) =>
    metricKeySafe === "pnl"
      ? formatSignedCurrency(value, currency)
      : formatCurrencyValue(value, currency);

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
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", sm: "center" },
            mb: 2.5,
            flexDirection: { xs: "column", sm: "row" },
            gap: { xs: 1.5, sm: 0 },
          }}
        >
          <Box>
            <Typography variant="h6" fontWeight={700}>
              Performance du portefeuille
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {selectedMetric.label} • {rangeLabel}
            </Typography>
          </Box>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            {hasMetricControl && (
              <ToggleButtonGroup
                value={metricKeySafe}
                exclusive
                size="small"
                onChange={handleMetricChange}
              >
                {metricOptions.map((option) => (
                  <ToggleButton key={option.key} value={option.key}>
                    {option.shortLabel}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            )}
            <ToggleButtonGroup
              value={rangeKey}
              exclusive
              size="small"
              onChange={handleRangeChange}
            >
              {rangeOptions.map((option) => (
                <ToggleButton key={option.key} value={option.key}>
                  {option.shortLabel}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Stack>
        </Box>

        {chartData.length === 0 ? (
          <Stack sx={{ minHeight: 230, alignItems: "center", justifyContent: "center" }}>
            <Typography color="text.secondary">Pas encore de données disponibles.</Typography>
          </Stack>
        ) : (
          <ResponsiveContainer width="100%" height={230}>
            <AreaChart data={chartData}>
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
                tickFormatter={formatMetricValue}
              />
              <ChartTooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}
                formatter={(value) => [formatMetricValue(value), selectedMetric.label]}
              />
              <Area type="monotone" dataKey="plottedValue" stroke="#6366f1" strokeWidth={2} fill="url(#colorValue)" />
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
              label: `Variation ${selectedMetric.label.toLowerCase()} (${rangeLabel})`,
              primary: formatSignedCurrency(changeValue, currency),
              secondary:
                changePercent === null
                  ? "—"
                  : `${changePercent >= 0 ? "+" : ""}${changePercent.toFixed(2)}%`,
              positive: changeValue >= 0,
            },
            {
              label: "Plus haut",
              primary: formatMetricValue(maxEntry?.plottedValue || 0),
              secondary: maxEntry?.date || "-",
              positive: true,
            },
            {
              label: "Plus bas",
              primary: formatMetricValue(minEntry?.plottedValue || 0),
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
});

export const AccountsList = memo(function AccountsList({ accounts = [], selectedAccountId, onSelectAccount }) {
  return (
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
});

export const RecentActivity = memo(function RecentActivity({
  trades = [],
  page = 1,
  pageSize = 5,
  onPageChange,
}) {
  const { totalPages, currentPage, pageItems } = useMemo(() => {
    const total = Math.max(1, Math.ceil(trades.length / pageSize));
    const safePage = Math.min(page, total);
    const startIndex = (safePage - 1) * pageSize;
    const slice = trades.slice(startIndex, startIndex + pageSize);
    return { totalPages: total, currentPage: safePage, pageItems: slice };
  }, [trades, page, pageSize]);

  const handlePageChange = useCallback((_, value) => {
    if (value === currentPage) return;
    onPageChange?.(value);
  }, [currentPage, onPageChange]);

  return (
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
          {pageItems.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Aucun trade n'a encore été enregistré.
            </Typography>
          ) : (
            pageItems.map((trade) => {
              const typeColor = trade.direction === "SELL" ? "#f59e0b" : "#10b981";
              const amountColor = trade.pnl >= 0 ? "#10b981" : "#ef4444";
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
                      {formatSignedCurrency(trade.pnl, trade.currency)}
                    </Typography>
                    <Chip
                      label={trade.pnl >= 0 ? "Gain confirmé" : "Perte"}
                      size="small"
                      sx={{
                        justifySelf: { xs: "flex-start", sm: "flex-end" },
                        bgcolor: trade.pnl >= 0 ? alpha("#10b981", 0.12) : alpha("#ef4444", 0.12),
                        color: trade.pnl >= 0 ? "#047857" : "#b91c1c",
                        fontWeight: 600,
                      }}
                    />
                  </Box>
                </Paper>
              );
            })
          )}
        </Stack>
        {trades.length > pageSize && (
          <Box sx={{ mt: 2, display: "flex", justifyContent: "center" }}>
            <Pagination
              count={totalPages}
              page={currentPage}
              onChange={handlePageChange}
              color="primary"
              size="small"
              shape="rounded"
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );
});

export const Goals = memo(function Goals({ goals = [] }) {
  return (
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
});

export const GoalInsights = memo(function GoalInsights({ insights = [] }) {
  return (
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
});

export const DASHBOARD_WIDGETS = {
  StatCard,
  PerformanceChart,
  AccountsList,
  RecentActivity,
  Goals,
  GoalInsights,
};
