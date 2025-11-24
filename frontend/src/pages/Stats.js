import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Grid,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  alpha,
  useTheme
} from "@mui/material";
import {
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  parseISO,
  startOfMonth,
  subMonths,
} from "date-fns";
import { fr } from "date-fns/locale";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

// Icons
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import EmojiEventsRoundedIcon from "@mui/icons-material/EmojiEventsRounded";
import FileDownloadRoundedIcon from "@mui/icons-material/FileDownloadRounded";
import FilterListRoundedIcon from "@mui/icons-material/FilterListRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import RemoveRoundedIcon from "@mui/icons-material/RemoveRounded";
import ShowChartRoundedIcon from "@mui/icons-material/ShowChartRounded";
import TrendingDownRoundedIcon from "@mui/icons-material/TrendingDownRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";

// Hooks
import { useDashboardSummary } from "../hooks/useDashboardSummary";

// =========================================================================
// UTILITIES
// =========================================================================

const formatCurrency = (value, currency = "USD") => {
  const absValue = Math.abs(value);
  const formatted = new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(absValue);
  const symbol = currency === "USD" ? "$" : "€";
  return value < 0 ? `-${symbol}${formatted}` : `${symbol}${formatted}`;
};

const formatPercent = (value) => {
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
};

// =========================================================================
// PREMIUM SECTION WRAPPER
// =========================================================================

const Section = ({ title, subtitle, action, children, icon }) => {
  const theme = useTheme();
  return (
    <Box sx={{ mb: 5 }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "flex-start" }}
        spacing={{ xs: 2, sm: 0 }}
        sx={{ mb: 3 }}
      >
        <Stack direction="row" spacing={{ xs: 1.5, sm: 2 }} alignItems="center">
          {icon && (
            <Box
              sx={{
                width: { xs: 36, sm: 40 },
                height: { xs: 36, sm: 40 },
                borderRadius: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: alpha(theme.palette.primary.main, 0.08),
                color: theme.palette.primary.main,
              }}
            >
              {icon}
            </Box>
          )}
          <Box>
            <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5, fontSize: { xs: "1.1rem", sm: "1.5rem" } }}>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}>
                {subtitle}
              </Typography>
            )}
          </Box>
        </Stack>
        {action}
      </Stack>
      {children}
    </Box>
  );
};

// =========================================================================
// METRIC CARD - SaaS Premium Style
// =========================================================================

