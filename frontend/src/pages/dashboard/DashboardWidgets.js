import {
  Box,
  ButtonBase,
  Card,
  Chip,
  IconButton,
  LinearProgress,
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
import { useNavigate } from "react-router-dom"; // Import nécessaire pour la navigation
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
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import MoreHorizRoundedIcon from "@mui/icons-material/MoreHorizRounded";
import TrendingDownRoundedIcon from "@mui/icons-material/TrendingDownRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
// Nouvelles icônes pour le Journal
import ArticleRoundedIcon from '@mui/icons-material/ArticleRounded';
import NoteAddRoundedIcon from '@mui/icons-material/NoteAddRounded';

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
const AdaptiveCard = ({ children, sx, ...props }) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  return (
    <Card
      elevation={0}
      sx={{
        bgcolor: isDarkMode ? alpha(theme.palette.background.paper, 0.6) : '#FFFFFF',
        backdropFilter: isDarkMode ? "blur(12px)" : "none",
        border: `1px solid ${theme.palette.divider}`,
        boxShadow: isDarkMode ? 'none' : '0px 2px 12px rgba(0, 0, 0, 0.03)',
        borderRadius: 3,
        ...sx,
      }}
      {...props}
    >
      {children}
    </Card>
  );
};

// --- WIDGETS ---

