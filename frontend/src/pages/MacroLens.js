// frontend/src/pages/MacroLens.js
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import AutorenewRoundedIcon from '@mui/icons-material/AutorenewRounded';
import BookmarkRoundedIcon from '@mui/icons-material/BookmarkRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import LocalFireDepartmentRoundedIcon from '@mui/icons-material/LocalFireDepartmentRounded';
import NewspaperRoundedIcon from '@mui/icons-material/NewspaperRounded';
import PushPinRoundedIcon from '@mui/icons-material/PushPinRounded';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import ShowChartRoundedIcon from '@mui/icons-material/ShowChartRounded';
import TrendingDownRoundedIcon from '@mui/icons-material/TrendingDownRounded';
import TrendingFlatRoundedIcon from '@mui/icons-material/TrendingFlatRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import TwitterIcon from '@mui/icons-material/Twitter';
import WorkspacesRoundedIcon from '@mui/icons-material/WorkspacesRounded';

import {
  alpha,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Stack,
  Tab,
  Tabs,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Area, AreaChart, CartesianGrid,
  ResponsiveContainer, Tooltip as RechartTooltip, XAxis, YAxis,
} from 'recharts';

import { buildApiUrl } from '../config/apiConfig';

// ─── Constants ────────────────────────────────────────────────────────────────

const MACRO_TABS = [
  { key: 'indicators', label: 'Indicateurs', icon: <ShowChartRoundedIcon fontSize="small" /> },
  { key: 'newsfeed',   label: 'Bloomberg Feed', icon: <NewspaperRoundedIcon fontSize="small" /> },
];

const CATEGORIES = [
  { key: 'all',         label: 'Tout',                        icon: <WorkspacesRoundedIcon fontSize="small" /> },
  { key: 'inflation',   label: 'Inflation',                   icon: <LocalFireDepartmentRoundedIcon fontSize="small" /> },
  { key: 'employment',  label: 'Emploi',                      icon: <ShowChartRoundedIcon fontSize="small" /> },
  { key: 'monetary',    label: 'Politique Monétaire',         icon: <ShowChartRoundedIcon fontSize="small" /> },
  { key: 'growth',      label: 'Croissance',                  icon: <ShowChartRoundedIcon fontSize="small" /> },
  { key: 'commodities', label: 'Matières premières & Métaux', icon: <ShowChartRoundedIcon fontSize="small" /> },
];

const IMPORTANCE_LABELS = {
  high:   { label: 'Critique', color: '#ef4444' },
  medium: { label: 'Majeur',   color: '#f97316' },
  low:    { label: 'Mineur',   color: '#6b7280' },
};

const SENTIMENT_OPTIONS = [
  { value: 'bullish',  label: '🟢 Bullish',  color: '#22c55e' },
  { value: 'bearish',  label: '🔴 Bearish',  color: '#ef4444' },
  { value: 'neutral',  label: '🟡 Neutre',   color: '#eab308' },
  { value: 'watch',    label: '👁 À surveiller', color: '#6366f1' },
];

const DEFAULT_FEED_HANDLES = [
  { handle: 'deitaone',    label: '@DeItaone (Bloomberg)' },
  { handle: 'markets',     label: 'Bloomberg Markets' },
  { handle: 'economics',   label: 'Bloomberg Eco' },
  { handle: 'WSJmarkets',  label: 'WSJ Markets' },
  { handle: 'ReutersBiz',  label: 'Reuters Biz' },
];

// ─── Utility Functions ────────────────────────────────────────────────────────

const formatDate = (dateStr, frequency) => {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  if (frequency === 'quarterly') {
    return `Q${Math.floor(date.getMonth() / 3) + 1} ${date.getFullYear()}`;
  }
  if (frequency === 'weekly' || frequency === 'daily') {
    return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
  }
  return new Intl.DateTimeFormat('fr-FR', { month: 'short', year: 'numeric' }).format(date);
};

const formatNoteDate = (iso) => {
  if (!iso) return '';
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
};

const formatValue = (value, unit) => {
  if (value === null || value === undefined || isNaN(value)) return '—';
  const num = Number(value);
  if (unit === '%') return `${num.toFixed(2)}%`;
  if (unit.includes('Milliards')) return `$${(num / 1000).toFixed(1)}T`;
  if (unit.includes('Millions') || unit.includes('Milliers')) return new Intl.NumberFormat('fr-FR').format(Math.round(num));
  if (unit.includes('$')) return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
  return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 2 }).format(num);
};

const computeTrend = (observations) => {
  if (!observations || observations.length < 3) return 'flat';
  const recent = observations.slice(-3);
  const first = recent[0]?.value;
  const last  = recent[recent.length - 1]?.value;
  if (first === undefined || last === undefined || isNaN(first) || isNaN(last)) return 'flat';
  const pct = Math.abs((last - first) / first) * 100;
  if (pct < 0.3) return 'flat';
  return last > first ? 'up' : 'down';
};