const MetricCard = ({ label, value, delta, deltaType, sparkline, info }) => {
  const theme = useTheme();

  const getDeltaColor = () => {
    if (!deltaType) return theme.palette.text.secondary;
    if (deltaType === "positive") return theme.palette.success.main;
    if (deltaType === "negative") return theme.palette.error.main;
    return theme.palette.text.secondary;
  };

  const DeltaIcon = deltaType === "positive" ? TrendingUpRoundedIcon :
    deltaType === "negative" ? TrendingDownRoundedIcon :
      RemoveRoundedIcon;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        height: "100%",
        borderRadius: 2,
        border: `1px solid ${theme.palette.divider}`,
        bgcolor: theme.palette.background.paper,
        position: "relative",
        overflow: "hidden",
        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        "&:hover": {
          borderColor: alpha(theme.palette.primary.main, 0.3),
          boxShadow: `0 8px 24px ${alpha(theme.palette.common.black, 0.08)}`,
        },
      }}
    >
      <Stack spacing={2}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Typography
            variant="caption"
            sx={{
              color: "text.secondary",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            {label}
          </Typography>
          {info && (
            <Tooltip title={info} arrow>
              <InfoOutlinedIcon sx={{ fontSize: 16, color: "text.disabled" }} />
            </Tooltip>
          )}
        </Stack>

        <Typography variant="h4" fontWeight={700} sx={{ lineHeight: 1.2 }}>
          {value}
        </Typography>

        {delta !== undefined && (
          <Stack direction="row" spacing={0.5} alignItems="center">
            <DeltaIcon sx={{ fontSize: 16, color: getDeltaColor() }} />
            <Typography
              variant="body2"
              fontWeight={600}
              sx={{ color: getDeltaColor() }}
            >
              {delta}
            </Typography>
          </Stack>
        )}

        {sparkline && sparkline.length > 0 && (
          <Box sx={{ height: 40, mt: 1 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparkline}>
                <defs>
                  <linearGradient id={`gradient-${label}`} x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor={theme.palette.primary.main}
                      stopOpacity={0.2}
                    />
                    <stop
                      offset="95%"
                      stopColor={theme.palette.primary.main}
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={theme.palette.primary.main}
                  strokeWidth={1.5}
                  fill={`url(#gradient-${label})`}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        )}
      </Stack>
    </Paper>
  );
};

// =========================================================================
// HEATMAP CALENDAR - REDESIGNED PREMIUM VERSION
// =========================================================================

const HeatmapCalendar = ({ trades = [], currency = "USD" }) => {
  const theme = useTheme();
  const [period, setPeriod] = useState("current");

  const { calendarData, monthName, stats } = useMemo(() => {
    const now = new Date();
    let start, end;

    if (period === "current") {
      start = startOfMonth(now);
      end = endOfMonth(now);
    } else if (period === "last") {
      const lastMonth = subMonths(now, 1);
      start = startOfMonth(lastMonth);
      end = endOfMonth(lastMonth);
    } else {
      const twoMonthsAgo = subMonths(now, 2);
      start = startOfMonth(twoMonthsAgo);
      end = endOfMonth(twoMonthsAgo);
    }

    const days = eachDayOfInterval({ start, end });
    const tradesByDay = new Map();

    trades.forEach((trade) => {
      const date = parseISO(trade.date || trade.closedAt || trade.openedAt);
      const key = format(date, "yyyy-MM-dd");
      if (!tradesByDay.has(key)) tradesByDay.set(key, []);
      tradesByDay.get(key).push(trade);
    });

    const data = days.map((day) => {
      const key = format(day, "yyyy-MM-dd");
      const dayTrades = tradesByDay.get(key) || [];
      const pnl = dayTrades.reduce((sum, t) => sum + (Number(t.pnl) || 0), 0);
      return { date: day, pnl, count: dayTrades.length };
    });

    const totalPnl = data.reduce((sum, d) => sum + d.pnl, 0);
    const activeDays = data.filter(d => d.count > 0).length;
    const bestDay = data.reduce((best, d) => d.pnl > best.pnl ? d : best, { pnl: -Infinity });

    return {
      calendarData: data,
      monthName: format(start, "MMMM yyyy", { locale: fr }),
      stats: { totalPnl, activeDays, bestDay },
    };
  }, [trades, period]);

  const getStyles = (pnl) => {
    if (pnl === 0) {
      return {
        bg: alpha(theme.palette.text.primary, 0.025),
        border: theme.palette.divider,
        shadow: "none",
      };
    }

    const isProfit = pnl > 0;
    const baseColor = isProfit ? theme.palette.success.main : theme.palette.error.main;
    const intensity = Math.min(Math.abs(pnl) / 350, 1);

    return {
      bg: `linear-gradient(135deg, ${alpha(baseColor, 0.15 + intensity * 0.45)} 0%, ${alpha(baseColor, 0.25 + intensity * 0.55)} 100%)`,
      border: alpha(baseColor, 0.35 + intensity * 0.35),
      shadow: `0 3px 10px ${alpha(baseColor, 0.12 + intensity * 0.18)}`,
    };
  };

  const weeks = [];
  let week = [];
  const firstDay = getDay(calendarData[0]?.date || new Date());

  for (let i = 0; i < firstDay; i++) week.push(null);
  calendarData.forEach((day, idx) => {
    week.push(day);
    if (week.length === 7 || idx === calendarData.length - 1) {
      weeks.push([...week]);
      week = [];
    }
  });

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, sm: 3, md: 5 },
        borderRadius: 3,
        border: `1px solid ${theme.palette.divider}`,
        bgcolor: theme.palette.background.paper,
        background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${alpha(theme.palette.primary.main, 0.015)} 100%)`,
      }}
    >
      <Stack spacing={{ xs: 3, md: 4 }}>
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "flex-start" }} spacing={{ xs: 2, sm: 0 }}>
          <Box>
            <Typography
              variant="h5"
              fontWeight={800}
              sx={{
                mb: 1,
                textTransform: "capitalize",
                letterSpacing: "-0.01em",
              }}
            >
              {monthName}
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <Chip
                label={`${stats.activeDays} jour${stats.activeDays > 1 ? "s" : ""} actif${stats.activeDays > 1 ? "s" : ""}`}
                size="small"
                sx={{
                  fontWeight: 600,
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                  color: theme.palette.primary.main,
                }}
              />
              <Typography variant="body2" fontWeight={700}>
                {formatCurrency(stats.totalPnl, currency)}
              </Typography>
            </Stack>
          </Box>
          <ToggleButtonGroup
            value={period}
            exclusive
            onChange={(e, val) => val && setPeriod(val)}
            size="small"
            orientation="horizontal"
            sx={{
              width: { xs: "100%", sm: "auto" },
              "& .MuiToggleButton-root": {
                px: { xs: 1.5, sm: 2.5 },
                py: { xs: 0.75, sm: 1 },
                fontSize: { xs: "0.75rem", sm: "0.85rem" },
                fontWeight: 600,
                textTransform: "none",
                border: `1.5px solid ${theme.palette.divider}`,
                flex: { xs: 1, sm: "initial" },
                "&.Mui-selected": {
                  bgcolor: theme.palette.primary.main,
                  color: theme.palette.primary.contrastText,
                  borderColor: theme.palette.primary.main,
                  "&:hover": {
                    bgcolor: theme.palette.primary.dark,
                  },
                },
              },
            }}
          >
            <ToggleButton value="current">Actuel</ToggleButton>
            <ToggleButton value="last">Mois -1</ToggleButton>
            <ToggleButton value="previous">Mois -2</ToggleButton>
          </ToggleButtonGroup>
        </Stack>

        <Box>
          <Grid container spacing={1.5} sx={{ mb: 2 }}>
            {["DIM", "LUN", "MAR", "MER", "JEU", "VEN", "SAM"].map((d, i) => (
              <Grid item xs={12 / 7} key={i}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  fontWeight={700}
                  sx={{
                    display: "block",
                    textAlign: "center",
                    fontSize: "0.65rem",
                    letterSpacing: "0.08em",
                  }}
                >
                  {d}
                </Typography>
              </Grid>
            ))}
          </Grid>

          <Stack spacing={1.5}>
            {weeks.map((week, wIdx) => (
              <Grid container spacing={1.5} key={wIdx}>
                {week.map((day, dIdx) => {
                  if (!day) {
                    return (
                      <Grid item xs={12 / 7} key={dIdx}>
                        <Box sx={{ paddingTop: "100%" }} />
                      </Grid>
                    );
                  }

                  const styles = getStyles(day.pnl);
                  const isToday = format(day.date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");

                  return (
                    <Grid item xs={12 / 7} key={dIdx}>
                      <Tooltip
                        arrow
                        placement="top"
                        title={
                          <Stack spacing={0.5} sx={{ p: 0.75 }}>
                            <Typography variant="body2" fontWeight={700}>
                              {format(day.date, "EEEE d MMMM", { locale: fr })}
                            </Typography>
                            {day.count > 0 ? (
                              <>
                                <Typography variant="caption" color="text.secondary">
                                  {day.count} trade{day.count > 1 ? "s" : ""}
                                </Typography>
                                <Typography
                                  variant="body2"
                                  fontWeight={700}
                                  sx={{
                                    color: day.pnl >= 0
                                      ? theme.palette.success.main
                                      : theme.palette.error.main,
                                  }}
                                >
                                  {formatCurrency(day.pnl, currency)}
                                </Typography>
                              </>
                            ) : (
                              <Typography variant="caption" color="text.secondary">
                                Aucun trade
                              </Typography>
                            )}
                          </Stack>
                        }
                      >
                        <Box
                          sx={{
                            position: "relative",
                            paddingTop: "100%",
                            borderRadius: 2,
                            background: styles.bg,
                            border: `2px solid ${styles.border}`,
                            boxShadow: styles.shadow,
                            cursor: "pointer",
                            transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                            ...(isToday && {
                              outline: `3px solid ${theme.palette.primary.main}`,
                              outlineOffset: 2,
                            }),
                            "&:hover": {
                              transform: "scale(1.08) translateY(-3px)",
                              zIndex: 10,
                              boxShadow: day.pnl === 0
                                ? theme.shadows[8]
                                : `0 12px 28px ${alpha(
                                  day.pnl >= 0 ? theme.palette.success.main : theme.palette.error.main,
                                  0.3
                                )}`,
                              border: `2px solid ${day.pnl >= 0 ? theme.palette.success.main :
                                day.pnl < 0 ? theme.palette.error.main :
                                  theme.palette.divider
                                }`,
                            },
                          }}
                        >
                          <Box
                            sx={{
                              position: "absolute",
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexDirection: "column",
                            }}
                          >
                            <Typography
                              variant="body2"
                              fontWeight={800}
                              sx={{
                                fontSize: "0.9rem",
                                color: day.pnl === 0
                                  ? "text.secondary"
                                  : day.pnl > 0
                                    ? theme.palette.success.dark
                                    : theme.palette.error.dark,
                              }}
                            >
                              {format(day.date, "d")}
                            </Typography>
                          </Box>
                        </Box>
                      </Tooltip>
                    </Grid>
                  );
                })}
              </Grid>
            ))}
          </Stack>
        </Box>

        <Stack
          direction="row"
          spacing={4}
          sx={{
            pt: 3,
            borderTop: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                width: 20,
                height: 20,
                borderRadius: 1.5,
                background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.6)} 0%, ${alpha(theme.palette.success.main, 0.8)} 100%)`,
                border: `2px solid ${alpha(theme.palette.success.main, 0.5)}`,
                boxShadow: `0 2px 8px ${alpha(theme.palette.success.main, 0.2)}`,
              }}
            />
            <Typography variant="body2" fontWeight={600} color="text.secondary">
              Gains
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                width: 20,
                height: 20,
                borderRadius: 1.5,
                background: `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.6)} 0%, ${alpha(theme.palette.error.main, 0.8)} 100%)`,
                border: `2px solid ${alpha(theme.palette.error.main, 0.5)}`,
                boxShadow: `0 2px 8px ${alpha(theme.palette.error.main, 0.2)}`,
              }}
            />
            <Typography variant="body2" fontWeight={600} color="text.secondary">
              Pertes
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                width: 20,
                height: 20,
                borderRadius: 1.5,
                bgcolor: alpha(theme.palette.text.primary, 0.025),
                border: `2px solid ${theme.palette.divider}`,
              }}
            />
            <Typography variant="body2" fontWeight={600} color="text.secondary">
              Aucun trade
            </Typography>
          </Stack>
        </Stack>
      </Stack>
    </Paper>
  );
};

