import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import CandlestickChartIcon from "@mui/icons-material/CandlestickChart";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DescriptionIcon from "@mui/icons-material/Description";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import LinkIcon from "@mui/icons-material/Link";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import QueryStatsIcon from "@mui/icons-material/QueryStats";
import TuneIcon from "@mui/icons-material/Tune";

import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  alpha,
  Autocomplete,
  Box,
  Button,
  Chip,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
  useTheme
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { getCurrencySymbol } from "../utils/accountUtils";

// --- Helpers ---

const formatBrokerTradeOption = (trade) => {
  if (!trade) return "";
  const date = trade.closedAt || trade.openedAt;
  const dateLabel = date
    ? new Date(date).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
    : "";
  const pnlValue = Number(trade.pnl);
  const pnlLabel = Number.isFinite(pnlValue)
    ? ` • ${pnlValue >= 0 ? "+" : ""}${pnlValue.toFixed(2)}`
    : "";
  return `${trade.symbol} (${trade.direction}) • ${dateLabel}${pnlLabel}`;
};

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} id={`edit-tabpanel-${index}`} {...other} style={{ height: "100%" }}>
      {value === index && <Box sx={{ pt: 3, height: "100%" }}>{children}</Box>}
    </div>
  );
}

const EditEntryForm = ({ 
  entry, 
  accountOptions = [], 
  brokerTrades = [], 
  onDataChange,
  onImageDelete 
}) => {
  const theme = useTheme();
  const [tabIndex, setTabIndex] = useState(0);
  const [newImageUrl, setNewImageUrl] = useState("");

  // --- Logic ---

  const updateMeta = (updates) => onDataChange({ ...entry, metadata: { ...entry.metadata, ...updates } });
  const updateContent = (value) => onDataChange({ ...entry, content: value });
  const handleTagsChange = (e, val) => updateMeta({ tags: val.map((t) => (typeof t === "string" ? t : t.inputValue)) });

  const meta = entry.metadata || {};
  const selectedAccountId = meta.accountId;

  // --- CALCULATEUR AUTOMATIQUE % (CORRIGÉ) ---
  useEffect(() => {
    // 1. Vérif : A-t-on un PnL et un Compte ?
    if (!meta.pnlAmount || !selectedAccountId || accountOptions.length === 0) return;

    // 2. Trouver le compte (Comparaison String vs String pour éviter les erreurs de type)
    const account = accountOptions.find(a => String(a.id) === String(selectedAccountId));
    if (!account) return;

    // 3. Chercher le capital (Balance ou Equity ou InitialBalance)
    const balance = Number(account.balance) || Number(account.equity) || Number(account.initialBalance) || 0;
    const pnl = Number(meta.pnlAmount);

    // 4. Calculer si possible
    if (balance > 0 && !isNaN(pnl)) {
       const percent = ((pnl / balance) * 100).toFixed(2);
       
       // Mise à jour uniquement si la valeur change (évite boucle infinie)
       if (meta.pnlPercent !== percent) {
          updateMeta({ pnlPercent: percent });
       }
    }
  }, [meta.pnlAmount, selectedAccountId, accountOptions]); 


  // --- Suite de la logique ---

  const availableBrokerTrades = useMemo(() => {
    if (!selectedAccountId || !brokerTrades.length) return [];
    return brokerTrades.filter(t => t.brokerAccountId === selectedAccountId);
  }, [selectedAccountId, brokerTrades]);

  const selectedBrokerTrade = useMemo(() => {
    const tradeId = meta.brokerTradeId;
    if (!tradeId || !availableBrokerTrades.length) return null;
    return availableBrokerTrades.find(t => t.id === tradeId || (t.fillIds && t.fillIds.includes(tradeId))) || null;
  }, [meta.brokerTradeId, availableBrokerTrades]);

  const handleAccountChange = (e) => {
    const acc = accountOptions.find(a => a.id === e.target.value);
    updateMeta({ 
      accountId: acc?.id, 
      accountName: acc?.name, 
      pnlCurrency: acc?.currency || meta.pnlCurrency, 
      brokerTradeId: undefined 
    });
  };

  const handleBrokerTradeChange = (event, trade) => {
    if (!trade) {
      updateMeta({ brokerTradeId: undefined });
      return;
    }
    // AUTO-FILL
    const d = trade.openedAt ? new Date(trade.openedAt) : null;
    const localDate = d ? new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : undefined;

    updateMeta({
      brokerTradeId: trade.id,
      symbol: trade.symbol || meta.symbol,
      direction: trade.direction || meta.direction,
      pnlAmount: trade.pnl,
      pnlCurrency: trade.currency,
      entryPrice: trade.avgEntryPrice || trade.price || meta.entryPrice,
      exitPrice: trade.avgClosePrice || meta.exitPrice,
      lotSize: trade.quantity || trade.size || meta.lotSize,
      fees: trade.commission || trade.fees || 0,
      swap: trade.swap || 0,
      date: localDate || meta.date
    });
  };

  const handleAddImageUrl = () => {
    if (newImageUrl.trim()) {
      updateMeta({ images: [...(meta.images || []), { src: newImageUrl.trim() }] });
      setNewImageUrl("");
    }
  };

  // UI States
  const hasTechnicalData = meta.entryPrice || meta.exitPrice || meta.fees || meta.swap;
  const pnlVal = Number(meta.pnlAmount);
  const pnlColor = pnlVal > 0 ? theme.palette.success.main : pnlVal < 0 ? theme.palette.error.main : theme.palette.text.primary;
  const pnlBg = pnlVal > 0 ? alpha(theme.palette.success.main, 0.08) : pnlVal < 0 ? alpha(theme.palette.error.main, 0.08) : alpha(theme.palette.action.disabled, 0.05);

  return (
    <Box sx={{ width: "100%", minHeight: 450 }}>
      {/* --- Styled Tabs --- */}
      <Paper 
        elevation={0} 
        sx={{ 
          bgcolor: alpha(theme.palette.primary.main, 0.04), 
          borderRadius: 3, 
          p: 0.5,
          border: `1px solid ${theme.palette.divider}` 
        }}
      >
        <Tabs
          value={tabIndex}
          onChange={(e, v) => setTabIndex(v)}
          variant="fullWidth"
          indicatorColor="none"
          sx={{
            minHeight: 40,
            "& .MuiTab-root": {
              textTransform: "none",
              fontWeight: 600,
              borderRadius: 2.5,
              minHeight: 40,
              fontSize: "0.9rem",
              transition: "all 0.2s",
              color: "text.secondary",
              "&.Mui-selected": {
                bgcolor: "background.paper",
                color: "primary.main",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
              },
              "&:hover:not(.Mui-selected)": {
                bgcolor: alpha(theme.palette.action.hover, 0.5)
              }
            },
          }}
        >
          <Tab icon={<TuneIcon sx={{ fontSize: 18, mr: 1 }} />} label="Général" iconPosition="start" />
          <Tab icon={<CandlestickChartIcon sx={{ fontSize: 18, mr: 1 }} />} label="Exécution" iconPosition="start" />
          <Tab icon={<DescriptionIcon sx={{ fontSize: 18, mr: 1 }} />} label="Narratif" iconPosition="start" />
          <Tab icon={<AddPhotoAlternateIcon sx={{ fontSize: 18, mr: 1 }} />} label="Média" iconPosition="start" />
        </Tabs>
      </Paper>

      {/* --- TAB 1: GÉNÉRAL (Context) --- */}
      <TabPanel value={tabIndex} index={0}>
        <Stack spacing={3}>
           <TextField
            label="Titre du Journal"
            fullWidth
            variant="outlined"
            value={meta.title || ""}
            onChange={(e) => updateMeta({ title: e.target.value })}
            placeholder="Une phrase pour résumer ce trade..."
            InputProps={{ sx: { fontSize: "1.1rem" } }}
           />

           <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField
                  select
                  label="Résultat"
                  fullWidth
                  value={meta.result || "BREAKEVEN"}
                  onChange={(e) => updateMeta({ result: e.target.value })}
                >
                  <MenuItem value="WIN">WIN</MenuItem>
                  <MenuItem value="LOSS">LOSS</MenuItem>
                  <MenuItem value="BREAKEVEN">BE</MenuItem>
                  <MenuItem value="OPEN">EN COURS</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={4}>
                 <TextField select label="Direction" fullWidth value={meta.direction || "LONG"} onChange={(e) => updateMeta({ direction: e.target.value })}>
                    <MenuItem value="LONG">LONG 🟢</MenuItem>
                    <MenuItem value="SHORT">SHORT 🔴</MenuItem>
                 </TextField>
              </Grid>
              <Grid item xs={12} sm={4}>
                 <TextField type="datetime-local" label="Date" fullWidth InputLabelProps={{ shrink: true }} value={meta.date || ""} onChange={(e) => updateMeta({ date: e.target.value })} />
              </Grid>
           </Grid>

           <Grid container spacing={2}>
              <Grid item xs={6}>
                 <TextField label="Symbole" fullWidth value={meta.symbol || ""} onChange={(e) => updateMeta({ symbol: e.target.value })} />
              </Grid>
              <Grid item xs={6}>
                 <TextField label="Timeframe" fullWidth value={meta.timeframe || ""} onChange={(e) => updateMeta({ timeframe: e.target.value })} />
              </Grid>
           </Grid>

           <TextField label="Setup / Stratégie" fullWidth value={meta.setup || ""} onChange={(e) => updateMeta({ setup: e.target.value })} />
           
           <Autocomplete
              multiple
              freeSolo
              options={[]}
              value={meta.tags || []}
              onChange={handleTagsChange}
              renderTags={(value, getTagProps) => value.map((option, index) => <Chip label={option} size="small" {...getTagProps({ index })} />)}
              renderInput={(params) => <TextField {...params} label="Tags" placeholder="Contexte, Psy..." />}
            />
        </Stack>
      </TabPanel>

      {/* --- TAB 2: EXÉCUTION (Financials) --- */}
      <TabPanel value={tabIndex} index={1}>
        <Stack spacing={3}>
          
          {/* 1. BROKER LINK CARD */}
          <Paper variant="outlined" sx={{ 
            p: 2.5, 
            borderRadius: 3, 
            border: `1px solid ${selectedAccountId ? theme.palette.primary.main : theme.palette.divider}`,
            bgcolor: selectedAccountId ? alpha(theme.palette.primary.main, 0.02) : "background.paper",
            position: 'relative',
            overflow: 'hidden'
          }}>
             {selectedAccountId && <Box sx={{ position: 'absolute', top: 0, right: 0, p: 0.5, bgcolor: 'primary.main', color: 'white', borderBottomLeftRadius: 8, fontSize: '0.7rem', fontWeight: 'bold' }}>LINKED</Box>}
             
             <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                <Box sx={{ p: 1, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}>
                   <LinkIcon fontSize="small" />
                </Box>
                <Typography variant="subtitle2" fontWeight={700}>Source de Données (Broker)</Typography>
             </Stack>

             <Grid container spacing={2}>
                <Grid item xs={12} sm={5}>
                   <TextField
                      select
                      label="Compte"
                      size="small"
                      fullWidth
                      value={meta.accountId || ""}
                      onChange={handleAccountChange}
                      InputProps={{ startAdornment: <InputAdornment position="start"><AccountBalanceIcon fontSize="inherit" /></InputAdornment> }}
                   >
                      {accountOptions.map((acc) => <MenuItem key={acc.id} value={acc.id}>{acc.name}</MenuItem>)}
                      {accountOptions.length === 0 && <MenuItem disabled>Aucun compte</MenuItem>}
                   </TextField>
                </Grid>
                <Grid item xs={12} sm={7}>
                    <Autocomplete
                      options={availableBrokerTrades}
                      value={selectedBrokerTrade}
                      onChange={handleBrokerTradeChange}
                      getOptionLabel={formatBrokerTradeOption}
                      isOptionEqualToValue={(o, v) => o.id === v.id}
                      disabled={!selectedAccountId}
                      renderInput={(params) => (
                        <TextField 
                          {...params} 
                          label={selectedAccountId ? "Rechercher position..." : "Sélectionner un compte"} 
                          size="small" 
                          placeholder="ID, Symbole..."
                        />
                      )}
                    />
                </Grid>
             </Grid>
          </Paper>

          {/* 2. PNL DISPLAY */}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
             <Paper elevation={0} sx={{ 
                flex: 1, 
                p: 2, 
                bgcolor: pnlBg, 
                borderRadius: 3, 
                border: `1px solid ${alpha(pnlColor, 0.2)}`,
                display: "flex", 
                flexDirection: "column", 
                justifyContent: "center" 
              }}>
                <Typography variant="caption" fontWeight={700} sx={{ color: pnlColor, opacity: 0.8, mb: 0.5 }}>RÉSULTAT NET</Typography>
                <TextField
                  variant="standard"
                  value={meta.pnlAmount ?? ""}
                  onChange={(e) => updateMeta({ pnlAmount: e.target.value })}
                  placeholder="0.00"
                  type="number"
                  InputProps={{
                    disableUnderline: true,
                    startAdornment: <InputAdornment position="start"><Typography variant="h4" fontWeight={700} color={pnlColor}>{getCurrencySymbol(meta.pnlCurrency)}</Typography></InputAdornment>,
                    sx: { fontSize: "2rem", fontWeight: 800, color: pnlColor }
                  }}
                />
             </Paper>

             {/* STATS - LE % DEVRAIT S'AFFICHER ICI MAINTENANT */}
             <Paper elevation={0} sx={{ flex: 0.6, p: 2, borderRadius: 3, border: `1px solid ${theme.palette.divider}`, display: "flex", flexDirection: "column", gap: 1 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                   <QueryStatsIcon fontSize="small" color="action" />
                   <Typography variant="caption" fontWeight={700} color="text.secondary">STATS</Typography>
                </Stack>
                <Stack direction="row" spacing={1}>
                  <TextField 
                    label="R:R" 
                    size="small" 
                    variant="standard" 
                    value={meta.rr ?? ""} 
                    onChange={(e) => updateMeta({ rr: e.target.value })} 
                    InputProps={{ disableUnderline: true, sx: { fontWeight: 600 } }} 
                  />
                  <Divider orientation="vertical" flexItem />
                  <TextField 
                    label="%" 
                    size="small" 
                    variant="standard" 
                    value={meta.pnlPercent ?? ""} 
                    onChange={(e) => updateMeta({ pnlPercent: e.target.value })} 
                    helperText={meta.pnlPercent ? "Auto" : "En attente"}
                    InputProps={{ disableUnderline: true, sx: { fontWeight: 600 } }} 
                  />
                </Stack>
             </Paper>
          </Stack>

          {/* 3. DETAILS ACCORDION */}
          <Accordion 
            elevation={0} 
            defaultExpanded={!!hasTechnicalData} 
            sx={{ 
              border: `1px solid ${theme.palette.divider}`, 
              borderRadius: '12px !important', 
              '&:before': { display: 'none' },
              bgcolor: 'background.paper'
            }}
          >
             <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Stack direction="row" alignItems="center" spacing={1}>
                   <MonetizationOnIcon fontSize="small" color="action" />
                   <Typography variant="subtitle2" fontWeight={600}>Détails d'Exécution</Typography>
                   {!hasTechnicalData && <Typography variant="caption" color="text.secondary">(Optionnel)</Typography>}
                </Stack>
             </AccordionSummary>
             <AccordionDetails sx={{ pt: 0 }}>
                <Grid container spacing={2}>
                   <Grid item xs={6} sm={3}>
                      <TextField label="Entrée" size="small" fullWidth variant="filled" value={meta.entryPrice || ""} onChange={(e) => updateMeta({ entryPrice: e.target.value })} InputProps={{ disableUnderline: true, sx: { borderRadius: 1 } }} />
                   </Grid>
                   <Grid item xs={6} sm={3}>
                      <TextField label="Sortie" size="small" fullWidth variant="filled" value={meta.exitPrice || ""} onChange={(e) => updateMeta({ exitPrice: e.target.value })} InputProps={{ disableUnderline: true, sx: { borderRadius: 1 } }} />
                   </Grid>
                   <Grid item xs={6} sm={2}>
                      <TextField label="Lots" size="small" fullWidth variant="filled" value={meta.lotSize || ""} onChange={(e) => updateMeta({ lotSize: e.target.value })} InputProps={{ disableUnderline: true, sx: { borderRadius: 1 } }} />
                   </Grid>
                   <Grid item xs={6} sm={2}>
                      <TextField label="Comm." size="small" fullWidth variant="filled" value={meta.fees || ""} onChange={(e) => updateMeta({ fees: e.target.value })} InputProps={{ disableUnderline: true, sx: { borderRadius: 1 } }} />
                   </Grid>
                   <Grid item xs={12} sm={2}>
                      <TextField label="Swap" size="small" fullWidth variant="filled" value={meta.swap || ""} onChange={(e) => updateMeta({ swap: e.target.value })} InputProps={{ disableUnderline: true, sx: { borderRadius: 1 } }} />
                   </Grid>
                </Grid>
             </AccordionDetails>
          </Accordion>

        </Stack>
      </TabPanel>

      {/* --- TAB 3: NARRATIF --- */}
      <TabPanel value={tabIndex} index={2}>
         <Stack spacing={3}>
            <TextField
              label="Journal de Trading"
              multiline
              minRows={8}
              fullWidth
              variant="outlined"
              value={entry.content || ""}
              onChange={(e) => updateContent(e.target.value)}
              placeholder="Racontez votre trade..."
              sx={{ "& .MuiInputBase-root": { fontFamily: 'monospace', lineHeight: 1.6 } }}
            />
            <TextField
              label="État Psychologique"
              fullWidth
              size="small"
              value={meta.emotions || ""}
              onChange={(e) => updateMeta({ emotions: e.target.value })}
              InputProps={{ startAdornment: <InputAdornment position="start">🧠</InputAdornment> }}
            />
         </Stack>
      </TabPanel>

      {/* --- TAB 4: MÉDIA --- */}
      <TabPanel value={tabIndex} index={3}>
        <Stack spacing={2}>
          <Stack direction="row" spacing={1}>
             <TextField size="small" fullWidth placeholder="https://..." value={newImageUrl} onChange={(e) => setNewImageUrl(e.target.value)} />
             <Button variant="contained" onClick={handleAddImageUrl} disableElevation>Ajouter</Button>
          </Stack>
          
          <Box sx={{ 
             display: 'grid', 
             gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', 
             gap: 2, 
             mt: 2 
          }}>
             {(meta.images || []).map((img, idx) => (
                <Box key={idx} sx={{ 
                   position: 'relative', 
                   aspectRatio: '1/1', 
                   borderRadius: 2, 
                   overflow: 'hidden', 
                   border: `1px solid ${theme.palette.divider}`,
                   bgcolor: 'black'
                }}>
                   <img src={img.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                   <IconButton 
                      size="small" 
                      onClick={() => onImageDelete(idx)}
                      sx={{ position: 'absolute', top: 4, right: 4, bgcolor: 'rgba(0,0,0,0.6)', color: 'white', '&:hover': { bgcolor: 'error.main' } }}
                   >
                      <DeleteOutlineIcon fontSize="small" />
                   </IconButton>
                </Box>
             ))}
             {(!meta.images || meta.images.length === 0) && (
                <Box sx={{ gridColumn: '1/-1', p: 4, textAlign: 'center', border: `2px dashed ${theme.palette.divider}`, borderRadius: 3, color: 'text.disabled' }}>
                   <AddPhotoAlternateIcon sx={{ fontSize: 40, mb: 1, opacity: 0.5 }} />
                   <Typography variant="body2">Aucune image. Collez (Ctrl+V) ici.</Typography>
                </Box>
             )}
          </Box>
        </Stack>
      </TabPanel>
    </Box>
  );
};

export default EditEntryForm;