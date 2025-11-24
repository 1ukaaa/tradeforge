import {
  Box,
  ButtonBase,
  Card,
  Chip,
  IconButton,
  Pagination,
  Stack,
  Tooltip,
  Typography,
  alpha,
  useTheme
} from "@mui/material";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { memo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  XAxis,
  YAxis
} from "recharts";

// Icons
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded';
import ArticleRoundedIcon from '@mui/icons-material/ArticleRounded';
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import MonetizationOnRoundedIcon from '@mui/icons-material/MonetizationOnRounded';
import MoreHorizRoundedIcon from "@mui/icons-material/MoreHorizRounded";
import ShowChartRoundedIcon from '@mui/icons-material/ShowChartRounded';
import TrendingDownRoundedIcon from "@mui/icons-material/TrendingDownRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";

// --- UTILS SECURISÉS ---
const formatCurrency = (value, currency) => {
  let safeCurrency = (currency && typeof currency === 'string') ? currency : "USD";
  safeCurrency = safeCurrency.trim().toUpperCase();
  try {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: safeCurrency }).format(value || 0);
  } catch (error) {
    return `${Number(value || 0).toFixed(2)} ${safeCurrency}`;
  }
};

// --- STYLED COMPONENTS ---
const AdaptiveCard = ({ children, sx, onClick, ...props }) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  return (
    <Card
      elevation={0}
      onClick={onClick}
      sx={{
        bgcolor: isDarkMode ? alpha(theme.palette.background.paper, 0.6) : '#FFFFFF',
        backdropFilter: isDarkMode ? "blur(12px)" : "none",
        border: `1px solid ${theme.palette.divider}`,
        boxShadow: isDarkMode ? 'none' : '0px 4px 20px rgba(0, 0, 0, 0.05)',
        borderRadius: 4,
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
        '&:hover': onClick ? {
          transform: 'translateY(-4px)',
          boxShadow: isDarkMode ? '0 8px 24px rgba(0,0,0,0.4)' : '0 12px 32px rgba(0, 0, 0, 0.1)',
          cursor: 'pointer'
        } : {},
        ...sx,
      }}
      {...props}
    >
      {children}
    </Card>
  );
};

// --- WIDGETS ---

export const StatCard = memo(({ label, value, type = "number", currency, trend, trendValue, suffix, icon }) => {
  const theme = useTheme();
  const isPositive = trend === 'positive';
  const isNegative = trend === 'negative';

  const trendColor = isPositive ? theme.palette.success.main
    : isNegative ? theme.palette.error.main
      : theme.palette.text.secondary;

  let formattedValue = value;
  if (type === 'currency') formattedValue = formatCurrency(value, currency);
  if (type === 'percent') formattedValue = `${Number(value).toFixed(2)}%`;

  // Determine icon based on label if not provided
  let IconComponent = AccountBalanceWalletRoundedIcon;
  if (label.toLowerCase().includes('profit')) IconComponent = MonetizationOnRoundedIcon;
  if (label.toLowerCase().includes('performance')) IconComponent = ShowChartRoundedIcon;
  if (label.toLowerCase().includes('win')) IconComponent = EmojiEventsRoundedIcon;

  return (
    <AdaptiveCard sx={{ p: 3, height: '100%', position: 'relative', overflow: 'hidden' }}>
      {/* Background Icon Decoration */}
      <Box sx={{
        position: 'absolute',
        right: -20,
        top: -20,
        opacity: 0.05,
        transform: 'rotate(-15deg)',
        pointerEvents: 'none'
      }}>
        <IconComponent sx={{ fontSize: 120, color: theme.palette.text.primary }} />
      </Box>

      <Stack spacing={2}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box sx={{
            p: 1.5,
            borderRadius: 3,
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            color: theme.palette.primary.main,
            display: 'inline-flex'
          }}>
            <IconComponent fontSize="small" />
          </Box>
          {(isPositive || isNegative) && (
            <Stack direction="row" alignItems="center" spacing={0.5} sx={{
              bgcolor: alpha(trendColor, 0.1),
              px: 1.5,
              py: 0.5,
              borderRadius: 2,
              border: `1px solid ${alpha(trendColor, 0.2)}`
            }}>
              {isPositive
                ? <TrendingUpRoundedIcon sx={{ fontSize: 16, color: trendColor }} />
                : <TrendingDownRoundedIcon sx={{ fontSize: 16, color: trendColor }} />
              }
              {trendValue !== undefined && trendValue !== null && (
                <Typography variant="caption" sx={{ color: trendColor, fontWeight: 700 }}>
                  {Math.abs(trendValue).toFixed(1)}%
                </Typography>
              )}
            </Stack>
          )}
        </Stack>

        <Box>
          <Typography variant="body2" color="text.secondary" fontWeight={600} sx={{ mb: 0.5 }}>
            {label}
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 700, letterSpacing: '-0.02em' }}>
            {formattedValue}
            {suffix && <Typography component="span" variant="h6" color="text.secondary" sx={{ ml: 0.5 }}>{suffix}</Typography>}
          </Typography>
        </Box>
      </Stack>
    </AdaptiveCard>
  );
});