// =========================================================================
// PERFORMANCE BREAKDOWN CHART
// =========================================================================

const PerformanceBreakdown = ({ trades = [], currency = "USD" }) => {
  const theme = useTheme();

  const data = useMemo(() => {
    const days = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
    const stats = Array(7).fill(0).map(() => ({ pnl: 0, count: 0, wins: 0 }));

    trades.forEach((trade) => {
      const dayIdx = getDay(parseISO(trade.date || trade.closedAt || trade.openedAt));
      const pnl = Number(trade.pnl) || 0;
      stats[dayIdx].pnl += pnl;
      stats[dayIdx].count += 1;
      if (pnl >= 0) stats[dayIdx].wins += 1;
    });

    return days.map((day, idx) => ({
      day,
      pnl: stats[idx].pnl,
      trades: stats[idx].count,
      winRate: stats[idx].count > 0 ? (stats[idx].wins / stats[idx].count) * 100 : 0,
    }));
  }, [trades]);

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, sm: 3, md: 4 },
        height: "100%",
        borderRadius: 2,
        border: `1px solid ${theme.palette.divider}`,
        bgcolor: theme.palette.background.paper,
      }}
    >
      <Stack spacing={3}>
        <Box>
          <Typography variant="h6" fontWeight={700} gutterBottom sx={{ fontSize: { xs: "1rem", sm: "1.25rem" } }}>
            Performance Hebdomadaire
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: "0.7rem", sm: "0.75rem" } }}>
            Distribution du P&L par jour de la semaine
          </Typography>
        </Box>

        <ResponsiveContainer width="100%" height={{ xs: 220, sm: 280 }}>
          <ComposedChart data={data}>
            <defs>
              <linearGradient id="winRateGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={theme.palette.warning.main} stopOpacity={0.8} />
                <stop offset="95%" stopColor={theme.palette.warning.main} stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={theme.palette.divider}
              vertical={false}
            />
            <XAxis
              dataKey="day"
              tick={{ fill: theme.palette.text.secondary, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              yAxisId="left"
              tick={{ fill: theme.palette.text.secondary, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fill: theme.palette.text.secondary, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <RechartsTooltip
              contentStyle={{
                backgroundColor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 8,
                boxShadow: theme.shadows[4],
              }}
              formatter={(val, name) => {
                if (name === "pnl") return [formatCurrency(val, currency), "P&L"];
                if (name === "winRate") return [`${val.toFixed(1)}%`, "Win Rate"];
                return [val, name];
              }}
            />
            <Bar
              yAxisId="left"
              dataKey="pnl"
              radius={[4, 4, 0, 0]}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.pnl >= 0 ? theme.palette.success.main : theme.palette.error.main}
                />
              ))}
            </Bar>
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="winRate"
              stroke={theme.palette.warning.main}
              strokeWidth={2}
              dot={{ fill: theme.palette.warning.main, r: 4 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </Stack>
    </Paper>
  );
};