const computeVariation = (observations) => {
  if (!observations || observations.length < 2) return null;
  const prev = observations[observations.length - 2]?.value;
  const curr = observations[observations.length - 1]?.value;
  if (!prev || !curr || isNaN(prev) || isNaN(curr)) return null;
  return ((curr - prev) / Math.abs(prev)) * 100;
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const TrendIcon = ({ trend }) => {
  if (trend === 'up')   return <TrendingUpRoundedIcon   fontSize="small" sx={{ color: '#22c55e' }} />;
  if (trend === 'down') return <TrendingDownRoundedIcon fontSize="small" sx={{ color: '#ef4444' }} />;
  return <TrendingFlatRoundedIcon fontSize="small" sx={{ color: '#6b7280' }} />;
};

const CustomTooltip = ({ active, payload, label, unit, frequency }) => {
  if (!active || !payload?.length) return null;
  return (
    <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', minWidth: 150 }}>
      <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
        {formatDate(label, frequency)}
      </Typography>
      <Typography variant="body2" fontWeight={700} sx={{ mt: 0.5, color: payload[0]?.color }}>
        {formatValue(payload[0]?.value, unit)}
      </Typography>
    </Paper>
  );
};

const IndicatorCard = ({ indicator, theme, onRefresh, refreshing }) => {
  const { observations = [], label, shortLabel, unit, frequency, description, color, importance, error, key } = indicator;

  const trend     = useMemo(() => computeTrend(observations), [observations]);
  const variation = useMemo(() => computeVariation(observations), [observations]);
  const latestObs = observations[observations.length - 1];
  const prevObs   = observations.length > 1 ? observations[observations.length - 2] : null;
  const chartData = useMemo(() => observations.slice(-28).map(o => ({ date: o.date, value: o.value })), [observations]);
  const minVal    = useMemo(() => Math.min(...chartData.map(d => d.value)), [chartData]);
  const maxVal    = useMemo(() => Math.max(...chartData.map(d => d.value)), [chartData]);
  const importanceMeta = IMPORTANCE_LABELS[importance] || IMPORTANCE_LABELS.low;

  if (error && !observations.length) {
    return (
      <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: `1px solid ${alpha(theme.palette.error.main, 0.3)}`, bgcolor: alpha(theme.palette.error.main, 0.05), height: '100%' }}>
        <Typography variant="subtitle2" fontWeight={700} gutterBottom>{shortLabel}</Typography>
        <Typography variant="caption" color="error.main">Données indisponibles</Typography>
      </Paper>
    );
  }

  return (
    <Paper elevation={0} sx={{ p: 0, borderRadius: 3, border: `1px solid ${theme.palette.divider}`, overflow: 'hidden', transition: 'all 0.25s', '&:hover': { borderColor: alpha(color, 0.5), boxShadow: `0 8px 32px ${alpha(color, 0.12)}`, transform: 'translateY(-2px)', '& .refresh-btn': { opacity: 1 } } }}>
      <Box sx={{ height: 3, background: `linear-gradient(90deg, ${color}, ${alpha(color, 0.3)})` }} />
      <Box sx={{ p: 2.5 }}>
        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
              <Typography variant="caption" fontWeight={800} sx={{ color, fontSize: '0.65rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{shortLabel}</Typography>
              <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: importanceMeta.color, flexShrink: 0 }} />
            </Stack>
            <Typography variant="body2" fontWeight={600} noWrap sx={{ fontSize: '0.82rem' }}>{label}</Typography>
          </Box>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Tooltip title="Forcer le rechargement depuis FRED">
              <IconButton size="small" onClick={() => onRefresh(key)} disabled={refreshing} className="refresh-btn"
                sx={{ width: 24, height: 24, opacity: refreshing ? 1 : 0, transition: 'opacity 0.2s', border: `1px solid ${theme.palette.divider}` }}>
                <AutorenewRoundedIcon sx={{ fontSize: 13, animation: refreshing ? 'spin 1s linear infinite' : 'none', '@keyframes spin': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } } }} />
              </IconButton>
            </Tooltip>
            <Tooltip title={description} placement="top" arrow>
              <IconButton size="small" sx={{ mt: -0.5, opacity: 0.4, '&:hover': { opacity: 0.8 } }}>
                <InfoOutlinedIcon sx={{ fontSize: 14 }} />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>

        {/* Value + trend */}
        <Stack direction="row" alignItems="flex-end" spacing={1.5} mb={0.5}>
          <Typography variant="h4" fontWeight={900} sx={{ color: 'text.primary', lineHeight: 1, letterSpacing: '-0.02em', fontSize: 'clamp(1.3rem, 2vw, 1.7rem)' }}>
            {latestObs ? formatValue(latestObs.value, unit) : '—'}
          </Typography>
          <Stack direction="row" alignItems="center" spacing={0.5} pb={0.3}>
            <TrendIcon trend={trend} />
            {variation !== null && (
              <Typography variant="caption" fontWeight={700} sx={{ color: variation > 0 ? '#22c55e' : variation < 0 ? '#ef4444' : '#6b7280', fontSize: '0.72rem' }}>
                {variation > 0 ? '+' : ''}{variation.toFixed(2)}%
              </Typography>
            )}
          </Stack>
        </Stack>

        <Stack direction="row" spacing={2} mb={2}>
          <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.67rem' }}>
            Dernier : {formatDate(latestObs?.date, frequency)}
          </Typography>
          {prevObs && <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.67rem' }}>Préc. : {formatValue(prevObs.value, unit)}</Typography>}
        </Stack>

        {/* Mini chart */}
        {chartData.length > 1 ? (
          <Box sx={{ height: 100, mx: -0.5 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={color} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.5)} vertical={false} />
                <XAxis dataKey="date" hide />
                <YAxis domain={[minVal * 0.98, maxVal * 1.02]} hide />
                <RechartTooltip content={<CustomTooltip unit={unit} frequency={frequency} />} />
                <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fill={`url(#grad-${key})`} dot={false} activeDot={{ r: 4, strokeWidth: 0, fill: color }} />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        ) : (
          <Box sx={{ height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography variant="caption" color="text.disabled">Données insuffisantes</Typography>
          </Box>
        )}

        {/* Mini history */}
        {observations.length > 0 && (
          <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${alpha(theme.palette.divider, 0.6)}` }}>
            <Typography variant="caption" color="text.disabled" fontWeight={700} sx={{ letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: '0.6rem' }}>Historique</Typography>
            <Stack spacing={0.3} mt={0.75}>
              {observations.slice(-5).reverse().map((obs, i) => {
                const prevVal = observations[observations.indexOf(obs) - 1]?.value;
                const diff = prevVal != null && !isNaN(prevVal) ? obs.value - prevVal : null;
                return (
                  <Stack key={obs.date} direction="row" justifyContent="space-between" alignItems="center"
                    sx={{ py: 0.4, px: 0.75, borderRadius: 1, bgcolor: i === 0 ? alpha(color, 0.06) : 'transparent' }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace', fontSize: '0.68rem' }}>
                      {formatDate(obs.date, frequency)}
                    </Typography>
                    <Stack direction="row" spacing={0.75} alignItems="center">
                      {diff !== null && Math.abs(diff) > 0.001 && (
                        <Typography variant="caption" sx={{ fontSize: '0.62rem', color: diff > 0 ? '#22c55e' : '#ef4444', fontFamily: 'monospace' }}>
                          {diff > 0 ? '▲' : '▼'} {Math.abs(diff).toFixed(2)}
                        </Typography>
                      )}
                      <Typography variant="caption" fontWeight={i === 0 ? 800 : 500} sx={{ fontFamily: 'monospace', fontSize: '0.72rem', color: i === 0 ? color : 'text.primary' }}>
                        {formatValue(obs.value, unit)}
                      </Typography>
                    </Stack>
                  </Stack>
                );
              })}
            </Stack>
          </Box>
        )}
      </Box>
    </Paper>
  );
};

// ─── Tweet Card ──────────────────────────────────────────────────────────────

const formatTweetDate = (isoStr) => {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  const now = new Date();
  const diffMs = now - d;
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMs / 3600000);
  if (diffMin < 1)  return 'À l\'instant';
  if (diffMin < 60) return `il y a ${diffMin}min`;
  if (diffH < 24)   return `il y a ${diffH}h`;
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(d);
};

const TweetCard = ({ tweet, user, theme }) => {
  const isBreaking = /^\*/.test(tweet.text.trim());
  const cleanText  = tweet.text.replace(/^\*\s*/, '').trim();

  const [translated, setTranslated] = useState(null);   // null | string
  const [translating, setTranslating] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [translateError, setTranslateError] = useState(null);

  const handleTranslate = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Toggle off if already translated
    if (translated) { setShowTranslation(prev => !prev); return; }

    setTranslating(true);
    setTranslateError(null);
    try {
      const res = await fetch(buildApiUrl('macro/translate'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: cleanText }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Erreur traduction');
      setTranslated(data.translation);
      setShowTranslation(true);
    } catch (err) {
      setTranslateError('Traduction indisponible');
    } finally {
      setTranslating(false);
    }
  };

  const displayText = showTranslation && translated ? translated : cleanText;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 2.5,
        border: `1px solid ${isBreaking ? alpha('#ef4444', 0.35) : theme.palette.divider}`,
        bgcolor: isBreaking ? alpha('#ef4444', 0.04) : alpha(theme.palette.background.paper, 0.5),
        textDecoration: 'none',
        color: 'inherit',
        transition: 'all 0.2s',
        '&:hover': {
          borderColor: isBreaking ? alpha('#ef4444', 0.6) : alpha('#1D9BF0', 0.4),
          bgcolor: isBreaking ? alpha('#ef4444', 0.06) : alpha('#1D9BF0', 0.04),
          boxShadow: theme.shadows[2],
        },
        position: 'relative',
      }}
    >
      {isBreaking && (
        <Chip label="BREAKING" size="small"
          sx={{ position: 'absolute', top: 10, right: 10, bgcolor: '#ef4444', color: 'white',
            fontWeight: 900, fontSize: '0.58rem', height: 18, letterSpacing: '0.06em',
            animation: 'blink-breaking 1.5s infinite',
            '@keyframes blink-breaking': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.6 } } }}
        />
      )}

      <Stack direction="row" spacing={1.5} alignItems="flex-start">
        {/* Avatar */}
        {user?.profile_image_url ? (
          <Box component="img" src={user.profile_image_url} alt={user.name}
            sx={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0, objectFit: 'cover', border: `2px solid ${alpha('#1D9BF0', 0.3)}` }} />
        ) : (
          <Box sx={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0, bgcolor: alpha('#1D9BF0', 0.15), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TwitterIcon sx={{ fontSize: 18, color: '#1D9BF0' }} />
          </Box>
        )}

        <Box sx={{ flex: 1, minWidth: 0 }}>
          {/* Meta */}
          <Stack direction="row" alignItems="center" spacing={0.75} mb={0.5} flexWrap="wrap">
            <Typography variant="caption" fontWeight={800} noWrap>{user?.name || tweet.handle}</Typography>
            <Typography variant="caption" color="text.disabled" noWrap>@{user?.username || tweet.handle}</Typography>
            <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.6rem' }}>·</Typography>
            <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.68rem' }}>{formatTweetDate(tweet.created_at)}</Typography>
            {/* Open on X */}
            <Box component="a" href={tweet.url} target="_blank" rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              sx={{ ml: 'auto', color: 'text.disabled', fontSize: '0.62rem', textDecoration: 'none',
                '&:hover': { color: '#1D9BF0' }, display: 'flex', alignItems: 'center', gap: 0.3, fontWeight: 600 }}>
              ↗ X
            </Box>
          </Stack>

          {/* Tweet text */}
          <Typography variant="body2"
            sx={{ fontWeight: isBreaking ? 700 : 400, lineHeight: 1.58, fontSize: '0.85rem',
              color: showTranslation && translated ? 'text.primary' : (isBreaking ? 'text.primary' : 'text.secondary'),
              whiteSpace: 'pre-wrap', mb: 1 }}>
            {displayText}
          </Typography>

          {/* Translation badge */}
          {showTranslation && translated && (
            <Stack direction="row" alignItems="center" spacing={0.75} mb={1}>
              <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: '#6366f1' }} />
              <Typography variant="caption" sx={{ fontSize: '0.62rem', color: '#6366f1', fontWeight: 600, fontStyle: 'italic' }}>
                Traduit par Gemini AI · <Box component="span" sx={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={handleTranslate}>Voir l'original</Box>
              </Typography>
            </Stack>
          )}

          {translateError && (
            <Typography variant="caption" color="error" sx={{ fontSize: '0.65rem', display: 'block', mb: 0.5 }}>
              {translateError}
            </Typography>
          )}

          {/* Bottom actions */}
          <Stack direction="row" alignItems="center" spacing={1.5}>
            {/* Translate button */}
            <Tooltip title={showTranslation ? 'Voir en anglais' : 'Traduire en français'} placement="bottom">
              <Box component="button" onClick={handleTranslate}
                disabled={translating}
                sx={{
                  display: 'flex', alignItems: 'center', gap: 0.5,
                  border: 'none', background: 'none', cursor: 'pointer', p: 0,
                  color: showTranslation ? '#6366f1' : 'text.disabled',
                  fontSize: '0.7rem', fontWeight: 600, fontFamily: 'inherit',
                  transition: 'color 0.15s',
                  '&:hover': { color: '#6366f1' },
                  '&:disabled': { opacity: 0.6, cursor: 'wait' },
                }}>
                {translating ? (
                  <CircularProgress size={10} thickness={4} sx={{ color: '#6366f1' }} />
                ) : (
                  <Box sx={{ fontSize: '0.75rem' }}>🌐</Box>
                )}
                {translating ? 'Traduction...' : showTranslation ? 'EN' : 'FR'}
              </Box>
            </Tooltip>

            {/* Metrics */}
            {tweet.metrics?.retweet_count > 0 && (
              <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.65rem' }}>
                🔁 {tweet.metrics.retweet_count}
              </Typography>
            )}
            {tweet.metrics?.like_count > 0 && (
              <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.65rem' }}>
                ♥ {tweet.metrics.like_count}
              </Typography>
            )}
          </Stack>
        </Box>
      </Stack>
    </Paper>
  );
};


// ─── Note Card ────────────────────────────────────────────────────────────────

const NoteCard = ({ note, theme, onEdit, onDelete, onTogglePin }) => {
  const sentimentMeta = SENTIMENT_OPTIONS.find(s => s.value === note.sentiment) || SENTIMENT_OPTIONS[2];
  return (
    <Paper elevation={0} sx={{
      p: 2, borderRadius: 3, border: `1px solid ${theme.palette.divider}`,
      borderLeft: `4px solid ${sentimentMeta.color}`,
      transition: 'all 0.2s', '&:hover': { boxShadow: theme.shadows[3], transform: 'translateY(-1px)' },
      bgcolor: note.pinned ? alpha(sentimentMeta.color, 0.04) : 'background.paper',
    }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
            {note.pinned && <PushPinRoundedIcon sx={{ fontSize: 13, color: sentimentMeta.color, transform: 'rotate(15deg)' }} />}
            <Typography variant="subtitle2" fontWeight={700} noWrap>{note.title || 'Sans titre'}</Typography>
          </Stack>
          <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.65rem' }}>
            {formatNoteDate(note.updated_at || note.created_at)}
          </Typography>
        </Box>
        <Stack direction="row" spacing={0.5}>
          <Tooltip title={note.pinned ? 'Désépingler' : 'Épingler'}>
            <IconButton size="small" onClick={() => onTogglePin(note)} sx={{ opacity: 0.5, '&:hover': { opacity: 1 } }}>
              <PushPinRoundedIcon sx={{ fontSize: 14, transform: note.pinned ? 'rotate(15deg)' : 'none' }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Éditer">
            <IconButton size="small" onClick={() => onEdit(note)} sx={{ opacity: 0.5, '&:hover': { opacity: 1 } }}>
              <EditRoundedIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Supprimer">
            <IconButton size="small" onClick={() => onDelete(note.id)} sx={{ opacity: 0.4, '&:hover': { opacity: 1, color: 'error.main' } }}>
              <DeleteOutlineRoundedIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      {note.content && (
        <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap', fontSize: '0.82rem', mb: 1.5, lineHeight: 1.55 }}>
          {note.content}
        </Typography>
      )}

      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        <Chip size="small" label={sentimentMeta.label} sx={{ fontSize: '0.65rem', height: 20, bgcolor: alpha(sentimentMeta.color, 0.12), color: sentimentMeta.color, fontWeight: 700 }} />
        {note.tags?.map(tag => (
          <Chip key={tag} size="small" label={`#${tag}`} sx={{ fontSize: '0.65rem', height: 20, fontWeight: 600 }} />
        ))}
      </Stack>
    </Paper>
  );
};