export const PerformanceChart = memo(({ data, range, onRangeChange, rangeOptions, currentBalance, currency }) => {
  const theme = useTheme();

  const startValue = data.length > 0 ? data[0].value : 0;
  const endValue = data.length > 0 ? data[data.length - 1].value : 0;
  const isProfit = endValue >= startValue;

  const isDarkMode = theme.palette.mode === 'dark';
  const chartColor = isProfit ? "#10b981" : "#ef4444";
  const gradientStart = alpha(chartColor, isDarkMode ? 0.3 : 0.2);
  const gradientEnd = alpha(chartColor, 0);

  return (
    <AdaptiveCard sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Box sx={{ p: 3, pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Stack spacing={0.5}>
          <Typography variant="h6" fontWeight={700}>Évolution du Capital</Typography>
          <Typography variant="body2" color="text.secondary">Aperçu de la performance</Typography>
        </Stack>

        <Stack direction="row" spacing={0.5} sx={{ bgcolor: alpha(theme.palette.text.primary, 0.05), p: 0.5, borderRadius: 3 }}>
          {rangeOptions.map((opt) => (
            <ButtonBase
              key={opt.key}
              onClick={() => onRangeChange(opt.key)}
              sx={{
                px: 2, py: 0.75, borderRadius: 2.5,
                fontSize: '0.75rem', fontWeight: 600,
                color: range === opt.key ? 'primary.contrastText' : 'text.secondary',
                bgcolor: range === opt.key ? 'primary.main' : 'transparent',
                transition: 'all 0.2s',
                boxShadow: range === opt.key ? theme.shadows[2] : 'none',
              }}
            >
              {opt.label}
            </ButtonBase>
          ))}
        </Stack>
      </Box>

      <Box sx={{ flex: 1, width: '100%', px: 1, mt: 2 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={gradientStart} stopOpacity={1} />
                <stop offset="95%" stopColor={gradientEnd} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} strokeOpacity={0.5} />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: theme.palette.text.secondary, fontSize: 11, fontWeight: 500 }}
              dy={10}
              minTickGap={30}
            />
            <YAxis hide domain={['auto', 'auto']} />
            <RechartsTooltip
              contentStyle={{
                backgroundColor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 12,
                boxShadow: theme.shadows[4],
                padding: '12px'
              }}
              formatter={(val) => [<span style={{ fontWeight: 600, color: chartColor }}>{formatCurrency(val, currency)}</span>, 'Solde']}
              labelStyle={{ color: theme.palette.text.secondary, marginBottom: '4px', fontSize: '0.85rem' }}
              cursor={{ stroke: theme.palette.divider, strokeWidth: 1, strokeDasharray: '4 4' }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={chartColor}
              strokeWidth={3}
              fill="url(#chartGradient)"
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </Box>
    </AdaptiveCard>
  );
});

export const RecentActivity = memo(({ trades = [], page, setPage, pageSize }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const safeTrades = trades || [];
  const totalPages = Math.ceil(safeTrades.length / pageSize);
  const currentTrades = safeTrades.slice((page - 1) * pageSize, page * pageSize);

  const handleTradeClick = (trade) => {
    if (trade.journalEntryId) {
      navigate(`/journal?entryId=${trade.journalEntryId}`);
    } else {
      navigate('/journal');
    }
  };

  return (
    <AdaptiveCard>
      <Box sx={{ p: 3, borderBottom: `1px solid ${theme.palette.divider}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Stack spacing={0.5}>
          <Typography variant="h6" fontWeight={700}>Activité Récente</Typography>
          <Typography variant="body2" color="text.secondary">Vos derniers mouvements</Typography>
        </Stack>
        <ButtonBase
          onClick={() => navigate('/journal')}
          sx={{
            fontSize: '0.875rem',
            fontWeight: 600,
            color: 'primary.main',
            px: 1.5, py: 0.5,
            borderRadius: 2,
            '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.05) }
          }}
        >
          Voir tout
        </ButtonBase>
      </Box>

      {/* Table Header (Visible on Tablet+) */}
      <Box sx={{
        display: { xs: 'none', sm: 'grid' },
        gridTemplateColumns: '1.5fr 1fr 1fr auto',
        gap: 2,
        px: 3, py: 1.5,
        bgcolor: alpha(theme.palette.background.default, 0.5),
        borderBottom: `1px solid ${theme.palette.divider}`
      }}>
        <Typography variant="caption" fontWeight={700} color="text.secondary">INSTRUMENT</Typography>
        <Typography variant="caption" fontWeight={700} color="text.secondary">PRIX ENTRÉE</Typography>
        <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textAlign: 'right' }}>PERFORMANCE</Typography>
        <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textAlign: 'right' }}>P&L</Typography>
      </Box>

      <Stack spacing={0}>
        {currentTrades.length === 0 ? (
          <Box sx={{ p: 8, textAlign: 'center' }}>
            <Typography color="text.secondary">Aucun trade enregistré pour le moment.</Typography>
          </Box>
        ) : (
          currentTrades.map((trade, idx) => {
            const isWin = trade.pnl >= 0;
            const pnlColor = isWin ? theme.palette.success.main : theme.palette.error.main;
            const hasAnalysis = Boolean(trade.journalEntryId);

            return (
              <Box
                key={trade.id || idx}
                onClick={() => handleTradeClick(trade)}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr auto', sm: '1.5fr 1fr 1fr auto' },
                  gap: 2,
                  p: { xs: 2, sm: 2.5 },
                  px: { sm: 3 },
                  alignItems: 'center',
                  borderBottom: `1px solid ${theme.palette.divider}`,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:last-child': { borderBottom: 'none' },
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.02),
                  }
                }}
              >
                {/* Column 1: Asset & Date */}
                <Box>
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Box sx={{
                      width: 36, height: 36, borderRadius: 2,
                      bgcolor: alpha(trade.direction === 'SELL' ? theme.palette.warning.main : theme.palette.info.main, 0.1),
                      color: trade.direction === 'SELL' ? theme.palette.warning.main : theme.palette.info.main,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, fontSize: '0.7rem'
                    }}>
                      {trade.direction === 'SELL' ? 'S' : 'B'}
                    </Box>
                    <Box>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography variant="subtitle2" fontWeight={700}>
                          {trade.asset}
                        </Typography>
                        {hasAnalysis && (
                          <Tooltip title="Analyse disponible">
                            <ArticleRoundedIcon sx={{ fontSize: 14, color: theme.palette.primary.main }} />
                          </Tooltip>
                        )}
                      </Stack>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {trade.date ? format(new Date(trade.date), "dd MMM, HH:mm", { locale: fr }) : '-'}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>

                {/* Column 2: Entry Price */}
                <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                  <Typography variant="body2" fontWeight={600} sx={{ fontFamily: 'monospace', color: 'text.primary' }}>
                    {trade.entryPrice ? Number(trade.entryPrice).toFixed(3) : "-"}
                  </Typography>
                </Box>

                {/* Column 3: Gain % */}
                <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
                  <Chip
                    label={trade.gainPercent ? `${trade.gainPercent > 0 ? '+' : ''}${Number(trade.gainPercent).toFixed(2)}%` : '-'}
                    size="small"
                    sx={{
                      height: 24,
                      bgcolor: alpha(pnlColor, 0.1),
                      color: pnlColor,
                      fontWeight: 700,
                      border: 'none',
                      borderRadius: 1.5
                    }}
                  />
                </Box>

                {/* Column 4: PnL */}
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="body2" sx={{ color: pnlColor, fontWeight: 700, fontSize: '0.95rem' }}>
                    {trade.pnl > 0 ? '+' : ''}{formatCurrency(trade.pnl, trade.currency)}
                  </Typography>
                </Box>
              </Box>
            );
          })
        )}
      </Stack>
      {safeTrades.length > pageSize && (
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'center', borderTop: `1px solid ${theme.palette.divider}` }}>
          <Pagination count={totalPages} page={page} onChange={(_, p) => setPage(p)} size="small" shape="rounded" />
        </Box>
      )}
    </AdaptiveCard>
  );
});

export const AccountsList = memo(({ accounts = [], selectedId, onSelect }) => {
  const theme = useTheme();
  return (
    <AdaptiveCard>
      <Box sx={{ p: 3, pb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" fontWeight={700}>Comptes</Typography>
        <IconButton size="small" sx={{ color: 'text.secondary' }}>
          <MoreHorizRoundedIcon fontSize="small" />
        </IconButton>
      </Box>
      <Stack spacing={1.5} sx={{ px: 2, pb: 3 }}>
        {accounts.map(acc => {
          const isSelected = selectedId === acc.id;
          return (
            <ButtonBase
              key={acc.id}
              onClick={() => onSelect(acc.id)}
              sx={{
                width: '100%',
                justifyContent: 'space-between',
                p: 2, borderRadius: 3,
                bgcolor: isSelected ? alpha(theme.palette.primary.main, 0.08) : alpha(theme.palette.background.default, 0.5),
                border: `1px solid ${isSelected ? theme.palette.primary.main : 'transparent'}`,
                transition: 'all 0.2s',
                '&:hover': { bgcolor: theme.palette.action.hover, transform: 'scale(1.01)' }
              }}
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <Box sx={{
                  width: 40, height: 40, borderRadius: '50%',
                  bgcolor: alpha(acc.color || theme.palette.primary.main, 0.1),
                  color: acc.color || theme.palette.primary.main,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700,
                  border: `2px solid ${alpha(acc.color || theme.palette.primary.main, 0.2)}`
                }}>
                  {acc.name.charAt(0)}
                </Box>
                <Box sx={{ textAlign: 'left' }}>
                  <Typography variant="subtitle2" fontWeight={700}>{acc.name}</Typography>
                  <Typography variant="caption" color="text.secondary">{acc.platform || 'MT5'}</Typography>
                </Box>
              </Stack>
              <Typography variant="body2" fontWeight={700}>
                {formatCurrency(acc.currentBalance, acc.currency)}
              </Typography>
            </ButtonBase>
          )
        })}
      </Stack>
    </AdaptiveCard>
  )
});

export const Goals = memo(({ current = 0, target = 1, currency }) => {
  const safeTarget = target || 1;
  const progress = Math.min(100, Math.max(0, (current / safeTarget) * 100));
  const theme = useTheme();

  return (
    <AdaptiveCard sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h6" fontWeight={700}>Objectif Mensuel</Typography>
        <Chip
          label={`${progress.toFixed(0)}%`}
          size="small"
          sx={{
            bgcolor: alpha(theme.palette.success.main, 0.1),
            color: theme.palette.success.main,
            fontWeight: 700,
            border: 'none'
          }}
        />
      </Stack>

      <Stack direction="row" alignItems="baseline" spacing={1} sx={{ mb: 2 }}>
        <Typography variant="h3" fontWeight={700} sx={{ color: theme.palette.text.primary }}>
          {formatCurrency(current, currency)}
        </Typography>
        <Typography variant="body1" color="text.secondary" fontWeight={500}>
          / {formatCurrency(target, currency)}
        </Typography>
      </Stack>
      <Box sx={{ position: 'relative', height: 12, borderRadius: 6, bgcolor: alpha(theme.palette.text.primary, 0.05), overflow: 'hidden' }}>
        <Box sx={{
          position: 'absolute',
          left: 0, top: 0, bottom: 0,
          width: `${progress}%`,
          bgcolor: theme.palette.success.main,
          borderRadius: 6,
          transition: 'width 1s ease-out',
          boxShadow: `0 0 10px ${alpha(theme.palette.success.main, 0.5)}`
        }} />
      </Box>
    </AdaptiveCard>
  );
});

export const GoalInsights = memo(({ stats, trades = [] }) => {
  const theme = useTheme();
  if (!trades.length) return null;

  const lastTrade = trades[0];
  const isWinStreak = trades.slice(0, 3).length === 3 && trades.slice(0, 3).every(t => t.pnl > 0);

  return (
    <AdaptiveCard sx={{
      p: 3,
      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.background.paper, 0.5)} 100%)`,
      border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
      position: 'relative',
      overflow: 'hidden'
    }}>
      <Box sx={{
        position: 'absolute',
        top: -10, right: -10,
        width: 100, height: 100,
        background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.2)} 0%, transparent 70%)`,
        borderRadius: '50%',
        pointerEvents: 'none'
      }} />

      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
        <Box sx={{ p: 1, borderRadius: 2, bgcolor: theme.palette.primary.main, color: theme.palette.primary.contrastText }}>
          <AutoAwesomeRoundedIcon sx={{ fontSize: 20 }} />
        </Box>
        <Typography variant="subtitle1" fontWeight={700} color="text.primary">Conseil IA</Typography>
      </Stack>
      <Typography variant="body2" sx={{ lineHeight: 1.6, color: 'text.secondary', fontWeight: 500 }}>
        {isWinStreak
          ? "Excellente dynamique ! Vous êtes sur une série de 3 gains consécutifs. Gardez votre discipline."
          : lastTrade?.pnl < 0
            ? "Le dernier trade était une perte. Prenez un moment pour analyser votre plan avant de reprendre."
            : "La régularité est la clé du succès. Continuez à suivre votre stratégie avec rigueur."
        }
      </Typography>
    </AdaptiveCard>
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