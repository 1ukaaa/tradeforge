import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import DoneRoundedIcon from "@mui/icons-material/DoneRounded";
import LabelIcon from "@mui/icons-material/Label";
import NumbersIcon from "@mui/icons-material/Numbers";
import SaveIcon from "@mui/icons-material/Save";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";

import {
  Alert,
  alpha,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { getCurrencySymbol } from "../utils/accountUtils";
import BrandLogo from "./BrandLogo";

// --- Visualisateur Markdown (Clean & Minimaliste) ---
const SimpleMarkdownViewer = ({ content }) => {
  const theme = useTheme();
  const blocks = content.split("\n").reduce((acc, line) => {
    const trimmed = line.trim();
    if (trimmed === "") {
      if (acc.length > 0 && acc[acc.length - 1].type !== "space") acc.push({ type: "space" });
    } else if (trimmed.match(/^(\d+\.|-|\*)\s/)) {
      const listType = acc.length > 0 && acc[acc.length - 1].type === "list";
      if (listType) acc[acc.length - 1].items.push(trimmed.replace(/^(\d+\.|-|\*)\s/, ""));
      else acc.push({ type: "list", items: [trimmed.replace(/^(\d+\.|-|\*)\s/, "")] });
    } else if (trimmed.match(/^(#+)\s/)) {
      acc.push({ type: "heading", content: trimmed.replace(/^(#+)\s/, "") });
    } else {
      const paraType = acc.length > 0 && acc[acc.length - 1].type === "paragraph";
      if (paraType) acc[acc.length - 1].content += " " + trimmed;
      else acc.push({ type: "paragraph", content: trimmed });
    }
    return acc;
  }, []);

  return (
    <Stack spacing={1.5} sx={{ color: "text.primary" }}>
      {blocks.map((block, index) => {
        if (block.type === "paragraph") {
          return (
            <Typography key={index} variant="body2" sx={{ 
              fontFamily: theme.typography.fontFamily, 
              lineHeight: 1.8, 
              fontSize: "0.95rem",
              color: alpha(theme.palette.text.primary, 0.9)
            }}>
              {block.content}
            </Typography>
          );
        }
        if (block.type === "heading") {
          return (
            <Typography key={index} variant="h6" sx={{ 
              fontWeight: 700, 
              mt: 2, 
              fontSize: "1rem", 
              color: theme.palette.secondary.main,
              letterSpacing: "0.02em"
            }}>
              {block.content}
            </Typography>
          );
        }
        if (block.type === "list") {
          return (
            <Box component="ul" key={index} sx={{ pl: 2.5, m: 0 }}>
              {block.items.map((item, idx) => (
                <Typography component="li" key={idx} variant="body2" sx={{ lineHeight: 1.7, mb: 0.5 }}>
                  {item}
                </Typography>
              ))}
            </Box>
          );
        }
        return null;
      })}
    </Stack>
  );
};

const formatBrokerTradeOption = (trade) => {
  if (!trade) return "";
  const pnlValue = Number(trade.pnl);
  const pnlStr = Number.isFinite(pnlValue) ? `${pnlValue >= 0 ? "+" : ""}${pnlValue.toFixed(2)}` : "";
  return `${trade.symbol} • ${trade.direction} • ${pnlStr}`;
};

const EditableAnalysis = ({
  content,
  initialMetadata,
  onSave,
  saving,
  saveError,
  saveSuccess,
  accountOptions = [],
  defaultAccountId = null,
  entryType = "analyse",
  brokerTrades = [],
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isDark = theme.palette.mode === "dark";
  
  const [copied, setCopied] = useState(false);
  const [editableMeta, setEditableMeta] = useState(initialMetadata || {});

  useEffect(() => { setEditableMeta(initialMetadata || {}); }, [initialMetadata]);
  useEffect(() => { if (copied) setTimeout(() => setCopied(false), 2000); }, [copied]);

  // Auto-select account logic
  useEffect(() => {
    if (editableMeta.accountId || accountOptions.length === 0) return;
    const fallbackId = defaultAccountId || accountOptions[0]?.id;
    if (fallbackId) {
      const acc = accountOptions.find((a) => a.id === fallbackId);
      setEditableMeta((prev) => ({
        ...prev,
        accountId: fallbackId,
        accountName: acc?.name,
        pnlCurrency: acc?.currency || prev.pnlCurrency,
      }));
    }
  }, [accountOptions, defaultAccountId, editableMeta.accountId]);

  const selectedAccount = accountOptions.find(a => a.id === (editableMeta.accountId || defaultAccountId));
  
  const availableBrokerTrades = useMemo(() => {
    if (!brokerTrades.length || !selectedAccount) return brokerTrades;
    return brokerTrades.filter((t) => t.brokerAccountId === selectedAccount.id);
  }, [brokerTrades, selectedAccount]);

  const selectedBrokerTrade = useMemo(() => {
    if (!editableMeta.brokerTradeId) return null;
    return availableBrokerTrades.find(t => t.id === editableMeta.brokerTradeId || (t.fillIds || []).includes(editableMeta.brokerTradeId)) || null;
  }, [availableBrokerTrades, editableMeta.brokerTradeId]);

  const handleMetaChange = (field) => (e) => setEditableMeta(prev => ({ ...prev, [field]: e.target.value }));
  const handleTagsChange = (e, v) => setEditableMeta(prev => ({ ...prev, tags: v.map(val => (typeof val === 'string' ? val : val.inputValue)) }));
  
  const handleBrokerTradeChange = (_, newTrade) => {
    if (!newTrade) {
      setEditableMeta(prev => ({ ...prev, brokerTradeId: undefined, brokerTradeLabel: undefined }));
      return;
    }
    setEditableMeta(prev => ({
      ...prev,
      brokerTradeId: newTrade.id,
      brokerTradeLabel: formatBrokerTradeOption(newTrade),
      accountId: newTrade.brokerAccountId,
      pnlAmount: newTrade.pnl,
      symbol: prev.symbol || newTrade.symbol,
    }));
  };

  const handleCopy = () => { navigator.clipboard.writeText(content).then(() => setCopied(true)); };
  const handleSave = () => { onSave(content, editableMeta); };

  const isTrade = (editableMeta.entryType || entryType || "analyse").toLowerCase() === "trade";
  const pnlVal = Number(editableMeta.pnlAmount);
  const isWin = pnlVal > 0;
  const isLoss = pnlVal < 0;
  const pnlColor = isWin ? theme.palette.success.main : isLoss ? theme.palette.error.main : theme.palette.text.secondary;

  return (
    <Stack direction="row" spacing={2} sx={{ width: "100%", alignItems: "flex-start" }}>
      
      {/* Avatar (Sticky on Desktop) */}
      <Box sx={{ 
        position: isMobile ? "static" : "sticky", 
        top: 20,
        mt: 1.5
      }}>
         <Box sx={{
            width: 36, height: 36, borderRadius: "12px",
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            display: "flex", alignItems: "center", justifyContent: "center",
            color: theme.palette.primary.main
         }}>
            <BrandLogo glyphSize={20} showText={false} />
         </Box>
      </Box>

      {/* Main Card Container - SPLIT VIEW */}
      <Paper elevation={0} sx={{
        flex: 1,
        display: "flex",
        flexDirection: { xs: "column", md: "row" }, // COLUMN on Mobile, ROW on Desktop
        borderRadius: 3,
        overflow: "hidden",
        border: `1px solid ${theme.palette.divider}`,
        bgcolor: theme.palette.background.paper,
        boxShadow: isDark ? "0 8px 30px rgba(0,0,0,0.3)" : "0 8px 30px rgba(0,0,0,0.05)"
      }}>

        {/* === LEFT PANEL: CONTENT (65%) === */}
        <Box sx={{ 
          flex: { md: "1 1 65%" }, 
          p: { xs: 2, md: 3 },
          borderRight: { md: `1px solid ${theme.palette.divider}` }
        }}>
          {/* Header Title */}
          <TextField
            fullWidth
            variant="standard"
            placeholder="Titre de l'analyse..."
            value={editableMeta.title || ""}
            onChange={handleMetaChange("title")}
            InputProps={{
              disableUnderline: true,
              sx: { 
                fontSize: "1.25rem", 
                fontWeight: 700, 
                mb: 2,
                color: theme.palette.text.primary 
              }
            }}
          />
          
          <Divider sx={{ mb: 3, borderColor: alpha(theme.palette.divider, 0.5) }} />

          {/* Content Viewer */}
          <SimpleMarkdownViewer content={content} />
          
          {/* Copy Action (Inline for left panel) */}
          <Box sx={{ mt: 4, display: "flex", gap: 1 }}>
            <Button 
              size="small" 
              startIcon={copied ? <DoneRoundedIcon /> : <ContentCopyRoundedIcon />}
              onClick={handleCopy}
              sx={{ color: "text.secondary", fontSize: "0.75rem" }}
            >
              {copied ? "Texte copié" : "Copier le texte"}
            </Button>
          </Box>
        </Box>

        {/* === RIGHT PANEL: INSPECTOR / METADATA (35%) === */}
        <Box sx={{ 
          flex: { md: "0 0 320px" }, // Fixed width on desktop
          bgcolor: isDark ? alpha(theme.palette.background.default, 0.4) : alpha(theme.palette.background.default, 0.6),
          p: 2.5,
          display: "flex",
          flexDirection: "column",
          gap: 2.5
        }}>
          
          <Typography variant="overline" sx={{ color: "text.secondary", fontWeight: 700, letterSpacing: "0.1em" }}>
            Propriétés
          </Typography>

          {/* 1. Context Fields */}
          <Stack spacing={2}>
             <TextField
                label="Symbole"
                size="small"
                variant="outlined"
                fullWidth
                value={editableMeta.symbol || ""}
                onChange={handleMetaChange("symbol")}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><NumbersIcon fontSize="inherit" /></InputAdornment>,
                  sx: { bgcolor: theme.palette.background.paper }
                }}
              />
              <TextField
                label="Timeframe"
                size="small"
                variant="outlined"
                fullWidth
                value={editableMeta.timeframe || ""}
                onChange={handleMetaChange("timeframe")}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><CalendarTodayIcon fontSize="inherit" /></InputAdornment>,
                  sx: { bgcolor: theme.palette.background.paper }
                }}
              />
          </Stack>

          <Divider sx={{ borderStyle: "dashed" }} />

          {/* 2. Financials (Only if Trade) */}
          {isTrade && (
            <Stack spacing={2}>
               <TextField
                  select
                  label="Compte"
                  size="small"
                  fullWidth
                  value={editableMeta.accountId || selectedAccount?.id || ""}
                  onChange={(e) => {
                    const acc = accountOptions.find(a => a.id === e.target.value);
                    setEditableMeta(prev => ({ ...prev, accountId: acc?.id, accountName: acc?.name, pnlCurrency: acc?.currency }));
                  }}
                  InputProps={{ sx: { bgcolor: theme.palette.background.paper } }}
                >
                  {accountOptions.map((acc) => <MenuItem key={acc.id} value={acc.id}>{acc.name}</MenuItem>)}
               </TextField>

               {/* PnL Highlight Box */}
               <Paper variant="outlined" sx={{ 
                 p: 1.5, 
                 bgcolor: alpha(pnlColor, 0.05), 
                 borderColor: alpha(pnlColor, 0.3),
                 display: "flex",
                 flexDirection: "column",
                 gap: 1
               }}>
                 <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="caption" color="text.secondary">Résultat (PnL)</Typography>
                    {isWin ? <TrendingUpIcon sx={{ color: pnlColor, fontSize: 18 }} /> : isLoss ? <TrendingDownIcon sx={{ color: pnlColor, fontSize: 18 }} /> : <AccountBalanceWalletIcon sx={{ color: "text.disabled", fontSize: 18 }} />}
                 </Stack>
                 <Stack direction="row" spacing={1}>
                   <TextField
                      variant="standard"
                      placeholder="0.00"
                      type="number"
                      value={editableMeta.pnlAmount ?? ""}
                      onChange={handleMetaChange("pnlAmount")}
                      InputProps={{
                        disableUnderline: true,
                        sx: { fontSize: "1.4rem", fontWeight: 700, color: pnlColor }
                      }}
                      sx={{ flex: 1 }}
                   />
                   <Typography sx={{ alignSelf: "center", color: pnlColor, fontWeight: 600 }}>
                      {getCurrencySymbol(editableMeta.pnlCurrency)}
                   </Typography>
                 </Stack>
               </Paper>

               {availableBrokerTrades.length > 0 && (
                <Autocomplete
                  options={availableBrokerTrades}
                  value={selectedBrokerTrade}
                  onChange={handleBrokerTradeChange}
                  getOptionLabel={formatBrokerTradeOption}
                  isOptionEqualToValue={(o, v) => o.id === v.id}
                  renderInput={(params) => (
                    <TextField {...params} label="Lier import broker" size="small" sx={{ bgcolor: theme.palette.background.paper }} />
                  )}
                />
               )}
            </Stack>
          )}

          {/* 3. Tags */}
          <Box sx={{ flex: 1 }}>
            <Autocomplete
              multiple
              freeSolo
              options={[]}
              value={editableMeta.tags || []}
              onChange={handleTagsChange}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip 
                    label={option} 
                    size="small" 
                    {...getTagProps({ index })} 
                    sx={{ bgcolor: alpha(theme.palette.secondary.main, 0.1), color: theme.palette.secondary.main, border: "none", borderRadius: 1 }}
                  />
                ))
              }
              renderInput={(params) => (
                <TextField 
                  {...params} 
                  label="Tags" 
                  placeholder="Stratégie, Psy..." 
                  size="small"
                  InputProps={{ ...params.InputProps, startAdornment: (
                    <>
                      <InputAdornment position="start"><LabelIcon fontSize="inherit" sx={{ opacity: 0.5 }} /></InputAdornment>
                      {params.InputProps.startAdornment}
                    </>
                  ), sx: { bgcolor: theme.palette.background.paper } }}
                />
              )}
            />
          </Box>

          {/* 4. Action Button (Bottom of Sidebar) */}
          <Box sx={{ mt: "auto", pt: 2 }}>
            {saveError && <Alert severity="error" sx={{ mb: 2, fontSize: "0.8rem" }}>{saveError}</Alert>}
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleSave}
              disabled={saving || !!saveSuccess}
              startIcon={saving ? <CircularProgress size={20} color="inherit" /> : saveSuccess ? <CheckCircleIcon /> : <SaveIcon />}
              sx={{
                bgcolor: saveSuccess ? "success.main" : theme.palette.primary.main,
                color: theme.palette.primary.contrastText,
                py: 1.2,
                fontWeight: 600,
                boxShadow: `0 4px 14px ${alpha(saveSuccess ? theme.palette.success.main : theme.palette.primary.main, 0.4)}`,
                "&:hover": {
                  bgcolor: saveSuccess ? "success.dark" : "primary.dark",
                }
              }}
            >
              {saveSuccess ? "Enregistré !" : "Valider l'entrée"}
            </Button>
          </Box>

        </Box>
      </Paper>
    </Stack>
  );
};

export default EditableAnalysis;