// ─── Note Editor Dialog ───────────────────────────────────────────────────────

const NoteDialog = ({ open, note, onClose, onSave }) => {
  const [form, setForm] = useState({ title: '', content: '', sentiment: 'neutral', tags: '' });

  useEffect(() => {
    if (note) {
      setForm({ title: note.title || '', content: note.content || '', sentiment: note.sentiment || 'neutral', tags: (note.tags || []).join(', ') });
    } else {
      setForm({ title: '', content: '', sentiment: 'neutral', tags: '' });
    }
  }, [note, open]);

  const handleSave = () => {
    const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean);
    onSave({ ...form, tags });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
        {note?.id ? '✏️ Modifier la note' : '📝 Nouvelle note macro'}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} mt={1}>
          <TextField label="Titre" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
            fullWidth size="small" placeholder="ex: CPI Février — surprise haussière" />
          <TextField label="Analyse / Note" value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
            fullWidth multiline minRows={4} placeholder="Contexte, impact attendu sur les marchés, conviction..." />
          <Stack direction="row" spacing={2}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>SENTIMENT</Typography>
              <Select size="small" fullWidth value={form.sentiment} onChange={e => setForm(p => ({ ...p, sentiment: e.target.value }))} sx={{ borderRadius: 2 }}>
                {SENTIMENT_OPTIONS.map(s => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
              </Select>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>TAGS (virgules)</Typography>
              <TextField size="small" fullWidth value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))}
                placeholder="CPI, Fed, Gold..." sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
            </Box>
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} color="inherit">Annuler</Button>
        <Button variant="contained" startIcon={<SaveRoundedIcon />} onClick={handleSave} sx={{ borderRadius: 2, px: 3 }}>
          Sauvegarder
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const NewsFeedTab = ({ theme }) => {
  const [handle, setHandle] = useState(() => localStorage.getItem('macrolens_twitter_handle') || 'deitaone');
  const [customHandle, setCustomHandle] = useState('');
  const [tweets, setTweets] = useState([]);
  const [feedUser, setFeedUser] = useState(null);
  const [feedLoading, setFeedLoading] = useState(false);
  const [feedError, setFeedError] = useState(null);
  const [feedFetchedAt, setFeedFetchedAt] = useState(null);
  const [notes, setNotes] = useState([]);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const autoRefreshRef = useRef(null);

  // Load notes
  useEffect(() => {
    fetch(buildApiUrl('macro/notes'))
      .then(r => r.json()).then(d => setNotes(d.notes || [])).catch(() => {});
  }, []);

  // Fetch tweets
  const loadFeed = useCallback(async (h, forceRefresh = false) => {
    setFeedLoading(true); setFeedError(null);
    try {
      const url = forceRefresh
        ? buildApiUrl(`macro/feed/refresh?handle=${h}`)
        : buildApiUrl(`macro/feed?handle=${h}`);
      const res = await fetch(url, { method: forceRefresh ? 'POST' : 'GET' });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setTweets(data.tweets || []);
      setFeedUser(data.user);
      setFeedFetchedAt(data.fetchedAtIso ? new Date(data.fetchedAtIso) : new Date());
    } catch (e) {
      setFeedError(e.message);
    } finally {
      setFeedLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFeed(handle);
    // Auto-refresh toutes les 5 minutes
    clearInterval(autoRefreshRef.current);
    autoRefreshRef.current = setInterval(() => loadFeed(handle), 5 * 60 * 1000);
    return () => clearInterval(autoRefreshRef.current);
  }, [handle, loadFeed]);

  const persistHandle = (h) => { setHandle(h); localStorage.setItem('macrolens_twitter_handle', h); };
  const applyCustomHandle = () => {
    const clean = customHandle.replace('@', '').trim();
    if (clean) { persistHandle(clean); setCustomHandle(''); }
  };

  const breakingCount = tweets.filter(t => /^\*/.test(t.text.trim())).length;

  const handleSaveNote = async (formData) => {
    try {
      if (editingNote?.id) {
        const r = await fetch(buildApiUrl(`macro/notes/${editingNote.id}`), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
        const d = await r.json();
        setNotes(prev => prev.map(n => n.id === editingNote.id ? d.note : n));
      } else {
        const r = await fetch(buildApiUrl('macro/notes'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
        const d = await r.json();
        setNotes(prev => [d.note, ...prev]);
      }
    } catch { /* silent */ }
    setNoteDialogOpen(false); setEditingNote(null);
  };

  const handleDeleteNote = async (id) => {
    if (!window.confirm('Supprimer cette note ?')) return;
    await fetch(buildApiUrl(`macro/notes/${id}`), { method: 'DELETE' });
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  const handleTogglePin = async (note) => {
    const r = await fetch(buildApiUrl(`macro/notes/${note.id}`), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pinned: !note.pinned }) });
    const d = await r.json();
    setNotes(prev => prev.map(n => n.id === note.id ? d.note : n));
  };

  return (
    <Box>
      <Grid container spacing={3}>
        {/* LEFT — Tweet Feed */}
        <Grid item xs={12} lg={7}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: `1px solid ${theme.palette.divider}`, bgcolor: alpha(theme.palette.background.paper, 0.6), backdropFilter: 'blur(12px)' }}>
            {/* Feed Header */}
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1.5}>
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Box sx={{ p: 1, borderRadius: 2, bgcolor: alpha('#1D9BF0', 0.1) }}>
                  <TwitterIcon sx={{ color: '#1D9BF0', fontSize: 20 }} />
                </Box>
                <Box>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography variant="subtitle1" fontWeight={700}>
                      {feedUser?.name || `@${handle}`}
                    </Typography>
                    {breakingCount > 0 && (
                      <Chip label={`${breakingCount} BREAKING`} size="small"
                        sx={{ bgcolor: alpha('#ef4444', 0.15), color: '#ef4444', fontWeight: 800, fontSize: '0.6rem', height: 18 }} />
                    )}
                  </Stack>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography variant="caption" color="text.secondary">@{handle}</Typography>
                    {feedFetchedAt && (
                      <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.62rem' }}>
                        · Mis à jour {formatTweetDate(feedFetchedAt.toISOString())}
                      </Typography>
                    )}
                  </Stack>
                </Box>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: feedLoading ? '#eab308' : '#22c55e', boxShadow: `0 0 6px ${feedLoading ? '#eab308' : '#22c55e'}`, animation: 'pulse 2s infinite', '@keyframes pulse': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.4 } } }} />
              </Stack>
              <Tooltip title="Rafraîchir le feed">
                <IconButton size="small" onClick={() => loadFeed(handle, true)} disabled={feedLoading}
                  sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
                  <AutorenewRoundedIcon sx={{ fontSize: 16, animation: feedLoading ? 'spin 1s linear infinite' : 'none', '@keyframes spin': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } } }} />
                </IconButton>
              </Tooltip>
            </Stack>

            {/* Handle selector chips */}
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap mb={1.5}>
              {DEFAULT_FEED_HANDLES.map(h => (
                <Chip key={h.handle} label={h.label} size="small" onClick={() => persistHandle(h.handle)}
                  variant={handle === h.handle ? 'filled' : 'outlined'}
                  sx={{ fontSize: '0.68rem', fontWeight: 600, cursor: 'pointer',
                    ...(handle === h.handle ? { bgcolor: alpha('#1D9BF0', 0.15), color: '#1D9BF0', borderColor: alpha('#1D9BF0', 0.4) } : {}) }} />
              ))}
            </Stack>

            {/* Custom handle */}
            <Stack direction="row" spacing={1} mb={2.5}>
              <TextField size="small" value={customHandle} onChange={e => setCustomHandle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && applyCustomHandle()}
                placeholder="Autre handle..." sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: '0.85rem' } }}
                InputProps={{ startAdornment: <Typography color="text.disabled" sx={{ mr: 0.5, fontSize: '0.9rem' }}>@</Typography> }} />
              <Button variant="outlined" size="small" onClick={applyCustomHandle} sx={{ borderRadius: 2, minWidth: 90, fontWeight: 700 }}>Appliquer</Button>
            </Stack>

            {/* Feed content */}
            {feedLoading && !tweets.length ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8, gap: 2 }}>
                <CircularProgress size={36} thickness={3} sx={{ color: '#1D9BF0' }} />
                <Typography variant="body2" color="text.secondary">Chargement du feed @{handle}...</Typography>
              </Box>
            ) : feedError ? (
              <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: `1px solid ${alpha(theme.palette.error.main, 0.3)}`, bgcolor: alpha(theme.palette.error.main, 0.05), textAlign: 'center' }}>
                <Typography color="error" fontWeight={700} gutterBottom>Feed indisponible</Typography>
                <Typography variant="caption" color="text.secondary">{feedError}</Typography>
              </Paper>
            ) : (
              <Stack spacing={1.5} sx={{ maxHeight: 680, overflowY: 'auto', pr: 0.5 }}>
                {tweets.map(t => <TweetCard key={t.id} tweet={t} user={feedUser} theme={theme} />)}
                {tweets.length === 0 && (
                  <Box sx={{ textAlign: 'center', py: 6 }}>
                    <TwitterIcon sx={{ fontSize: 40, color: 'text.disabled', opacity: 0.3 }} />
                    <Typography variant="body2" color="text.secondary" mt={1}>Aucun tweet récent</Typography>
                  </Box>
                )}
              </Stack>
            )}
          </Paper>
        </Grid>

        {/* RIGHT — Macro Notes */}
        <Grid item xs={12} lg={5}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: `1px solid ${theme.palette.divider}`, bgcolor: alpha(theme.palette.background.paper, 0.6), backdropFilter: 'blur(12px)', height: '100%' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2.5}>
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Box sx={{ p: 1, borderRadius: 2, bgcolor: alpha('#6366f1', 0.1) }}>
                  <BookmarkRoundedIcon sx={{ color: '#6366f1', fontSize: 20 }} />
                </Box>
                <Box>
                  <Typography variant="subtitle1" fontWeight={700}>Notes Macro</Typography>
                  <Typography variant="caption" color="text.secondary">{notes.length} note{notes.length !== 1 ? 's' : ''}</Typography>
                </Box>
              </Stack>
              <Button variant="contained" size="small" startIcon={<AddRoundedIcon />}
                onClick={() => { setEditingNote(null); setNoteDialogOpen(true); }}
                sx={{ borderRadius: 2, fontWeight: 700, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: `0 4px 12px ${alpha('#6366f1', 0.3)}` }}>
                Nouvelle
              </Button>
            </Stack>

            {notes.length > 0 && (
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap mb={2}>
                {SENTIMENT_OPTIONS.map(s => {
                  const count = notes.filter(n => n.sentiment === s.value).length;
                  if (!count) return null;
                  return <Chip key={s.value} size="small" label={`${s.label} ×${count}`} sx={{ fontSize: '0.65rem', height: 20, bgcolor: alpha(s.color, 0.1), color: s.color, fontWeight: 700 }} />;
                })}
              </Stack>
            )}

            <Divider sx={{ mb: 2 }} />

            <Stack spacing={1.5} sx={{ maxHeight: 600, overflowY: 'auto', pr: 0.5 }}>
              {notes.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <BookmarkRoundedIcon sx={{ fontSize: 48, color: 'text.disabled', opacity: 0.3, mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">Aucune note</Typography>
                  <Typography variant="caption" color="text.disabled">Sauvegardez vos insights Bloomberg ici</Typography>
                </Box>
              ) : (
                notes.map(note => (
                  <NoteCard key={note.id} note={note} theme={theme}
                    onEdit={n => { setEditingNote(n); setNoteDialogOpen(true); }}
                    onDelete={handleDeleteNote} onTogglePin={handleTogglePin} />
                ))
              )}
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      <NoteDialog open={noteDialogOpen} note={editingNote}
        onClose={() => { setNoteDialogOpen(false); setEditingNote(null); }}
        onSave={handleSaveNote} />
    </Box>
  );
};


