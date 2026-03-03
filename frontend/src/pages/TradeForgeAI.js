// frontend/src/pages/TradeForgeAI.js

import AssessmentIcon from '@mui/icons-material/Assessment';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import DescriptionIcon from '@mui/icons-material/Description';
import EditIcon from '@mui/icons-material/Edit';
import FilterListIcon from '@mui/icons-material/FilterList';
import MenuIcon from '@mui/icons-material/Menu';
import PersonIcon from '@mui/icons-material/Person';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import {
  Alert,
  alpha,
  Avatar,
  Box,
  Checkbox,
  CircularProgress,
  ClickAwayListener,
  Container,
  Divider,
  Fade,
  Grid,
  IconButton,
  InputBase,
  ListItemText,
  MenuItem,
  MenuList,
  Paper,
  Stack,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme
} from "@mui/material";
import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import ChatInputBar from "../components/ChatInputBar";
import { requestChatAnalysisStream } from "../services/aiClient";
import { clearAIMemory, createSession, deleteSession, fetchAIMemory, fetchSessions, renameSession } from "../services/aiMemoryClient";
import { fetchBrokerAccounts } from "../services/brokerClient";
import { fetchJournalEntries } from "../services/journalClient";
import { fetchPlan } from "../services/planClient";
import { buildPlanDescription } from "../utils/planUtils";