// =========================================================================
// TOP PERFORMERS TABLE
// =========================================================================

const TopPerformersTable = ({ trades = [], currency = "USD" }) => {
  const theme = useTheme();

  const data = useMemo(() => {
    const stats = new Map();
    trades.forEach((trade) => {
      const symbol = trade.symbol || "Unknown";
      if (!stats.has(symbol)) {
        stats.set(symbol, { pnl: 0, wins: 0, total: 0, volume: 0 });
      }
      const s = stats.get(symbol);
      const pnl = Number(trade.pnl) || 0;
      s.pnl += pnl;
      s.total += 1;
      s.volume += Math.abs(pnl);
      if (pnl >= 0) s.wins += 1;
    });

    return Array.from(stats.entries())
      .map(([symbol, s]) => ({
        symbol,
        pnl: s.pnl,
        winRate: (s.wins / s.total) * 100,
        trades: s.total,
        avgTrade: s.pnl / s.total,
      }))
      .sort((a, b) => b.pnl - a.pnl)
      .slice(0, 8);
  }, [trades]);

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 2,
        border: `1px solid ${theme.palette.divider}`,
        bgcolor: theme.palette.background.paper,
        overflow: "hidden",
      }}
    >
      <Box sx={{ p: { xs: 2, sm: 3 }, borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Typography variant="h6" fontWeight={700} gutterBottom sx={{ fontSize: { xs: "1rem", sm: "1.25rem" } }}>
          Top Instruments
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: "0.7rem", sm: "0.75rem" } }}>
          Classement par profit total
        </Typography>
      </Box>

      {/* Mobile View: Card layout */}
      <Box sx={{ display: { xs: "block", md: "none" } }}>
        <Stack spacing={0}>
          {data.map((row, idx) => (
            <Box
              key={idx}
              sx={{
                p: 2,
                borderBottom: `1px solid ${theme.palette.divider}`,
                "&:last-child": { borderBottom: "none" },
                "&:hover": {
                  bgcolor: alpha(theme.palette.primary.main, 0.02),
                },
              }}
            >
              <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1.5 }}>
                <Chip
                  label={idx + 1}
                  size="small"
                  sx={{
                    width: 28,
                    height: 28,
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    bgcolor: idx === 0
                      ? alpha(theme.palette.warning.main, 0.15)
                      : alpha(theme.palette.text.primary, 0.05),
                    color: idx === 0 ? theme.palette.warning.main : "text.secondary",
                  }}
                />
                <Typography variant="subtitle1" fontWeight={700}>
                  {row.symbol}
                </Typography>
              </Stack>
              <Grid container spacing={1.5}>
                <Grid item xs={4}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                    Trades
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {row.trades}
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                    Win Rate
                  </Typography>
                  <Chip
                    label={`${row.winRate.toFixed(0)}%`}
                    size="small"
                    sx={{
                      fontSize: "0.7rem",
                      fontWeight: 600,
                      height: 24,
                      bgcolor: alpha(
                        row.winRate >= 50 ? theme.palette.success.main : theme.palette.error.main,
                        0.1
                      ),
                      color: row.winRate >= 50 ? theme.palette.success.main : theme.palette.error.main,
                    }}
                  />
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                    P&L Total
                  </Typography>
                  <Typography
                    variant="body2"
                    fontWeight={700}
                    sx={{
                      color: row.pnl >= 0 ? theme.palette.success.main : theme.palette.error.main,
                    }}
                  >
                    {formatCurrency(row.pnl, currency)}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          ))}
        </Stack>
      </Box>

      {/* Desktop View: Table layout */}
      <TableContainer sx={{ display: { xs: "none", md: "block" } }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem", color: "text.secondary" }}>
                #
              </TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem", color: "text.secondary" }}>
                INSTRUMENT
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, fontSize: "0.75rem", color: "text.secondary" }}>
                TRADES
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, fontSize: "0.75rem", color: "text.secondary" }}>
                WIN RATE
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, fontSize: "0.75rem", color: "text.secondary" }}>
                P&L TOTAL
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row, idx) => (
              <TableRow
                key={idx}
                sx={{
                  "&:hover": {
                    bgcolor: alpha(theme.palette.primary.main, 0.02),
                  },
                }}
              >
                <TableCell>
                  <Chip
                    label={idx + 1}
                    size="small"
                    sx={{
                      width: 28,
                      height: 28,
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      bgcolor: idx === 0
                        ? alpha(theme.palette.warning.main, 0.15)
                        : alpha(theme.palette.text.primary, 0.05),
                      color: idx === 0 ? theme.palette.warning.main : "text.secondary",
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight={600}>
                    {row.symbol}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" color="text.secondary">
                    {row.trades}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Chip
                    label={`${row.winRate.toFixed(0)}%`}
                    size="small"
                    sx={{
                      fontSize: "0.7rem",
                      fontWeight: 600,
                      bgcolor: alpha(
                        row.winRate >= 50 ? theme.palette.success.main : theme.palette.error.main,
                        0.1
                      ),
                      color: row.winRate >= 50 ? theme.palette.success.main : theme.palette.error.main,
                    }}
                  />
                </TableCell>
                <TableCell align="right">
                  <Typography
                    variant="body1"
                    fontWeight={700}
                    sx={{
                      color: row.pnl >= 0 ? theme.palette.success.main : theme.palette.error.main,
                    }}
                  >
                    {formatCurrency(row.pnl, currency)}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

// =========================================================================
// AI INSIGHTS CARD
// =========================================================================

const AIInsights = ({ stats }) => {
  const theme = useTheme();

  const insights = useMemo(() => {
    const items = [];

    if (stats.winRate >= 60) {
      items.push({
        type: "success",
        title: "Excellent Win Rate",
        message: `Avec ${stats.winRate.toFixed(1)}%, vous êtes au-dessus de la moyenne du marché (50-55%).`,
      });
    } else if (stats.winRate < 45) {
      items.push({
        type: "warning",
        title: "Win Rate à améliorer",
        message: "Concentrez-vous sur la qualité des setups plutôt que la quantité.",
      });
    }

    if (stats.profitFactor >= 2) {
      items.push({
        type: "success",
        title: "Profit Factor exceptionnel",
        message: "Vous gagnez 2x plus que vous ne perdez. Continuez ainsi !",
      });
    }

    if (stats.bestDay !== "N/A") {
      items.push({
        type: "info",
        title: `Meilleur jour: ${stats.bestDay}`,
        message: "Concentrez vos efforts sur ce jour pour maximiser vos profits.",
      });
    }

    return items;
  }, [stats]);

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, sm: 3, md: 4 },
        borderRadius: 2,
        border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
        bgcolor: alpha(theme.palette.primary.main, 0.02),
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: -20,
          right: -20,
          width: 120,
          height: 120,
          borderRadius: "50%",
          bgcolor: alpha(theme.palette.primary.main, 0.05),
        }}
      />

      <Stack spacing={3}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              p: { xs: 1, sm: 1.5 },
              borderRadius: 2,
              bgcolor: theme.palette.primary.main,
              color: theme.palette.primary.contrastText,
            }}
          >
            <AutoAwesomeRoundedIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={700} sx={{ fontSize: { xs: "1rem", sm: "1.25rem" } }}>
              Insights IA
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: "0.7rem", sm: "0.75rem" } }}>
              Recommandations personnalisées
            </Typography>
          </Box>
        </Stack>

        <Stack spacing={2}>
          {insights.map((insight, idx) => (
            <Box key={idx}>
              <Typography variant="body2" fontWeight={700} gutterBottom sx={{ fontSize: { xs: "0.8rem", sm: "0.875rem" } }}>
                {insight.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}>
                {insight.message}
              </Typography>
            </Box>
          ))}
        </Stack>
      </Stack>
    </Paper>
  );
};

