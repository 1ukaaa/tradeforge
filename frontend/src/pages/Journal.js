// frontend/src/pages/Journal.js

import {
  Alert,
  alpha,
  Autocomplete,
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
  Fade,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme
} from "@mui/material";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { fetchBrokerAccounts, fetchBrokerSummary } from "../services/brokerClient";
import { deleteJournalEntry, fetchJournalEntries, saveJournalEntry, updateJournalEntry } from "../services/journalClient";
import { cleanAssetName, COMMON_ASSETS } from "../utils/assetUtils";

// Icons
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditIcon from "@mui/icons-material/Edit";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import SearchIcon from "@mui/icons-material/Search";
const RESULT_COLORS = {
  Win: "success",
  Loss: "error",
  Breakeven: "info"
};

const getAssetCategory = (assetValue) => {
  const found = COMMON_ASSETS.find((a) => a.value === assetValue);
  return found ? found.group : "Autre";
};


const JournalFormModal = ({ open, entry, prefill, onClose, onSave, brokerAssets = [], brokerAccounts = [] }) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 10),
    asset: "",
    direction: "Achat",
    result: "Win",
    account: "",
    setup: "",
    images: [],
    trade_id: null,
  });

  const [loading, setLoading] = useState(false);
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  useEffect(() => {
    if (entry && open) {
      setFormData({
        date: entry.date ? new Date(entry.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
        asset: entry.asset || "",
        direction: entry.direction || "Achat",
        result: entry.result || "Win",
        account: entry.account || "",
        setup: entry.setup || "",
        images: Array.isArray(entry.images) ? entry.images : [],
        trade_id: entry.trade_id || null,
      });
    } else if (prefill && open) {
      // Pre-fill from a dashboard trade (no journal entry yet)
      setFormData({
        date: prefill.date ? new Date(prefill.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
        asset: prefill.asset || "CL",
        direction: prefill.direction === "SELL" ? "Vente" : "Achat",
        result: prefill.pnl >= 0 ? "Win" : "Loss",
        account: prefill.account || "",
        setup: "",
        images: [],
        trade_id: prefill.trade_id || null,
      });
    } else if (open) {
      setFormData({
        date: new Date().toISOString().slice(0, 10),
        asset: "",
        direction: "Achat",
        result: "Win",
        account: "",
        setup: "",
        images: [],
        trade_id: null,
      });
    }
  }, [entry, prefill, open]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePaste = (e) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile();
        const reader = new FileReader();
        reader.onload = (ev) => {
          setFormData(prev => ({ ...prev, images: [...prev.images, ev.target.result] }));
        };
        reader.readAsDataURL(file);
        e.preventDefault();
        break;
      }
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setFormData(prev => ({ ...prev, images: [...prev.images, ev.target.result] }));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (entry) {
        await onSave({ id: entry.id, ...formData });
      } else {
        await onSave(formData);
      }
      onClose();
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la sauvegarde du trade.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullScreen={fullScreen} maxWidth="sm" fullWidth onPaste={handlePaste} PaperProps={{ sx: { borderRadius: 4, backgroundImage: 'none', bgcolor: 'background.paper', boxShadow: theme.shadows[10] } }}>
      <DialogTitle sx={{ pt: 4, px: 4, pb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" fontWeight={700} letterSpacing="-0.02em">{entry ? "Modifier l'Analyse" : "Créer l'Analyse"}</Typography>
        <IconButton onClick={onClose} size="small" sx={{ color: 'text.secondary', bgcolor: alpha(theme.palette.text.primary, 0.05) }}><CloseIcon fontSize="small" /></IconButton>
      </DialogTitle>

      <DialogContent sx={{ px: 4, pb: 4, pt: 1, '&::-webkit-scrollbar': { display: 'none' } }}>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <Stack direction="row" spacing={2}>
            <TextField fullWidth variant="outlined" label="Date" type="date" name="date" value={formData.date} onChange={handleChange} InputLabelProps={{ shrink: true }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
            <Autocomplete
              freeSolo
              fullWidth
              options={COMMON_ASSETS}
              groupBy={(option) => option.group}
              getOptionLabel={(option) => {
                if (typeof option === 'string') return option;
                return option.label || '';
              }}
              value={
                formData.asset
                  ? COMMON_ASSETS.find((a) => a.value === formData.asset) || formData.asset
                  : null
              }
              onChange={(e, newValue) => {
                let val = "";
                if (typeof newValue === "string") val = newValue;
                else if (newValue && newValue.value) val = newValue.value;
                setFormData({ ...formData, asset: val });
              }}
              onInputChange={(e, newInputValue, reason) => {
                if (reason === "input") {
                  setFormData({ ...formData, asset: newInputValue });
                }
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Actif"
                  variant="outlined"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              )}
            />
          </Stack>

          <Stack direction="row" spacing={2}>
            <FormControl fullWidth variant="outlined">
              <InputLabel>Direction</InputLabel>
              <Select name="direction" value={formData.direction} label="Direction" onChange={handleChange} sx={{ borderRadius: 2 }}>
                <MenuItem value="Achat">Achat</MenuItem>
                <MenuItem value="Vente">Vente</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth variant="outlined">
              <InputLabel>Résultat</InputLabel>
              <Select name="result" value={formData.result} label="Résultat" onChange={handleChange} sx={{ borderRadius: 2 }}>
                <MenuItem value="Win" sx={{ color: 'success.main', fontWeight: 600 }}>Win</MenuItem>
                <MenuItem value="Loss" sx={{ color: 'error.main', fontWeight: 600 }}>Loss</MenuItem>
                <MenuItem value="Breakeven" sx={{ color: 'info.main', fontWeight: 600 }}>Breakeven</MenuItem>
              </Select>
            </FormControl>
          </Stack>

          <Stack direction="row" spacing={2}>
            <FormControl fullWidth variant="outlined">
              <InputLabel>Compte</InputLabel>
              <Select name="account" value={formData.account} label="Compte" onChange={handleChange} sx={{ borderRadius: 2 }}>
                {brokerAccounts.length > 0
                  ? brokerAccounts.map((acc) => (
                    <MenuItem key={acc.id} value={acc.name}>
                      <Stack direction="row" alignItems="center" spacing={1} sx={{ py: 0.3 }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography sx={{ fontWeight: 600, fontSize: '0.85rem' }}>{acc.name}</Typography>
                          <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>{acc.platform || 'MT5'} · {acc.currency}</Typography>
                        </Box>
                      </Stack>
                    </MenuItem>
                  ))
                  : <MenuItem value="">Aucun compte</MenuItem>
                }
              </Select>
            </FormControl>
            <TextField fullWidth variant="outlined" label="Setup" name="setup" placeholder="ex: Cassure M15" value={formData.setup} onChange={handleChange} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
          </Stack>

          <Box>
            <Typography variant="subtitle2" fontWeight={600} mb={1.5} color="text.primary">Breakdowns Graphiques</Typography>

            {formData.images.length === 0 ? (
              <Box
                component="label"
                sx={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  p: 4, borderRadius: 3, border: `2px dashed ${theme.palette.divider}`, bgcolor: alpha(theme.palette.divider, 0.03),
                  cursor: 'pointer', transition: 'all 0.2s', '&:hover': { bgcolor: alpha(theme.palette.divider, 0.08), borderColor: 'text.secondary' }
                }}
              >
                <PhotoCameraIcon sx={{ fontSize: 32, mb: 1, color: 'text.secondary' }} />
                <Typography variant="body2" fontWeight={600} color="text.primary">Cliquez pour uploader</Typography>
                <Typography variant="caption" color="text.secondary">ou collez directement (CTRL+V)</Typography>
                <input type="file" hidden multiple accept="image/*" onChange={handleImageUpload} />
              </Box>
            ) : (
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 1, '&::-webkit-scrollbar': { height: 6 }, '&::-webkit-scrollbar-thumb': { bgcolor: theme.palette.divider, borderRadius: 3 } }}>
                  {formData.images.map((imgStr, idx) => (
                    <Box key={idx} sx={{ position: 'relative', width: 140, height: 100, flexShrink: 0, borderRadius: 2, overflow: 'hidden', border: `1px solid ${theme.palette.divider}` }}>
                      <img src={imgStr} alt={`Breakdown ${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <IconButton size="small" sx={{ position: 'absolute', top: 4, right: 4, bgcolor: 'rgba(0,0,0,0.5)', color: 'white', '&:hover': { bgcolor: 'rgba(255,0,0,0.8)' }, width: 22, height: 22 }} onClick={() => handleRemoveImage(idx)}>
                        <CloseIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Box>
                  ))}
                  <Box
                    component="label"
                    sx={{ width: 100, height: 100, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 2, border: `2px dashed ${theme.palette.divider}`, cursor: 'pointer', '&:hover': { bgcolor: alpha(theme.palette.divider, 0.05) } }}
                  >
                    <AddIcon sx={{ color: 'text.secondary' }} />
                    <input type="file" hidden multiple accept="image/*" onChange={handleImageUpload} />
                  </Box>
                </Box>
              </Stack>
            )}
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 4, pb: 4, pt: 0 }}>
        <Button onClick={onClose} color="inherit" sx={{ fontWeight: 600, textTransform: 'none' }}>Annuler</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading} disableElevation sx={{ borderRadius: 2, fontWeight: 600, px: 3, textTransform: 'none', bgcolor: 'text.primary', color: 'background.paper', '&:hover': { bgcolor: 'text.secondary' } }}>
          {loading ? "Enregistrement..." : "Enregistrer"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const JournalDetailModal = ({ open, entry, onClose, onEdit, onDelete }) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const theme = useTheme();

  if (!entry) return null;

  const handleDelete = async () => {
    try {
      await onDelete(entry.id);
      setShowConfirm(false);
      onClose();
    } catch (e) {
      console.error(e);
      alert("Erreur lors de la suppression.");
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg" PaperProps={{ sx: { bgcolor: theme.palette.background.paper, borderRadius: 3, overflow: "hidden" } }}>
        <DialogTitle sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="h6" fontWeight={800}>{entry.asset}</Typography>
            <Chip label={getAssetCategory(entry.asset)} size="small" variant="outlined" sx={{ fontWeight: 600, color: 'text.secondary', borderColor: 'divider' }} />
            <Chip label={entry.direction} size="small" color={entry.direction === 'Achat' ? 'primary' : 'secondary'} />
            <Chip label={entry.result} size="small" color={RESULT_COLORS[entry.result] || 'default'} />
            <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
              {new Date(entry.date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1}>
            <IconButton onClick={onEdit}><EditIcon /></IconButton>
            <IconButton color="error" onClick={() => setShowConfirm(true)}><DeleteOutlineIcon /></IconButton>
            <IconButton onClick={onClose}><CloseIcon /></IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <Grid container sx={{ height: '100%' }}>
            {/* Gallery Left (70%) */}
            <Grid item xs={12} md={8} sx={{ p: 3, borderRight: { md: `1px solid ${theme.palette.divider}` }, bgcolor: alpha(theme.palette.background.default, 0.4) }}>
              {entry.images && entry.images.length > 0 ? (
                <Stack spacing={2}>
                  {entry.images.map((img, i) => (
                    <Box component="img" key={i} src={img} sx={{ width: '100%', borderRadius: 2, border: `1px solid ${theme.palette.divider}`, boxShadow: theme.shadows[3] }} />
                  ))}
                </Stack>
              ) : (
                <Box sx={{ height: '100%', minHeight: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography color="text.secondary">Aucune image pour ce trade</Typography>
                </Box>
              )}
            </Grid>
            {/* Meta Right (30%) */}
            <Grid item xs={12} md={4} sx={{ p: 3 }}>
              <Typography variant="overline" color="text.secondary">DÉTAILS DU TRADE</Typography>
              <Stack spacing={2} mt={2}>
                <Box>
                  <Typography variant="caption" color="text.secondary">COMPTE</Typography>
                  <Typography variant="body1" fontWeight={600}>{entry.account || "-"}</Typography>
                </Box>
                <Divider />
                <Box>
                  <Typography variant="caption" color="text.secondary">SETUP</Typography>
                  <Typography variant="body1">{entry.setup || "-"}</Typography>
                </Box>
              </Stack>
            </Grid>
          </Grid>
        </DialogContent>
      </Dialog>
      <Dialog open={showConfirm} onClose={() => setShowConfirm(false)}>
        <DialogTitle>Supprimer le trade ?</DialogTitle>
        <DialogActions>
          <Button onClick={() => setShowConfirm(false)}>Annuler</Button>
          <Button onClick={handleDelete} color="error" variant="contained">Supprimer</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};


const Journal = () => {
  const theme = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [assetFilter, setAssetFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [accountFilter, setAccountFilter] = useState("");

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [currentEntry, setCurrentEntry] = useState(null);
  const [formPrefill, setFormPrefill] = useState(null);

  // Broker data for selects
  const [brokerAccounts, setBrokerAccounts] = useState([]);
  const [brokerAssets, setBrokerAssets] = useState([]);

  // Ref to avoid double-triggering on strict mode double-effect
  const handledTradeId = useRef(null);

  useEffect(() => {
    loadEntries();
    // Load broker accounts and unique assets
    fetchBrokerAccounts()
      .then(setBrokerAccounts)
      .catch(() => { });
    fetchBrokerSummary()
      .then((data) => {
        const trades = data?.trades || [];
        const unique = [...new Set(trades.map((t) => cleanAssetName(t.asset)).filter(Boolean))].sort();
        setBrokerAssets(unique);
      })
      .catch(() => { });
  }, []);

  // After entries load, handle ?tradeId param from dashboard nav
  useEffect(() => {
    const tradeId = searchParams.get("tradeId");
    if (!tradeId || loading) return;
    if (handledTradeId.current === tradeId) return;
    handledTradeId.current = tradeId;

    // Check if a journal entry already exists for this trade
    const existing = entries.find((e) => String(e.trade_id) === String(tradeId));
    if (existing) {
      // Analysis exists → open detail modal directly
      setCurrentEntry(existing);
      setDetailModalOpen(true);
    } else {
      // No analysis yet → open create form pre-filled with trade data
      const asset = searchParams.get("asset") || "";
      const date = searchParams.get("date") || "";
      const dir = searchParams.get("dir") || "";
      const pnl = parseFloat(searchParams.get("pnl") || "0");
      const account = searchParams.get("account") || "";
      setFormPrefill({ trade_id: tradeId, asset, date, direction: dir, pnl, account });
      setCurrentEntry(null);
      setFormModalOpen(true);
    }
    // Clean URL param without navigation
    setSearchParams({}, { replace: true });
  }, [searchParams, entries, loading, setSearchParams]);


  const loadEntries = () => {
    setLoading(true);
    fetchJournalEntries()
      .then(setEntries)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };


  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      // 1. Text search
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const asset = (entry.asset || "").toLowerCase();
        const setup = (entry.setup || "").toLowerCase();
        if (!asset.includes(query) && !setup.includes(query)) {
          return false;
        }
      }
      // 2. Asset filter
      if (assetFilter && entry.asset !== assetFilter) {
        return false;
      }
      // 3. Date filter
      if (dateFilter) {
        const entryDate = entry.date ? new Date(entry.date).toISOString().slice(0, 10) : "";
        if (entryDate !== dateFilter) {
          return false;
        }
      }
      // 4. Account filter
      if (accountFilter && entry.account !== accountFilter) {
        return false;
      }
      return true;
    });
  }, [entries, searchQuery, assetFilter, dateFilter, accountFilter]);

  const stats = useMemo(() => {
    if (filteredEntries.length === 0) return { winRate: 0, total: 0, bestAsset: "N/A" };
    const total = filteredEntries.length;
    const wins = filteredEntries.filter(e => e.result === 'Win').length;
    const losses = filteredEntries.filter(e => e.result === 'Loss').length;
    const relevantTotal = wins + losses;
    const winRate = relevantTotal > 0 ? Math.round((wins / relevantTotal) * 100) : 0;

    const assetsCount = filteredEntries.reduce((acc, e) => { acc[e.asset] = (acc[e.asset] || 0) + 1; return acc; }, {});
    const bestAsset = Object.keys(assetsCount).reduce((a, b) => assetsCount[a] > assetsCount[b] ? a : b, "N/A");
    return { winRate, total, bestAsset };
  }, [filteredEntries]);

  const handleSaveEntry = async (data) => {
    if (data.id) {
      await updateJournalEntry(data);
    } else {
      await saveJournalEntry(data);
    }
    loadEntries();
    setDetailModalOpen(false);
  };

  const handleDelete = async (id) => {
    await deleteJournalEntry(id);
    loadEntries();
  };

  const openFormForNew = () => {
    setCurrentEntry(null);
    setFormPrefill(null);
    setFormModalOpen(true);
  };

  const openFormForEdit = () => {
    setFormPrefill(null);
    setFormModalOpen(true);
    setDetailModalOpen(false);
  };

  const openDetail = (entry) => {
    setCurrentEntry(entry);
    setDetailModalOpen(true);
  };

  return (
    <Box sx={{ minHeight: "100%", bgcolor: "background.default" }}>
      {/* HERO HEADER */}
      {/* HERO HEADER - 2026 Minimalist */}
      <Box sx={{ pt: 8, pb: 4, px: { xs: 2, md: 4 }, bgcolor: "background.default" }}>
        <Container maxWidth={false} sx={{ px: { xs: 2, sm: 4, xl: 8 } }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between" spacing={4}>
            <Box>
              <Typography variant="h2" fontWeight={700} letterSpacing="-0.03em" sx={{ color: 'text.primary' }}>
                Journal
              </Typography>
              <Typography variant="subtitle1" color="text.secondary" sx={{ mt: 1, fontWeight: 400 }}>
                Historique visuel et analyse de vos performances.
              </Typography>
            </Box>
            <Button variant="contained" disableElevation size="large" onClick={openFormForNew} startIcon={<AddIcon />} sx={{ borderRadius: 2, px: 3, py: 1.5, fontWeight: 600, textTransform: 'none', fontSize: '1rem', bgcolor: 'text.primary', color: 'background.paper', '&:hover': { bgcolor: 'text.secondary' } }}>
              Nouveau Trade
            </Button>
          </Stack>

          {/* STATS INLINE MINIMAL */}
          <Stack direction="row" spacing={{ xs: 3, md: 6 }} sx={{ mt: 8, borderTop: `1px solid ${theme.palette.divider}`, pt: 4 }}>
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={500} textTransform="uppercase" letterSpacing={1}>Total Trades</Typography>
              <Typography variant="h4" fontWeight={600} letterSpacing="-0.02em" mt={0.5}>{stats.total}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={500} textTransform="uppercase" letterSpacing={1}>Win Rate</Typography>
              <Typography variant="h4" fontWeight={600} letterSpacing="-0.02em" mt={0.5} sx={{ color: stats.winRate >= 50 ? 'success.main' : 'error.main' }}>
                {stats.winRate}%
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={500} textTransform="uppercase" letterSpacing={1}>Atout</Typography>
              <Typography variant="h4" fontWeight={600} letterSpacing="-0.02em" mt={0.5}>{stats.bestAsset}</Typography>
            </Box>
          </Stack>
        </Container>
      </Box>

      {/* MAIN CONTENT */}
      <Container maxWidth={false} sx={{ py: 4, px: { xs: 2, sm: 4, xl: 8 } }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          alignItems={{ xs: "stretch", md: "center" }}
          sx={{ mb: 4, pb: 2, borderBottom: `1px solid ${theme.palette.divider}` }}
        >
          {/* Text Search */}
          <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, px: 2, py: 1, bgcolor: alpha(theme.palette.divider, 0.04), borderRadius: 2 }}>
            <SearchIcon color="action" sx={{ mr: 1, fontSize: 20 }} />
            <TextField
              placeholder="Rechercher par actif, description..."
              variant="standard"
              InputProps={{ disableUnderline: true, style: { fontSize: '0.95rem', fontWeight: 500 } }}
              fullWidth
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </Box>

          {/* Asset Filter */}
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Actif</InputLabel>
            <Select
              value={assetFilter}
              label="Actif"
              onChange={(e) => setAssetFilter(e.target.value)}
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value=""><em>Tous</em></MenuItem>
              {Object.keys(
                entries.reduce((acc, e) => {
                  if (e.asset) acc[e.asset] = true;
                  return acc;
                }, {})
              )
                .sort()
                .map((a) => (
                  <MenuItem key={a} value={a}>{a}</MenuItem>
                ))}
            </Select>
          </FormControl>

          {/* Date Filter */}
          <TextField
            label="Date"
            type="date"
            size="small"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 150, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />

          {/* Account Filter */}
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Compte</InputLabel>
            <Select
              value={accountFilter}
              label="Compte"
              onChange={(e) => setAccountFilter(e.target.value)}
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value=""><em>Tous</em></MenuItem>
              {Object.keys(
                entries.reduce((acc, e) => {
                  if (e.account) acc[e.account] = true;
                  return acc;
                }, {})
              )
                .sort()
                .map((a) => (
                  <MenuItem key={a} value={a}>{a}</MenuItem>
                ))}
            </Select>
          </FormControl>

          {/* Clear Filters (if active) */}
          {(searchQuery || assetFilter || dateFilter || accountFilter) && (
            <Button
              size="small"
              onClick={() => {
                setSearchQuery("");
                setAssetFilter("");
                setDateFilter("");
                setAccountFilter("");
              }}
              sx={{ minWidth: "auto", textTransform: "none", color: "text.secondary" }}
            >
              Effacer
            </Button>
          )}
        </Stack>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : filteredEntries.length > 0 ? (
          <Grid container spacing={3}>
            {filteredEntries.map((entry) => {
              const mainBg = entry.images && entry.images.length > 0 ? entry.images[0] : null;
              const dateObj = new Date(entry.date);
              return (
                <Grid item xs={12} sm={6} md={4} lg={3} key={entry.id}>
                  <Fade in={true} timeout={400}>
                    <Box
                      onClick={() => openDetail(entry)}
                      sx={{
                        cursor: 'pointer',
                        '&:hover .img-container': { opacity: 0.85 },
                      }}
                    >
                      <Box className="img-container" sx={{ position: 'relative', width: '100%', pt: '65%', borderRadius: 2, overflow: 'hidden', mb: 2, border: `1px solid ${theme.palette.divider}`, transition: 'opacity 0.2s', bgcolor: alpha(theme.palette.divider, 0.05) }}>
                        {mainBg ? (
                          <img src={mainBg} alt="breakdown" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <PhotoCameraIcon sx={{ color: 'text.disabled', opacity: 0.3 }} />
                          </Box>
                        )}
                        <Box sx={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 1 }}>
                          <Chip label={entry.result} size="small" sx={{ height: 22, fontSize: '0.65rem', fontWeight: 600, bgcolor: 'background.paper', color: `${RESULT_COLORS[entry.result]}.main` }} />
                          <Chip label={entry.direction} size="small" sx={{ height: 22, fontSize: '0.65rem', fontWeight: 600, bgcolor: 'background.paper', color: 'text.primary' }} />
                        </Box>
                      </Box>

                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                        <Box sx={{ pr: 2 }}>
                          <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                            <Typography variant="subtitle1" fontWeight={600} sx={{ lineHeight: 1 }}>{entry.asset}</Typography>
                            <Typography variant="caption" color="text.secondary">{getAssetCategory(entry.asset)}</Typography>
                          </Stack>
                          <Typography variant="body2" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {entry.setup || 'Aucune description'}
                          </Typography>
                        </Box>
                        <Typography variant="caption" color="text.disabled" fontWeight={500} sx={{ flexShrink: 0 }}>
                          {dateObj.toLocaleDateString("fr-FR", { day: 'numeric', month: 'short' })}
                        </Typography>
                      </Stack>
                    </Box>
                  </Fade>
                </Grid>
              );
            })}
          </Grid>
        ) : (
          <Paper variant="outlined" sx={{ p: 6, textAlign: "center", borderStyle: 'dashed' }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Aucun trade trouvé
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Cliquez sur "Ajouter un Trade" pour commencer.
            </Typography>
          </Paper>
        )}
      </Container>


      <JournalFormModal
        open={formModalOpen}
        onClose={() => { setFormModalOpen(false); setFormPrefill(null); }}
        entry={currentEntry}
        prefill={formPrefill}
        onSave={handleSaveEntry}
        brokerAccounts={brokerAccounts}
        brokerAssets={brokerAssets}
      />
      <JournalDetailModal
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        entry={currentEntry}
        onEdit={openFormForEdit}
        onDelete={handleDelete}
      />

    </Box>
  );
};

export default Journal;