// ─────────────────────────────────────────────────────────────────────────────
// MARKDOWN RENDERER — rendu des tables GFM
// ─────────────────────────────────────────────────────────────────────────────
const MarkdownContent = ({ text, entries = [] }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // Inject real images instead of TFA_IMAGE_XX placeholders
  const processedText = useMemo(() => {
    if (!text) return "";
    return text.replace(/!\[([^\]]*)\]\((TFA_IMAGE_(\d+))\)/g, (match, alt, fullId, idStr) => {
      const tradeId = parseInt(idStr, 10);
      const trade = entries.find(e => e.id === tradeId);
      if (trade && trade.images && trade.images.length > 0) {
        return trade.images.map((imgSrc, i) => `![${alt || 'Image du trade'} ${i + 1}](${imgSrc})`).join('\n\n');
      }
      return '';
    });
  }, [text, entries]);

  return (
    <Box
      sx={{
        '& p': { m: 0, mb: 1, lineHeight: 1.7 },
        '& ul, & ol': { m: 0, pl: 2.5, mb: 1 },
        '& li': { mb: 0.25 },
        '& strong': { fontWeight: 800, color: 'text.primary' },
        '& h1,& h2,& h3': { mt: 1.5, mb: 0.5, fontWeight: 700 },
        '& code': { fontFamily: '"JetBrains Mono", monospace', fontSize: '0.82em', px: 0.5, py: 0.1, borderRadius: '4px', bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' },
        '& pre': { p: 1.5, borderRadius: 2, bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', overflowX: 'auto', mb: 1 },
        '& img': { maxWidth: '100%', maxHeight: '400px', objectFit: 'contain', borderRadius: '8px', mt: 1, mb: 2, display: 'block', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}` },
        // Tables GFM
        '& table': {
          borderCollapse: 'collapse',
          width: '100%',
          mb: 1.5,
          fontSize: '0.82rem',
          borderRadius: '8px',
          overflow: 'hidden',
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
        },
        '& th': {
          px: 1.5, py: 1,
          textAlign: 'left',
          fontWeight: 700,
          fontSize: '0.75rem',
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          bgcolor: isDark ? 'rgba(79,142,247,0.12)' : 'rgba(79,142,247,0.08)',
          color: '#4F8EF7',
          borderBottom: `1px solid ${isDark ? 'rgba(79,142,247,0.2)' : 'rgba(79,142,247,0.2)'}`,
        },
        '& td': {
          px: 1.5, py: 0.85,
          borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
          verticalAlign: 'top',
        },
        '& tr:last-child td': { borderBottom: 'none' },
        '& tr:nth-of-type(even) td': {
          bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
        },
      }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        urlTransform={(url) => url}
      >
        {processedText}
      </ReactMarkdown>
    </Box>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// BULLES DE CHAT
// ─────────────────────────────────────────────────────────────────────────────
const UserPrompt = ({ text }) => {
  const theme = useTheme();
  return (
    <Fade in timeout={350}>
      <Stack direction="row" justifyContent="flex-end" sx={{ width: "100%", mb: 3 }}>
        <Stack alignItems="flex-end" spacing={0.75} sx={{ maxWidth: { xs: "88%", md: "72%" } }}>
          <Paper elevation={0} sx={{
            p: 2.5, borderRadius: "20px 20px 4px 20px",
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            color: "primary.contrastText", boxShadow: theme.shadows[4],
          }}>
            <Typography variant="body1" sx={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{text}</Typography>
          </Paper>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>VOUS</Typography>
            <Avatar sx={{ width: 22, height: 22, bgcolor: 'primary.main' }}>
              <PersonIcon sx={{ fontSize: 14 }} />
            </Avatar>
          </Stack>
        </Stack>
      </Stack>
    </Fade>
  );
};

const AIMessage = ({ text, entries }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  return (
    <Fade in timeout={350}>
      <Stack direction="row" justifyContent="flex-start" sx={{ width: "100%", mb: 3 }}>
        <Stack alignItems="flex-start" spacing={0.75} sx={{ maxWidth: { xs: "92%", md: "80%" } }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Avatar sx={{ width: 22, height: 22, bgcolor: 'secondary.main' }}>
              <AutoAwesomeIcon sx={{ fontSize: 13 }} />
            </Avatar>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>TRADEFORGE AI</Typography>
          </Stack>
          <Paper elevation={0} sx={{
            p: 2.5, borderRadius: "4px 20px 20px 20px",
            bgcolor: alpha(theme.palette.background.paper, isDark ? 0.8 : 1),
            border: `1px solid ${theme.palette.divider}`,
            backdropFilter: "blur(10px)",
            boxShadow: theme.shadows[2],
          }}>
            <MarkdownContent text={text} entries={entries} />
          </Paper>
        </Stack>
      </Stack>
    </Fade>
  );
};

const AILoadingBubble = () => {
  const theme = useTheme();
  return (
    <Fade in>
      <Stack direction="row" sx={{ width: "100%", mb: 3 }}>
        <Stack alignItems="flex-start" spacing={0.75}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Avatar sx={{ width: 22, height: 22, bgcolor: 'secondary.main' }}>
              <AutoAwesomeIcon sx={{ fontSize: 13 }} />
            </Avatar>
          </Stack>
          <Paper elevation={0} sx={{
            p: 2, borderRadius: "4px 20px 20px 20px",
            bgcolor: alpha(theme.palette.background.paper, 0.4),
            border: `1px solid ${theme.palette.divider}`,
            display: 'flex', alignItems: 'center', gap: 2,
          }}>
            <CircularProgress size={18} color="secondary" />
            <Typography variant="body2" color="text.secondary" fontWeight={500}>Analyse en cours…</Typography>
          </Paper>
        </Stack>
      </Stack>
    </Fade>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SÉLECTEUR DE COMPTES
// ─────────────────────────────────────────────────────────────────────────────
const AccountSelector = ({ accounts, selectedAccounts, onChange }) => {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const anchorRef = useRef(null);
  const allSelected = selectedAccounts.length === 0;
  const label = allSelected ? 'Tous les comptes' : selectedAccounts.length === 1 ? selectedAccounts[0] : `${selectedAccounts.length} comptes`;

  return (
    <Box sx={{ position: 'relative' }} ref={anchorRef}>
      <Box
        onClick={() => setOpen(p => !p)}
        sx={{
          display: 'flex', alignItems: 'center', gap: 0.75,
          px: 1.25, py: 0.6, borderRadius: '8px', cursor: 'pointer',
          background: allSelected ? (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)') : alpha('#4F8EF7', 0.1),
          border: `1px solid ${allSelected ? (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)') : alpha('#4F8EF7', 0.3)}`,
          transition: 'all 0.15s',
          '&:hover': { borderColor: '#4F8EF7' },
        }}
      >
        <WorkOutlineIcon sx={{ fontSize: 12, color: allSelected ? 'text.secondary' : '#4F8EF7' }} />
        <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: allSelected ? 'text.secondary' : '#4F8EF7', whiteSpace: 'nowrap', display: { xs: 'none', sm: 'block' } }}>{label}</Typography>
        <FilterListIcon sx={{ fontSize: 11, color: 'text.secondary' }} />
      </Box>
      {open && (
        <ClickAwayListener onClickAway={() => setOpen(false)}>
          <Paper elevation={8} sx={{
            position: 'absolute', top: 'calc(100% + 6px)', right: 0, minWidth: 220, zIndex: 1400,
            borderRadius: 2, border: `1px solid ${theme.palette.divider}`, overflow: 'hidden',
          }}>
            <MenuList dense disablePadding>
              <MenuItem onClick={() => onChange([])} selected={allSelected} sx={{ px: 1.5, py: 0.75 }}>
                <Checkbox size="small" checked={allSelected} sx={{ p: 0.4, mr: 1 }} />
                <ListItemText primary={<Typography variant="body2" fontWeight={700}>Tous les comptes</Typography>} />
              </MenuItem>
              {accounts.length > 0 && <Divider />}
              {accounts.map(acc => {
                const isSel = selectedAccounts.includes(acc.name);
                return (
                  <MenuItem key={acc.id} onClick={() => onChange(isSel ? selectedAccounts.filter(a => a !== acc.name) : [...selectedAccounts, acc.name])} selected={isSel} sx={{ px: 1.5, py: 0.75 }}>
                    <Checkbox size="small" checked={isSel} sx={{ p: 0.4, mr: 1 }} />
                    <ListItemText
                      primary={<Typography variant="body2" fontWeight={600}>{acc.name}</Typography>}
                      secondary={<Typography variant="caption" color="text.secondary">{acc.platform || 'MT5'} · {acc.currency}</Typography>}
                    />
                  </MenuItem>
                );
              })}
            </MenuList>
          </Paper>
        </ClickAwayListener>
      )}
    </Box>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SÉLECTEUR DE MODÈLE
// ─────────────────────────────────────────────────────────────────────────────
const ModelSelector = ({ selectedModel, onChange }) => {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const anchorRef = useRef(null);

  const models = [
    { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash' },
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' }
  ];

  const label = models.find(m => m.id === selectedModel)?.name || 'Modèle';

  return (
    <Box sx={{ position: 'relative' }} ref={anchorRef}>
      <Box
        onClick={() => setOpen(p => !p)}
        sx={{
          display: 'flex', alignItems: 'center', gap: 0.75,
          px: 1.25, py: 0.6, borderRadius: '8px', cursor: 'pointer',
          background: alpha('#7C3AED', 0.1),
          border: `1px solid ${alpha('#7C3AED', 0.3)}`,
          transition: 'all 0.15s',
          '&:hover': { borderColor: '#7C3AED' },
        }}
      >
        <AutoAwesomeIcon sx={{ fontSize: 12, color: '#7C3AED' }} />
        <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: '#7C3AED', whiteSpace: 'nowrap', display: { xs: 'none', sm: 'block' } }}>{label}</Typography>
        <FilterListIcon sx={{ fontSize: 11, color: 'text.secondary' }} />
      </Box>
      {open && (
        <ClickAwayListener onClickAway={() => setOpen(false)}>
          <Paper elevation={8} sx={{
            position: 'absolute', top: 'calc(100% + 6px)', right: 0, minWidth: 180, zIndex: 1400,
            borderRadius: 2, border: `1px solid ${theme.palette.divider}`, overflow: 'hidden',
          }}>
            <MenuList dense disablePadding>
              {models.map(m => {
                const isSel = selectedModel === m.id;
                return (
                  <MenuItem key={m.id} onClick={() => { onChange(m.id); setOpen(false); }} selected={isSel} sx={{ px: 1.5, py: 0.75 }}>
                    <ListItemText primary={<Typography variant="body2" fontWeight={isSel ? 700 : 500} color={isSel ? '#7C3AED' : 'text.primary'}>{m.name}</Typography>} />
                  </MenuItem>
                );
              })}
            </MenuList>
          </Paper>
        </ClickAwayListener>
      )}
    </Box>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// GÉNÉRATEUR DE QUESTIONS DYNAMIQUES
// Analyse les entrées journal pour produire 3 questions contextuelles.
// ─────────────────────────────────────────────────────────────────────────────
const generateSuggestedQuestions = (entries) => {
  const fallback = [
    "Combien de trades ai-je journalisé cette semaine ?",
    "Fais-moi le bilan de mes erreurs les plus fréquentes.",
    "Sur quels actifs suis-je le plus profitable ?",
  ];

  if (!entries || entries.length === 0) return fallback;

  const questions = [];
  const pool = [];

  // ── Calculs de base ──────────────────────────────────────────────────────
  const wins = entries.filter(e => (e.result || '').toLowerCase() === 'win').length;
  const winRate = entries.length > 0 ? Math.round((wins / entries.length) * 100) : 0;

  // Asset le plus fréquent
  const assetCounts = {};
  entries.forEach(e => { if (e.asset) assetCounts[e.asset] = (assetCounts[e.asset] || 0) + 1; });
  const sortedAssets = Object.entries(assetCounts).sort((a, b) => b[1] - a[1]);
  const topAsset = sortedAssets[0]?.[0];
  const topAssetCount = sortedAssets[0]?.[1] || 0;

  // Setups distincts
  const setups = [...new Set(entries.filter(e => e.setup).map(e => e.setup.trim()))].filter(Boolean);

  // Pertes consécutives récentes
  const sorted = [...entries].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  let consecutiveLosses = 0;
  for (const e of sorted) {
    if ((e.result || '').toLowerCase() === 'loss') consecutiveLosses++;
    else break;
  }

  // Trades des 7 derniers jours
  const since7d = new Date();
  since7d.setDate(since7d.getDate() - 7);
  const recent7d = entries.filter(e => e.date && new Date(e.date) >= since7d);

  // Trades des 30 derniers jours
  const since30d = new Date();
  since30d.setDate(since30d.getDate() - 30);
  const recent30d = entries.filter(e => e.date && new Date(e.date) >= since30d);

  // Asset avec le pire win rate (min 3 trades)
  const worstAsset = sortedAssets.find(([asset, count]) => {
    if (count < 3) return false;
    const assetEntries = entries.filter(e => e.asset === asset);
    const assetWins = assetEntries.filter(e => (e.result || '').toLowerCase() === 'win').length;
    return (assetWins / assetEntries.length) < 0.4;
  })?.[0];

  // ── Génération des questions prioritaires ─────────────────────────────────

  // 🔴 Alerte pertes consécutives (haute priorité)
  if (consecutiveLosses >= 3) {
    questions.push(`J'ai ${consecutiveLosses} pertes consécutives. Analyse mes derniers trades et dis-moi ce qui ne va pas.`);
  } else if (consecutiveLosses === 2) {
    questions.push(`J'ai 2 pertes consécutives récentes. Y a-t-il un pattern à corriger ?`);
  }

  // 📊 Question sur l'actif dominant
  if (topAsset && topAssetCount >= 3) {
    pool.push(`Quel est mon win-rate sur ${topAsset} (${topAssetCount} trades) ? Quelles sont mes forces et faiblesses sur cet actif ?`);
  } else if (topAsset && topAssetCount >= 2) {
    pool.push(`Analyse mes ${topAssetCount} trades sur ${topAsset} — qu'est-ce qui fonctionne et qu'est-ce qui ne fonctionne pas ?`);
  }

  // 🔻 Actif avec mauvais win rate
  if (worstAsset && worstAsset !== topAsset) {
    pool.push(`Pourquoi je perds autant sur ${worstAsset} ? Analyse mes entrées et identifie mes erreurs récurrentes.`);
  }

  // 📅 Bilan récent
  if (recent7d.length >= 2) {
    pool.push(`Fais-moi le bilan de mes ${recent7d.length} trades des 7 derniers jours : win rate, erreurs, points positifs.`);
  } else if (recent30d.length >= 3) {
    pool.push(`Analyse mes ${recent30d.length} trades du mois dernier — quelle est ma progression ?`);
  }

  // 🛠️ Question sur les setups
  if (setups.length >= 3) {
    pool.push(`Compare ma performance par setup (${setups.slice(0, 3).join(', ')}…). Lequel est le plus rentable ?`);
  } else if (setups.length === 2) {
    pool.push(`Compare ma performance sur mes deux setups : ${setups[0]} vs ${setups[1]}. Lequel dois-je privilégier ?`);
  }

  // 📈 Win rate global
  if (winRate < 45 && entries.length >= 5) {
    pool.push(`Mon win rate global est de ${winRate}% sur ${entries.length} trades. Quelles sont mes erreurs les plus fréquentes ?`);
  } else if (winRate >= 60 && entries.length >= 5) {
    pool.push(`Mon win rate est de ${winRate}% — comment consolider cette performance et éviter la régression ?`);
  } else if (entries.length >= 5) {
    pool.push(`Avec un win rate de ${winRate}% sur ${entries.length} trades, sur quoi dois-je travailler en priorité ?`);
  }

  // ── Multi-actifs
  if (sortedAssets.length >= 3) {
    pool.push(`Sur quels actifs (${sortedAssets.slice(0, 3).map(([a]) => a).join(', ')}) suis-je le plus profitable ? Lequel prioriser ?`);
  }

  // ── Remplir jusqu'à 3 questions
  for (const q of pool) {
    if (questions.length >= 3) break;
    questions.push(q);
  }

  // ── Compléter avec le fallback si nécessaire
  for (const f of fallback) {
    if (questions.length >= 3) break;
    if (!questions.includes(f)) questions.push(f);
  }

  return questions.slice(0, 3);
};

// ─────────────────────────────────────────────────────────────────────────────
// SIDEBAR SESSIONS
// ─────────────────────────────────────────────────────────────────────────────
const SessionSidebar = ({ open, sessions, activeSessionId, onSelect, onCreate, onDelete, onRename, onClose }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');

  const handleRenameSubmit = async (id) => {
    if (editName.trim()) await onRename(id, editName.trim());
    setEditingId(null);
    setEditName('');
  };

  const sidebarW = 240;

  const inner = (
    <Box
      sx={{
        width: sidebarW,
        height: '100%',
        overflow: 'hidden',
        borderRight: `1px solid ${theme.palette.divider}`,
        bgcolor: isDark ? '#0E0E12' : '#F8FAFF',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        boxShadow: isMobile ? '4px 0 24px rgba(0,0,0,0.35)' : 'none',
      }}
    >
      <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Box
          onClick={onCreate}
          sx={{
            display: 'flex', alignItems: 'center', gap: 1,
            px: 1.5, py: 1, borderRadius: '10px', cursor: 'pointer',
            background: `linear-gradient(135deg, ${alpha('#4F8EF7', 0.15)}, ${alpha('#7C3AED', 0.12)})`,
            border: `1px solid ${alpha('#4F8EF7', 0.25)}`,
            transition: 'all 0.15s',
            '&:hover': { background: `linear-gradient(135deg, ${alpha('#4F8EF7', 0.22)}, ${alpha('#7C3AED', 0.18)})` },
          }}
        >
          <AutoAwesomeIcon sx={{ fontSize: 15, color: '#4F8EF7' }} />
          <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: '#4F8EF7' }}>Nouveau chat</Typography>
        </Box>
      </Box>

      <Box sx={{ flex: 1, overflowY: 'auto', p: 1 }}>
        {sessions.length === 0 && (
          <Typography sx={{ px: 1.5, py: 2, fontSize: '0.72rem', color: 'text.secondary', textAlign: 'center' }}>
            Aucune session
          </Typography>
        )}
        {sessions.map(sess => {
          const isActive = sess.id === activeSessionId;
          const isEditing = editingId === sess.id;
          return (
            <Box
              key={sess.id}
              onClick={() => !isEditing && onSelect(sess.id)}
              sx={{
                display: 'flex', alignItems: 'center', gap: 0.75,
                px: 1.25, py: 0.85, borderRadius: '8px', cursor: 'pointer', mb: 0.25,
                bgcolor: isActive ? alpha('#4F8EF7', isDark ? 0.15 : 0.1) : 'transparent',
                border: isActive ? `1px solid ${alpha('#4F8EF7', 0.25)}` : '1px solid transparent',
                transition: 'all 0.12s',
                '&:hover': { bgcolor: isActive ? alpha('#4F8EF7', 0.18) : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)') },
                '& .session-actions': { opacity: 0 },
                '&:hover .session-actions': { opacity: 1 },
              }}
            >
              <ChatBubbleOutlineIcon sx={{ fontSize: 13, color: isActive ? '#4F8EF7' : 'text.secondary', flexShrink: 0 }} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                {isEditing ? (
                  <InputBase
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    onBlur={() => handleRenameSubmit(sess.id)}
                    onKeyDown={e => { if (e.key === 'Enter') handleRenameSubmit(sess.id); if (e.key === 'Escape') { setEditingId(null); } }}
                    autoFocus
                    onClick={e => e.stopPropagation()}
                    sx={{ fontSize: '0.78rem', fontWeight: 600, width: '100%', color: 'text.primary' }}
                  />
                ) : (
                  <Typography
                    sx={{
                      fontSize: '0.75rem', fontWeight: isActive ? 700 : 500,
                      color: isActive ? '#4F8EF7' : 'text.primary',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}
                  >
                    {sess.name}
                  </Typography>
                )}
                <Typography sx={{ fontSize: '0.62rem', color: 'text.secondary' }}>
                  {Number(sess.messageCount) > 0 ? `${sess.messageCount} msg` : 'Vide'}
                </Typography>
              </Box>
              {/* Renommer — hover only */}
              <IconButton
                className="session-actions"
                size="small"
                onClick={e => { e.stopPropagation(); setEditingId(sess.id); setEditName(sess.name); }}
                sx={{ p: 0.3, color: 'text.secondary', '&:hover': { color: '#4F8EF7' } }}
              >
                <EditIcon sx={{ fontSize: 12 }} />
              </IconButton>

              {/* Supprimer — toujours visible */}
              <Tooltip title="Supprimer ce chat" placement="right">
                <IconButton
                  size="small"
                  onClick={e => { e.stopPropagation(); onDelete(sess.id); }}
                  sx={{
                    p: 0.3,
                    color: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(15,23,42,0.25)',
                    '&:hover': { color: '#FF2D55', bgcolor: 'rgba(255,45,85,0.08)' },
                    transition: 'color 0.15s',
                  }}
                >
                  <DeleteOutlineIcon sx={{ fontSize: 12 }} />
                </IconButton>
              </Tooltip>
            </Box>
          );
        })}
      </Box>
    </Box>
  );

  if (!open) return null;

  if (isMobile) {
    return (
      <ClickAwayListener onClickAway={onClose}>
        <Box
          sx={{
            position: 'absolute',
            top: 0, left: 0, bottom: 0,
            zIndex: 100,
            display: 'flex',
          }}
        >
          {inner}
        </Box>
      </ClickAwayListener>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexShrink: 0, transition: 'width 0.25s ease', width: open ? sidebarW : 0, overflow: 'hidden' }}>
      {inner}
    </Box>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
const TradeForgeAI = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const accentBlue = '#4F8EF7';

  const [planDescription, setPlanDescription] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Données
  const [journalEntries, setJournalEntries] = useState([]);
  const [brokerAccounts, setBrokerAccounts] = useState([]);
  const [selectedAccounts, setSelectedAccounts] = useState([]);

  // Sessions
  const [sessions, setSessions] = useState([]);
  const LS_SESSION_KEY = 'tf_active_session';
  const readActiveSession = () => { try { return localStorage.getItem(LS_SESSION_KEY) || 'default'; } catch { return 'default'; } };
  const saveActiveSession = (id) => { try { localStorage.setItem(LS_SESSION_KEY, id); } catch { } };

  const [activeSessionId, setActiveSessionId] = useState(() => readActiveSession());
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Model Selector
  const [selectedModel, setSelectedModel] = useState('gemini-3-flash-preview');

  // Compteur RPD
  const MAX_REQUESTS_PER_DAY = 20;
  const LS_KEY = `tf_ai_req_${new Date().toISOString().slice(0, 10)}`;
  const readCount = () => { try { const v = parseInt(localStorage.getItem(LS_KEY) || '0', 10); return isFinite(v) ? v : 0; } catch { return 0; } };
  const [requestCount, setRequestCount] = useState(() => readCount());
  const incrementCount = () => setRequestCount(prev => { const n = prev + 1; try { localStorage.setItem(LS_KEY, String(n)); } catch { } return n; });

  const scrollRef = useRef(null);
  const remainingRequests = MAX_REQUESTS_PER_DAY - requestCount;
  const requestPct = (requestCount / MAX_REQUESTS_PER_DAY) * 100;
  const requestColor = requestCount >= MAX_REQUESTS_PER_DAY ? '#FF2D55' : requestCount >= Math.floor(MAX_REQUESTS_PER_DAY * 0.75) ? '#F59E0B' : accentBlue;

  // Fermer la sidebar automatiquement sur mobile
  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [isMobile]);

  // Chargement initial
  useEffect(() => {
    const load = async () => {
      try { const { plan } = await fetchPlan(); setPlanDescription(buildPlanDescription(plan)); } catch { }
      try { setJournalEntries((await fetchJournalEntries()) || []); } catch { }
      try { setBrokerAccounts((await fetchBrokerAccounts()) || []); } catch { }
      try {
        const loadedSessions = (await fetchSessions()) || [];
        setSessions(loadedSessions);
        // Vérifier que la session persistée existe toujours
        const savedId = readActiveSession();
        const exists = loadedSessions.some(s => s.id === savedId);
        if (!exists) {
          const fallback = loadedSessions[0]?.id || 'default';
          setActiveSessionId(fallback);
          saveActiveSession(fallback);
        }
      } catch { }
    };
    load();
  }, []);

  // Chargement des messages à chaque changement de session
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const memory = await fetchAIMemory(activeSessionId);
        setMessages(memory.map(m => ({ id: m.id, role: m.role, text: m.text })));
      } catch { setMessages([]); }
    };
    loadMessages();
  }, [activeSessionId]);

  // Scroll to bottom
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  const filteredJournalEntries = selectedAccounts.length === 0
    ? journalEntries
    : journalEntries.filter(e => selectedAccounts.includes(e.account));

  // Questions suggérées dynamiques basées sur les données réelles
  const suggestedQuestions = useMemo(
    () => generateSuggestedQuestions(filteredJournalEntries),
    [filteredJournalEntries]
  );

  // ── Gestion des sessions ──────────────────────────────────────────────────
  const handleCreateSession = async () => {
    const sess = await createSession("Nouveau chat");
    setSessions(prev => [sess, ...prev]);
    setActiveSessionId(sess.id);
    saveActiveSession(sess.id);
    setMessages([]);
  };

  const handleSelectSession = (sessionId) => {
    if (sessionId !== activeSessionId) {
      setActiveSessionId(sessionId);
      saveActiveSession(sessionId);
    }
  };

  const handleDeleteSession = async (sessionId) => {
    await deleteSession(sessionId);
    const remaining = sessions.filter(s => s.id !== sessionId);
    setMessages([]);

    if (remaining.length === 0) {
      // Dernière session supprimée → en créer une nouvelle
      const newSess = await createSession("Nouveau chat");
      setSessions([newSess]);
      setActiveSessionId(newSess.id);
      saveActiveSession(newSess.id);
    } else {
      setSessions(remaining);
      if (activeSessionId === sessionId) {
        const fallback = remaining[0].id;
        setActiveSessionId(fallback);
        saveActiveSession(fallback);
      }
    }
  };

  const handleRenameSession = async (sessionId, name) => {
    await renameSession(sessionId, name);
    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, name } : s));
  };

  const handleClearMessages = async () => {
    try {
      await clearAIMemory(activeSessionId);
      setMessages([]);
      setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messageCount: 0 } : s));
    } catch { setError("Impossible d'effacer la mémoire."); }
  };

  // ── Rapport hebdomadaire automatique ──────────────────────────────────────────
  const handleGenerateWeeklyReport = () => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=dim, 1=lun...
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(now);
    monday.setDate(now.getDate() - daysToMonday);
    monday.setHours(0, 0, 0, 0);

    const fmt = (d) => d.toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long' });
    const fmtShort = (d) => d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });

    const weekLabel = `semaine du ${fmt(monday)} au ${fmt(now)}`;

    const prompt =
      `Génère mon **rapport de trading hebdomadaire complet** pour la ${weekLabel}.

Analyse UNIQUEMENT les trades de cette période (${fmtShort(monday)} → ${fmtShort(now)}) présents dans les données du journal.
Si aucun trade n'est disponible pour cette semaine, indique-le clairement.

Structure le rapport avec exactement ces sections :

## 📊 Bilan de Performance
- Nombre total de trades journalisés
- Win Rate global (et par direction Achat/Vente)
- Répartition : ✅ Wins / ❌ Losses / ⏸️ Breakevens
- Actifs tradés cette semaine

## 🏆 Points Positifs
- Ce qui a bien fonctionné cette semaine (setups, timing, respect du plan, gestion)

## ❌ Erreurs & Axes d'Amélioration
| Erreur | Fréquence | Impact | Action corrective |
|--------|-----------|--------|-------------------|

## 📈 Analyse par Actif
Pour chaque instrument tradé : nombre de trades, win rate, observations.

## ⭐ Score de Discipline (0–10)
Évalue le respect du plan de trading sur la semaine avec une justification chiffrée.

## 🎯 Objectifs pour la semaine prochaine
3 recommandations concrètes, actionables, basées sur les erreurs de cette semaine.

---
Base-toi UNIQUEMENT sur les données du journal fournies. N'invente aucun chiffre.`;

    handleSend(prompt);
  };
  // ─────────────────────────────────────────────────────────────────────────────

  // ── Envoi d'un message ────────────────────────────────────────────────────
  const handleSend = async (rawText) => {
    if (requestCount >= MAX_REQUESTS_PER_DAY) {
      setError(`Limite journalière atteinte (${MAX_REQUESTS_PER_DAY}/jour). Revenez demain.`);
      return;
    }
    setLoading(true);
    setError("");

    // Ajouter le message utilisateur immédiatement
    const newUserMsg = { id: Date.now(), role: 'user', text: rawText };
    setMessages(prev => [...prev, newUserMsg]);

    // Placeholder pour la réponse AI (id stable pour les updates)
    const aiMsgId = Date.now() + 1;
    setMessages(prev => [...prev, { id: aiMsgId, role: 'ai', text: '' }]);

    try {
      const journalTradesForAI = filteredJournalEntries.map(e => ({
        id: e.id, date: e.date, asset: e.asset, direction: e.direction,
        result: e.result, account: e.account, setup: e.setup, source: 'journal',
        images: Array.isArray(e.images) ? e.images : [],
      }));

      await requestChatAnalysisStream({
        rawText,
        plan: planDescription,
        recentTrades: journalTradesForAI,
        accounts: selectedAccounts,
        sessionId: activeSessionId,
        model: selectedModel,

        onChunk: (accumulatedText) => {
          // Dès le premier chunk, masquer le spinner et afficher le texte
          setLoading(false);
          setMessages(prev => prev.map(m =>
            m.id === aiMsgId ? { ...m, text: accumulatedText } : m
          ));
        },

        onDone: (fullText) => {
          setLoading(false);
          setMessages(prev => prev.map(m =>
            m.id === aiMsgId ? { ...m, text: fullText } : m
          ));
          incrementCount();
          setSessions(prev => prev.map(s =>
            s.id === activeSessionId
              ? { ...s, messageCount: Number(s.messageCount || 0) + 2, updatedAt: new Date().toISOString() }
              : s
          ));
        },

        onError: (err) => {
          setLoading(false);
          // Supprimer le message vide et afficher l'erreur
          setMessages(prev => prev.filter(m => m.id !== aiMsgId));
          setError(err.message || "Une erreur est survenue.");
        },
      });

    } catch (err) {
      setLoading(false);
      setMessages(prev => prev.filter(m => m.id !== aiMsgId));
      setError(err.message || "Une erreur est survenue.");
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column", bgcolor: "background.default" }}>

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <Box sx={{
        position: 'relative', zIndex: 20,
        background: isDark
          ? 'linear-gradient(135deg, #0E0E12 0%, #12121A 60%, #0E101E 100%)'
          : 'linear-gradient(135deg, #F8FAFF 0%, #FFFFFF 60%, #F0F4FF 100%)',
        borderBottom: `1px solid ${isDark ? 'rgba(79,142,247,0.18)' : 'rgba(79,142,247,0.20)'}`,
        boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.3)' : '0 4px 16px rgba(15,23,42,0.06)',
        backdropFilter: 'blur(20px)',
        px: { xs: 1.5, md: 3 },
        '&::before': {
          content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
          background: `linear-gradient(90deg, transparent 0%, ${accentBlue} 40%, ${accentBlue} 60%, transparent 100%)`,
          opacity: isDark ? 0.7 : 0.5,
        },
      }}>
        {/* ── Ligne principale ── */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ py: 1.25, minHeight: 56 }}>

          {/* GAUCHE — identité */}
          <Stack direction="row" alignItems="center" spacing={1}>
            {/* Toggle sidebar */}
            <IconButton
              size="small"
              onClick={() => setSidebarOpen(p => !p)}
              sx={{ color: 'text.secondary', '&:hover': { color: accentBlue }, flexShrink: 0 }}
            >
              <MenuIcon sx={{ fontSize: 18 }} />
            </IconButton>

            {/* Avatar animé */}
            <Box sx={{ position: 'relative', flexShrink: 0 }}>
              <Box sx={{
                position: 'absolute', inset: -4, borderRadius: '50%',
                background: `radial-gradient(circle, ${alpha(accentBlue, 0.35)} 0%, transparent 70%)`,
                animation: 'ai-glow 2.4s ease-in-out infinite',
                '@keyframes ai-glow': { '0%, 100%': { opacity: 0.6, transform: 'scale(1)' }, '50%': { opacity: 1, transform: 'scale(1.15)' } },
              }} />
              <Avatar sx={{ width: 34, height: 34, background: `linear-gradient(135deg, ${accentBlue} 0%, #7C3AED 100%)`, boxShadow: `0 0 12px ${alpha(accentBlue, 0.4)}`, border: `1.5px solid ${alpha(accentBlue, 0.4)}` }}>
                <AutoAwesomeIcon sx={{ fontSize: 16, color: '#fff' }} />
              </Avatar>
            </Box>

            {/* Titre + statut */}
            <Box>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography sx={{ fontSize: { xs: '0.85rem', sm: '0.92rem' }, fontWeight: 800, letterSpacing: '-0.01em', color: isDark ? 'rgba(255,255,255,0.95)' : 'rgba(15,23,42,0.95)', lineHeight: 1.1 }}>
                  TradeForge AI
                </Typography>
                {/* LIVE badge */}
                {(() => {
                  const lc = isDark ? '#00FF66' : '#0D9488';
                  return (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 0.75, py: 0.2, borderRadius: '999px', background: alpha(lc, isDark ? 0.12 : 0.08), border: `1px solid ${alpha(lc, isDark ? 0.3 : 0.22)}` }}>
                      <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: lc, boxShadow: isDark ? `0 0 6px ${lc}` : 'none', animation: 'live-pulse 1.8s ease-in-out infinite', '@keyframes live-pulse': { '0%, 100%': { opacity: 1 }, '50%': { opacity: 0.35 } } }} />
                      <Typography sx={{ fontSize: '0.55rem', fontWeight: 800, letterSpacing: '0.08em', color: lc }}>LIVE</Typography>
                    </Box>
                  );
                })()}
              </Stack>
              {/* Sous-titre — masqué sur très petit écran */}
              <Typography sx={{ fontSize: '0.65rem', color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(15,23,42,0.4)', mt: 0.1, fontWeight: 500, display: { xs: 'none', sm: 'block' } }}>
                {filteredJournalEntries.length > 0
                  ? `${filteredJournalEntries.length} entrée${filteredJournalEntries.length > 1 ? 's' : ''} · ${planDescription ? 'Plan actif' : 'Sans plan'}`
                  : 'Aucune donnée chargée'}
              </Typography>
            </Box>
          </Stack>

          {/* DROITE — actions compactes */}
          <Stack direction="row" alignItems="center" spacing={0.5}>

            {/* Sélecteur de modèle */}
            <ModelSelector selectedModel={selectedModel} onChange={setSelectedModel} />

            {/* Sélecteur de compte */}
            <AccountSelector accounts={brokerAccounts} selectedAccounts={selectedAccounts} onChange={setSelectedAccounts} />

            {/* Séparateur */}
            <Box sx={{ width: '1px', height: 18, mx: 0.5, bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.1)' }} />

            {/* Rapport hebdo — icône seule sur mobile, label sur desktop */}
            <Tooltip title="Générer le rapport de la semaine" placement="bottom">
              <Box
                onClick={handleGenerateWeeklyReport}
                sx={{
                  display: 'flex', alignItems: 'center', gap: 0.6,
                  px: { xs: 0.85, sm: 1.25 }, py: 0.65, borderRadius: '8px', cursor: 'pointer',
                  background: `linear-gradient(135deg, ${alpha('#7C3AED', isDark ? 0.15 : 0.09)}, ${alpha('#4F8EF7', isDark ? 0.10 : 0.06)})`,
                  border: `1px solid ${alpha('#7C3AED', 0.25)}`,
                  transition: 'all 0.15s',
                  '&:hover': { borderColor: alpha('#7C3AED', 0.55), background: `linear-gradient(135deg, ${alpha('#7C3AED', 0.24)}, ${alpha('#4F8EF7', 0.16)})` },
                }}
              >
                <AssessmentIcon sx={{ fontSize: 14, color: '#7C3AED' }} />
                <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: '#7C3AED', whiteSpace: 'nowrap', display: { xs: 'none', sm: 'block' } }}>Rapport hebdo</Typography>
              </Box>
            </Tooltip>

            {/* Séparateur */}
            <Box sx={{ width: '1px', height: 18, mx: 0.5, bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.1)' }} />

            {/* Effacer le chat */}
            <Tooltip title={messages.length > 0 ? `Effacer ce chat (${messages.length} msg)` : 'Aucun message'} placement="bottom">
              <span>
                <IconButton
                  onClick={handleClearMessages}
                  disabled={messages.length === 0}
                  size="small"
                  sx={{ width: 30, height: 30, border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.1)'}`, borderRadius: '8px', color: isDark ? 'rgba(255,255,255,0.38)' : 'rgba(15,23,42,0.38)', '&:hover': { color: '#FF2D55', borderColor: 'rgba(255,45,85,0.4)', bgcolor: 'rgba(255,45,85,0.07)' }, '&.Mui-disabled': { opacity: 0.25 } }}
                >
                  <DeleteOutlineIcon sx={{ fontSize: 14 }} />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        </Stack>

        {/* ── Barre d'état condensée (requêtes + plan) ── */}
        <Stack
          direction="row"
          alignItems="center"
          spacing={1.5}
          sx={{
            pb: 0.85,
            borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.04)'}`,
            pt: 0.6,
          }}
        >
          {/* Compteur requêtes — compact */}
          <Tooltip title={`${remainingRequests} requête${remainingRequests > 1 ? 's' : ''} restante${remainingRequests > 1 ? 's' : ''} aujourd'hui`} placement="bottom">
            <Stack direction="row" alignItems="center" spacing={1} sx={{ flex: 1 }}>
              <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: isDark ? 'rgba(255,255,255,0.28)' : 'rgba(15,23,42,0.32)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                Requêtes
              </Typography>
              <Box sx={{ flex: 1, height: 3, borderRadius: 99, bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)', overflow: 'hidden', maxWidth: 120 }}>
                <Box sx={{ height: '100%', width: `${100 - requestPct}%`, borderRadius: 99, bgcolor: requestColor, boxShadow: requestCount < MAX_REQUESTS_PER_DAY ? `0 0 5px ${requestColor}70` : 'none', transition: 'width 0.4s ease, background-color 0.3s' }} />
              </Box>
              <Typography sx={{ fontSize: '0.62rem', fontWeight: 800, color: requestColor, fontFamily: '"JetBrains Mono", monospace', flexShrink: 0 }}>
                {remainingRequests}/{MAX_REQUESTS_PER_DAY}
              </Typography>
            </Stack>
          </Tooltip>

          {/* Badge Plan actif */}
          {planDescription && (
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <DescriptionIcon sx={{ fontSize: 11, color: isDark ? '#00FF66' : '#0F766E' }} />
              <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.05em', color: isDark ? '#00FF66' : '#0F766E' }}>Plan actif</Typography>
            </Stack>
          )}
        </Stack>
      </Box>

      {/* ── CORPS (sidebar + chat) ──────────────────────────────────────── */}
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>

        {/* Sidebar sessions */}
        <SessionSidebar
          open={sidebarOpen}
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelect={handleSelectSession}
          onCreate={handleCreateSession}
          onDelete={handleDeleteSession}
          onRename={handleRenameSession}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Zone de chat */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Box ref={scrollRef} sx={{ flex: 1, overflowY: 'auto', px: { xs: 2, md: 4 }, py: 3, scrollBehavior: 'smooth' }}>
            <Container maxWidth="lg">
              <Stack spacing={0}>
                {messages.length === 0 && (
                  <Fade in timeout={700}>
                    <Box sx={{ minHeight: '55vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <Box sx={{ textAlign: 'center', mb: 5 }}>
                        <AutoAwesomeIcon sx={{ fontSize: 44, color: 'secondary.main', mb: 1.5 }} />
                        <Typography variant="h4" fontWeight={900} gutterBottom>Data Analyst Personnel</Typography>
                        <Typography variant="body1" color="text.secondary">
                          Posez-moi n'importe quelle question sur vos analyses de journal.
                        </Typography>
                        {filteredJournalEntries.length > 0 && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                            {filteredJournalEntries.length} entrée{filteredJournalEntries.length > 1 ? 's' : ''} journal chargée{filteredJournalEntries.length > 1 ? 's' : ''}
                          </Typography>
                        )}
                      </Box>
                      <Grid container spacing={2}>
                        {suggestedQuestions.map((s, i) => (
                          <Grid item xs={12} sm={4} key={i}>
                            <Paper
                              elevation={0}
                              onClick={() => handleSend(s)}
                              sx={{
                                p: 2, height: '100%', cursor: 'pointer',
                                borderRadius: 3,
                                border: `1px solid ${theme.palette.divider}`,
                                bgcolor: alpha(theme.palette.background.paper, 0.4),
                                transition: 'all 0.18s',
                                '&:hover': { bgcolor: alpha('#4F8EF7', 0.06), borderColor: '#4F8EF7', transform: 'translateY(-2px)', boxShadow: `0 4px 16px ${alpha('#4F8EF7', 0.12)}` }
                              }}
                            >
                              <Typography variant="body2" fontWeight={600} sx={{ lineHeight: 1.5 }}>{s}</Typography>
                            </Paper>
                          </Grid>
                        ))}

                        {/* Carte rapport hebdo — distinctive */}
                        <Grid item xs={12} sx={{ mt: 0.5 }}>
                          <Paper
                            elevation={0}
                            onClick={handleGenerateWeeklyReport}
                            sx={{
                              p: 2.25, cursor: 'pointer', borderRadius: 3,
                              background: `linear-gradient(135deg, ${alpha('#7C3AED', isDark ? 0.14 : 0.07)} 0%, ${alpha('#4F8EF7', isDark ? 0.10 : 0.05)} 100%)`,
                              border: `1px solid ${alpha('#7C3AED', 0.22)}`,
                              display: 'flex', alignItems: 'center', gap: 2,
                              transition: 'all 0.18s',
                              '&:hover': { borderColor: '#7C3AED', transform: 'translateY(-2px)', boxShadow: `0 4px 20px ${alpha('#7C3AED', 0.18)}` },
                            }}
                          >
                            <Box sx={{
                              width: 38, height: 38, borderRadius: '10px', flexShrink: 0,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              background: `linear-gradient(135deg, #7C3AED, #4F8EF7)`,
                              boxShadow: `0 4px 12px ${alpha('#7C3AED', 0.35)}`,
                            }}>
                              <AssessmentIcon sx={{ fontSize: 20, color: '#fff' }} />
                            </Box>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="body2" fontWeight={800} sx={{ color: isDark ? 'rgba(255,255,255,0.9)' : '#1E1B4B', mb: 0.2 }}>
                                📊 Rapport de la semaine
                              </Typography>
                              <Typography variant="caption" sx={{ color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(30,27,75,0.55)', lineHeight: 1.4 }}>
                                Bilan complet · Erreurs · Score de discipline · Objectifs semaine prochaine
                              </Typography>
                            </Box>
                            <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: '#7C3AED', opacity: 0.7 }}>Générer →</Typography>
                          </Paper>
                        </Grid>
                      </Grid>
                    </Box>
                  </Fade>
                )}

                {messages.map(msg =>
                  msg.role === 'user'
                    ? <UserPrompt key={msg.id} text={msg.text} />
                    : <AIMessage key={msg.id} text={msg.text} entries={filteredJournalEntries} />
                )}

                {loading && <AILoadingBubble />}
                {error && <Alert severity="error" sx={{ borderRadius: 2, mb: 2 }}>{error}</Alert>}
                <Box sx={{ height: 90 }} />
              </Stack>
            </Container>
          </Box>

          <ChatInputBar onSend={handleSend} loading={loading || requestCount >= MAX_REQUESTS_PER_DAY} />
        </Box>
      </Box>
    </Box>
  );
};

export default TradeForgeAI;