// ─── Indicators Tab ───────────────────────────────────────────────────────────

const IndicatorsTab = ({ theme }) => {
  const [category, setCategory] = useState('all');
  const [indicators, setIndicators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshingKey, setRefreshingKey] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchIndicators = useCallback(async (cat) => {
    setLoading(true); setError(null);
    try {
      const url = cat && cat !== 'all' ? buildApiUrl(`macro/indicators/all?category=${cat}`) : buildApiUrl('macro/indicators/all');
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Erreur API: ${res.status}`);
      const data = await res.json();
      setIndicators(data.indicators || []);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message || 'Impossible de charger les données macro');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchIndicators(category === 'all' ? null : category); }, [category, fetchIndicators]);

  const handleRefresh = useCallback(async (key) => {
    setRefreshingKey(key);
    try {
      const res = await fetch(buildApiUrl(`macro/indicators/${key}/refresh`), { method: 'POST' });
      const data = await res.json();
      setIndicators(prev => prev.map(ind => ind.key === key ? { ...data.indicator, key } : ind));
    } catch { /* silent */ } finally { setRefreshingKey(null); }
  }, []);

  const filteredIndicators = useMemo(() => category === 'all' ? indicators : indicators.filter(i => i.category === category), [indicators, category]);

  return (
    <>
      {/* Category filter */}
      <Paper elevation={0} sx={{ mb: 4, p: 1.5, borderRadius: 3, border: `1px solid ${theme.palette.divider}`, bgcolor: alpha(theme.palette.background.paper, 0.7), backdropFilter: 'blur(12px)', display: 'flex', gap: 1, overflowX: 'auto' }}>
        <ToggleButtonGroup value={category} exclusive onChange={(_, v) => v && setCategory(v)} size="small" sx={{ flexWrap: 'wrap', gap: 0.5 }}>
          {CATEGORIES.map(cat => (
            <ToggleButton key={cat.key} value={cat.key}
              sx={{ px: 2, py: 0.75, gap: 0.75, borderRadius: '8px !important', border: `1px solid ${alpha(theme.palette.divider, 0.5)} !important`, textTransform: 'none', fontSize: '0.8rem', fontWeight: 600,
                '&.Mui-selected': { bgcolor: alpha(theme.palette.primary.main, 0.12), borderColor: `${alpha(theme.palette.primary.main, 0.4)} !important`, color: theme.palette.primary.main },
                '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.06) } }}>
              {cat.icon}{cat.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Paper>

      {loading && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 3 }}>
          <CircularProgress size={48} thickness={3} />
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>Chargement des données FRED...</Typography>
            <Typography variant="body2" color="text.secondary">Première charge ~15-20s · Cache 6h ensuite</Typography>
          </Box>
        </Box>
      )}

      {!loading && error && (
        <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: `1px solid ${alpha(theme.palette.error.main, 0.3)}`, bgcolor: alpha(theme.palette.error.main, 0.05), textAlign: 'center' }}>
          <Typography variant="h6" color="error" fontWeight={700} gutterBottom>Impossible de charger les données</Typography>
          <Typography variant="body2" color="text.secondary" mb={1}>{error}</Typography>
          <Typography variant="caption" color="text.disabled">Vérifiez que le backend est démarré · FRED_API_KEY dans .env</Typography>
        </Paper>
      )}

      {!loading && !error && (
        <>
          <Grid container spacing={3}>
            {filteredIndicators.map(indicator => (
              <Grid item key={indicator.key} xs={12} sm={6} md={4} lg={3}>
                <IndicatorCard indicator={indicator} theme={theme} onRefresh={handleRefresh} refreshing={refreshingKey === indicator.key} />
              </Grid>
            ))}
          </Grid>
          <Box sx={{ mt: 5, pt: 3, borderTop: `1px solid ${alpha(theme.palette.divider, 0.5)}` }}>
            <Stack direction="row" justifyContent="space-between" flexWrap="wrap" gap={1}>
              <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.65rem' }}>
                📊 <strong>FRED® — Federal Reserve Bank of St. Louis</strong> · fred.stlouisfed.org · Cache 6h
              </Typography>
              {lastUpdated && (
                <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.65rem' }}>
                  Mis à jour : {lastUpdated.toLocaleTimeString('fr-FR')} · {filteredIndicators.length} indicateurs
                </Typography>
              )}
            </Stack>
          </Box>
        </>
      )}
    </>
  );
};

// ─── Main MacroLens Page ──────────────────────────────────────────────────────

const MacroLens = () => {
  const theme = useTheme();
  const [tab, setTab] = useState(0);
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box sx={{ minHeight: '100%', bgcolor: 'background.default' }}>
      {/* ── HERO ─── */}
      <Box sx={{
        pt: { xs: 4, md: 6 }, pb: { xs: 8, md: 10 }, px: { xs: 2, md: 4 },
        background: theme.forge?.gradients?.hero || 'linear-gradient(180deg, #1E1E24 0%, #0A0A0F 100%)',
        borderBottom: `1px solid ${theme.palette.divider}`,
        position: 'relative', overflow: 'hidden',
      }}>
        <Box sx={{ position: 'absolute', top: -80, right: '10%', width: 400, height: 400, borderRadius: '50%', background: `radial-gradient(circle, ${alpha('#6366f1', 0.12)} 0%, transparent 70%)`, pointerEvents: 'none' }} />
        <Box sx={{ position: 'absolute', bottom: -60, left: '5%', width: 280, height: 280, borderRadius: '50%', background: `radial-gradient(circle, ${alpha('#1D9BF0', 0.08)} 0%, transparent 70%)`, pointerEvents: 'none' }} />

        <Container maxWidth={false}>
          <Stack direction="row" alignItems="center" spacing={1.5} mb={1}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#22c55e', boxShadow: '0 0 8px #22c55e', animation: 'blink 2s infinite', '@keyframes blink': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.3 } } }} />
            <Typography variant="caption" sx={{ color: '#22c55e', fontWeight: 700, letterSpacing: '0.1em', fontSize: '0.65rem', textTransform: 'uppercase' }}>
              Live Data — FRED · Bloomberg
            </Typography>
          </Stack>

          <Typography variant="h3" fontWeight={900} gutterBottom
            sx={{ background: isDark ? 'linear-gradient(90deg, #fff 30%, #a5b4fc 100%)' : 'linear-gradient(90deg, #0F1729 30%, #4F46E5 100%)', backgroundClip: 'text', textFillColor: 'transparent', letterSpacing: '-0.02em' }}>
            MacroLens
          </Typography>
          <Typography variant="h6" color="text.secondary" fontWeight={400} sx={{ maxWidth: 600, lineHeight: 1.5 }}>
            Analyse fondamentale & macroéconomique US — Indicateurs, actualités Bloomberg, notes de marché.
          </Typography>
        </Container>
      </Box>

      {/* ── CONTENT ─── */}
      <Container maxWidth={false} sx={{ mt: -5, pb: 8, position: 'relative', zIndex: 2 }}>
        {/* Tab bar */}
        <Paper elevation={0} sx={{ mb: 4, borderRadius: 3, border: `1px solid ${theme.palette.divider}`, bgcolor: alpha(theme.palette.background.paper, 0.8), backdropFilter: 'blur(12px)', overflow: 'hidden' }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)}
            sx={{
              px: 1, pt: 1,
              '& .MuiTab-root': { minHeight: 44, fontWeight: 700, fontSize: '0.88rem', textTransform: 'none', borderRadius: '8px', mx: 0.5, mb: 0.5, gap: 0.75 },
              '& .MuiTabs-indicator': { height: 3, borderRadius: 2 },
            }}>
            {MACRO_TABS.map(t => <Tab key={t.key} icon={t.icon} iconPosition="start" label={t.label} />)}
          </Tabs>
        </Paper>

        {tab === 0 && <IndicatorsTab theme={theme} />}
        {tab === 1 && <NewsFeedTab theme={theme} />}
      </Container>
    </Box>
  );
};

export default MacroLens;