// =========================================================================
// MAIN STATS PAGE
// =========================================================================

export default function StatsPage() {
  const theme = useTheme();
  const { loading, error, trades, aggregate } = useDashboardSummary();

  const stats = useMemo(() => {
    if (!trades.length || !aggregate) {
      return {
        totalTrades: 0,
        winRate: 0,
        profitFactor: 0,
        expectancy: 0,
        avgWin: 0,
        avgLoss: 0,
        largestWin: 0,
        bestDay: "N/A",
      };
    }

    const wins = trades.filter((t) => (Number(t.pnl) || 0) >= 0);
    const losses = trades.filter((t) => (Number(t.pnl) || 0) < 0);
    const totalWins = wins.reduce((sum, t) => sum + (Number(t.pnl) || 0), 0);
    const totalLosses = Math.abs(losses.reduce((sum, t) => sum + (Number(t.pnl) || 0), 0));

    const dayStats = new Map();
    trades.forEach(t => {
      const day = getDay(parseISO(t.date || t.closedAt || t.openedAt));
      if (!dayStats.has(day)) dayStats.set(day, 0);
      dayStats.set(day, dayStats.get(day) + (Number(t.pnl) || 0));
    });
    const bestDayIdx = Array.from(dayStats.entries()).sort((a, b) => b[1] - a[1])[0]?.[0];
    const dayNames = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

    return {
      totalTrades: trades.length,
      winRate: (wins.length / trades.length) * 100,
      profitFactor: totalLosses > 0 ? totalWins / totalLosses : 0,
      expectancy: (totalWins - totalLosses) / trades.length,
      avgWin: wins.length > 0 ? totalWins / wins.length : 0,
      avgLoss: losses.length > 0 ? totalLosses / losses.length : 0,
      largestWin: wins.length > 0 ? Math.max(...wins.map((t) => Number(t.pnl) || 0)) : 0,
      bestDay: bestDayIdx !== undefined ? dayNames[bestDayIdx] : "N/A",
    };
  }, [trades, aggregate]);

  const sparklineData = useMemo(() => {
    return trades.slice(0, 30).reverse().map(t => ({ value: Number(t.pnl) || 0 }));
  }, [trades]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "70vh" }}>
        <Stack spacing={2} alignItems="center">
          <CircularProgress size={48} thickness={4} />
          <Typography variant="body2" color="text.secondary">
            Chargement des statistiques...
          </Typography>
        </Stack>
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ pt: 4 }}>
        <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>
      </Container>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", pb: 8, bgcolor: "background.default" }}>
      <Container maxWidth="xl" sx={{ pt: { xs: 2, md: 4 }, px: { xs: 2, sm: 3 } }}>

        {/* Premium Header */}
        <Box sx={{ mb: 5 }}>
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "flex-start" }} spacing={{ xs: 2, sm: 0 }} sx={{ mb: 1 }}>
            <Box>
              <Typography
                variant="h3"
                fontWeight={800}
                sx={{ mb: 1, fontSize: { xs: "1.75rem", sm: "2.5rem" } }}
              >
                Statistiques
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}>
                Analyse approfondie de vos performances de trading
              </Typography>
            </Box>
            <Stack direction={{ xs: "row", sm: "row" }} spacing={1} sx={{ width: { xs: "100%", sm: "auto" } }}>
              <Button
                variant="outlined"
                startIcon={<FilterListRoundedIcon />}
                size="medium"
                sx={{ borderRadius: 2, flex: { xs: 1, sm: "initial" }, fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
              >
                Filtres
              </Button>
              <Button
                variant="outlined"
                startIcon={<FileDownloadRoundedIcon />}
                size="medium"
                sx={{ borderRadius: 2, flex: { xs: 1, sm: "initial" }, fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
              >
                Exporter
              </Button>
            </Stack>
          </Stack>
          <Divider sx={{ mt: 3 }} />
        </Box>

        <Stack spacing={5}>

          {/* Key Metrics */}
          <Box>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <MetricCard
                  label="Total Trades"
                  value={stats.totalTrades}
                  delta="+12 ce mois"
                  deltaType="positive"
                  sparkline={sparklineData}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <MetricCard
                  label="Win Rate"
                  value={`${stats.winRate.toFixed(1)}%`}
                  delta={formatPercent(stats.winRate >= 50 ? 2.3 : -1.5)}
                  deltaType={stats.winRate >= 50 ? "positive" : "negative"}
                  info="Pourcentage de trades gagnants"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <MetricCard
                  label="Profit Factor"
                  value={stats.profitFactor.toFixed(2)}
                  delta={stats.profitFactor >= 1.5 ? "Excellent" : "Moyen"}
                  deltaType={stats.profitFactor >= 1.5 ? "positive" : "neutral"}
                  info="Ratio gains totaux / pertes totales"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <MetricCard
                  label="Expectancy"
                  value={formatCurrency(stats.expectancy, aggregate?.currency)}
                  delta="Par trade"
                  deltaType={stats.expectancy >= 0 ? "positive" : "negative"}
                  info="Gain moyen espéré par trade"
                />
              </Grid>
            </Grid>
          </Box>

          {/* Calendar Heatmap */}
          <Section
            title="Activité Quotidienne"
            subtitle="Vue calendrier de vos performances"
            icon={<CalendarMonthRoundedIcon />}
          >
            <HeatmapCalendar trades={trades} currency={aggregate?.currency} />
          </Section>

          {/* Performance Analysis */}
          <Section
            title="Analyse Détaillée"
            subtitle="Décomposition par période et instrument"
            icon={<ShowChartRoundedIcon />}
          >
            <Grid container spacing={3}>
              <Grid item xs={12} lg={7}>
                <PerformanceBreakdown trades={trades} currency={aggregate?.currency} />
              </Grid>
              <Grid item xs={12} lg={5}>
                <AIInsights stats={stats} />
              </Grid>
            </Grid>
          </Section>

          {/* Top Performers */}
          <Section
            title="Top Performers"
            subtitle="Instruments les plus rentables"
            icon={<EmojiEventsRoundedIcon />}
          >
            <TopPerformersTable trades={trades} currency={aggregate?.currency} />
          </Section>

        </Stack>
      </Container>
    </Box>
  );
}