export const StatCard = memo(({ label, value, type = "number", currency, trend, trendValue, suffix }) => {
  const theme = useTheme();
  const isPositive = trend === 'positive';
  const isNegative = trend === 'negative';
  
  const trendColor = isPositive ? theme.palette.success.main 
                   : isNegative ? theme.palette.error.main 
                   : theme.palette.text.secondary;

  let formattedValue = value;
  if (type === 'currency') formattedValue = formatCurrency(value, currency);
  if (type === 'percent') formattedValue = `${Number(value).toFixed(2)}%`;

  return (
    <AdaptiveCard sx={{ p: 2.5, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {label}
      </Typography>
      <Stack direction="row" alignItems="flex-end" justifyContent="space-between" sx={{ mt: 1 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
          {formattedValue} 
          {suffix && <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>{suffix}</Typography>}
        </Typography>
        
        {(isPositive || isNegative) && (
           <Stack direction="row" alignItems="center" spacing={0.5} sx={{ bgcolor: alpha(trendColor, 0.1), px: 1, py: 0.5, borderRadius: 1 }}>
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
        <Typography variant="h6" fontWeight={700}>Évolution du Capital</Typography>
        
        <Stack direction="row" spacing={0.5} sx={{ bgcolor: theme.palette.action.hover, p: 0.5, borderRadius: 2 }}>
          {rangeOptions.map((opt) => (
            <ButtonBase
              key={opt.key}
              onClick={() => onRangeChange(opt.key)}
              sx={{
                px: 1.5, py: 0.5, borderRadius: 1.5,
                fontSize: '0.75rem', fontWeight: 600,
                color: range === opt.key ? 'primary.contrastText' : 'text.secondary',
                bgcolor: range === opt.key ? 'primary.main' : 'transparent',
                transition: 'all 0.2s'
              }}
            >
              {opt.label}
            </ButtonBase>
          ))}
        </Stack>
      </Box>

      <Box sx={{ flex: 1, width: '100%', px: 1, mt: 1 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={gradientStart} stopOpacity={1} />
                <stop offset="95%" stopColor={gradientEnd} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: theme.palette.text.secondary, fontSize: 11 }} 
              dy={10}
              minTickGap={30}
            />
            <YAxis hide domain={['auto', 'auto']} />
            <RechartsTooltip 
              contentStyle={{ 
                backgroundColor: theme.palette.background.paper, 
                border: `1px solid ${theme.palette.divider}`, 
                borderRadius: 8,
                boxShadow: theme.shadows[3]
              }}
              formatter={(val) => [formatCurrency(val, currency), 'Solde']}
              labelStyle={{ color: theme.palette.text.secondary }}
            />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke={chartColor} 
              strokeWidth={3}
              fill="url(#chartGradient)" 
              animationDuration={1000}
            />
          </AreaChart>
        </ResponsiveContainer>
      </Box>
    </AdaptiveCard>
  );
});

export const RecentActivity = memo(({ trades = [], page, setPage, pageSize }) => {
  const theme = useTheme();
  const navigate = useNavigate(); // Hook pour la navigation
  const safeTrades = trades || [];
  const totalPages = Math.ceil(safeTrades.length / pageSize);
  const currentTrades = safeTrades.slice((page - 1) * pageSize, page * pageSize);

  const handleTradeClick = (trade) => {
    if (trade.journalEntryId) {
      // Redirection vers l'analyse existante
      navigate(`/journal?entryId=${trade.journalEntryId}`);
    } else {
      // Redirection vers le journal (pour créer potentiellement une analyse)
      navigate('/journal');
    }
  };

  return (
    <AdaptiveCard>
      <Box sx={{ p: 3, borderBottom: `1px solid ${theme.palette.divider}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" fontWeight={700}>Activité Récente</Typography>
        <IconButton size="small"><MoreHorizRoundedIcon /></IconButton>
      </Box>
      <Stack spacing={0}>
        {currentTrades.length === 0 ? (
          <Box sx={{ p: 6, textAlign: 'center' }}>
            <Typography color="text.secondary">Aucun trade enregistré.</Typography>
          </Box>
        ) : (
          currentTrades.map((trade, idx) => {
             const isWin = trade.pnl >= 0;
             const pnlColor = isWin ? theme.palette.success.main : theme.palette.error.main;
             const hasAnalysis = Boolean(trade.journalEntryId);
             
             return (
               <Box 
                key={trade.id || idx}
                onClick={() => handleTradeClick(trade)} // Rendre la ligne cliquable
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr auto', sm: '1.5fr 1fr 1fr auto' },
                  gap: 2,
                  p: 2.5,
                  alignItems: 'center',
                  borderBottom: `1px solid ${theme.palette.divider}`,
                  cursor: 'pointer', // Curseur main
                  transition: 'all 0.2s',
                  '&:last-child': { borderBottom: 'none' },
                  '&:hover': { 
                    bgcolor: theme.palette.action.hover,
                    transform: 'translateX(4px)' // Petit effet de glissement au survol
                  }
                }}
               >
                 <Box>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography variant="subtitle2" fontWeight={700}>
                        {trade.asset}
                      </Typography>
                      
                      {/* Badge Vente/Achat */}
                      <Chip 
                        label={trade.direction === 'SELL' ? 'SELL' : 'BUY'} 
                        size="small" 
                        sx={{ 
                          height: 20, 
                          fontSize: '0.65rem', 
                          fontWeight: 700, 
                          bgcolor: alpha(trade.direction === 'SELL' ? theme.palette.warning.main : theme.palette.info.main, 0.1), 
                          color: trade.direction === 'SELL' ? theme.palette.warning.main : theme.palette.info.main 
                        }} 
                      />

                      {/* Indicateur d'Analyse Journal */}
                      {hasAnalysis ? (
                        <Tooltip title="Analyse disponible (cliquer pour voir)">
                          <ArticleRoundedIcon sx={{ fontSize: 18, color: theme.palette.primary.main }} />
                        </Tooltip>
                      ) : (
                        <Tooltip title="Pas encore d'analyse">
                          <NoteAddRoundedIcon sx={{ fontSize: 18, color: theme.palette.action.disabled }} />
                        </Tooltip>
                      )}
                    </Stack>

                    <Typography variant="caption" color="text.secondary">
                      {trade.date ? format(new Date(trade.date), "dd MMM • HH:mm", { locale: fr }) : '-'}
                    </Typography>
                 </Box>

                 <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                   <Typography variant="caption" color="text.secondary" display="block">Prix</Typography>
                   <Typography variant="body2" fontWeight={500}>
                     {trade.entryPrice ? Number(trade.entryPrice).toFixed(3) : "-"}
                   </Typography>
                 </Box>

                 <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
                    <Typography variant="caption" color="text.secondary" display="block">Gain %</Typography>
                    <Typography variant="body2" sx={{ color: pnlColor, fontWeight: 600 }}>
                      {trade.gainPercent ? `${trade.gainPercent > 0 ? '+' : ''}${Number(trade.gainPercent).toFixed(2)}%` : '-'}
                    </Typography>
                 </Box>

                 <Box sx={{ textAlign: 'right' }}>
                   <Typography variant="body2" sx={{ color: pnlColor, fontWeight: 700 }}>
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
       <Box sx={{ p: 3, pb: 1 }}>
          <Typography variant="h6" fontWeight={700}>Comptes</Typography>
       </Box>
       <Stack spacing={1} sx={{ px: 2, pb: 2 }}>
         {accounts.map(acc => {
           const isSelected = selectedId === acc.id;
           return (
             <ButtonBase
               key={acc.id}
               onClick={() => onSelect(acc.id)}
               sx={{
                 width: '100%',
                 justifyContent: 'space-between',
                 p: 2, borderRadius: 2,
                 bgcolor: isSelected ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
                 border: `1px solid ${isSelected ? theme.palette.primary.main : 'transparent'}`,
                 transition: 'all 0.2s',
                 '&:hover': { bgcolor: theme.palette.action.hover }
               }}
             >
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box sx={{ 
                    width: 36, height: 36, borderRadius: '50%', 
                    bgcolor: alpha(acc.color, 0.1), color: acc.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700
                  }}>
                    {acc.name.charAt(0)}
                  </Box>
                  <Box sx={{ textAlign: 'left' }}>
                    <Typography variant="subtitle2" fontWeight={600}>{acc.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{acc.platform || 'MT5'}</Typography>
                  </Box>
                </Stack>
                <Typography variant="body2" fontWeight={600}>
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
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h6" fontWeight={700}>Objectif Mensuel</Typography>
        <Typography variant="caption" sx={{ fontWeight: 700, color: theme.palette.success.main, bgcolor: alpha(theme.palette.success.main, 0.1), px: 1, py: 0.5, borderRadius: 1 }}>
          {progress.toFixed(0)}%
        </Typography>
      </Stack>
      
      <Stack direction="row" alignItems="baseline" spacing={1} sx={{ mb: 1.5 }}>
        <Typography variant="h4" fontWeight={700}>
          {formatCurrency(current, currency)}
        </Typography>
        <Typography variant="body2" color="text.secondary">
            / {formatCurrency(target, currency)}
        </Typography>
      </Stack>
      <LinearProgress 
        variant="determinate" 
        value={progress} 
        sx={{ 
          height: 8, 
          borderRadius: 4, 
          bgcolor: theme.palette.action.hover,
          '& .MuiLinearProgress-bar': { borderRadius: 4, bgcolor: theme.palette.success.main }
        }} 
      />
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
      bgcolor: alpha(theme.palette.primary.main, 0.04),
      border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
    }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
        <AutoAwesomeRoundedIcon color="primary" sx={{ fontSize: 20 }} />
        <Typography variant="subtitle1" fontWeight={700} color="primary">Conseil IA</Typography>
      </Stack>
      <Typography variant="body2" sx={{ lineHeight: 1.6, color: 'text.secondary' }}>
        {isWinStreak 
          ? "Excellente dynamique ! Vous êtes sur une série de 3 gains consécutifs."
          : lastTrade?.pnl < 0 
            ? "Dernier trade perdant. Vérifiez votre plan avant de continuer."
            : "La régularité est la clé. Continuez ainsi."
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