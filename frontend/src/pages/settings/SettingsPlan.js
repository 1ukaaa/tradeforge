// frontend/src/pages/settings/SettingsPlan.js
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import CloseIcon from "@mui/icons-material/Close";
import DangerousIcon from '@mui/icons-material/Dangerous';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import FlagIcon from '@mui/icons-material/Flag';
import MapIcon from '@mui/icons-material/Map';
import SaveIcon from '@mui/icons-material/Save';
import TuneIcon from '@mui/icons-material/Tune';

import {
  alpha,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  Paper,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useTheme
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { fetchPlan, savePlan } from "../../services/planClient";
import {
  buildPlanDescription,
  DEFAULT_PLAN,
  formatSavedAt,
  TRADING_STYLES,
  TRADING_WINDOWS,
} from "../../utils/planUtils";

// --- Composant Input "Pro" (Style unifié) ---
const ProInput = (props) => {
  const theme = useTheme();
  return (
    <TextField
      variant="filled"
      size="small"
      fullWidth
      InputProps={{
        disableUnderline: true,
        sx: {
          borderRadius: 2,
          bgcolor: alpha(theme.palette.background.default, 0.5),
          border: `1px solid ${theme.palette.divider}`,
          transition: "all 0.2s",
          "&:hover": {
            bgcolor: alpha(theme.palette.background.default, 0.8),
            borderColor: theme.palette.primary.main
          },
          "&.Mui-focused": {
            bgcolor: theme.palette.background.paper,
            borderColor: theme.palette.primary.main,
            boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.1)}`
          },
          ...props.InputProps?.sx
        },
        ...props.InputProps
      }}
      {...props}
    />
  );
};

// --- Hook Logique (Inchangé) ---
const useTradingPlan = () => {
  const [tradingPlan, setTradingPlan] = useState(DEFAULT_PLAN);
  const [planSavedAt, setPlanSavedAt] = useState(null);
  const [planSaving, setPlanSaving] = useState(false);
  const [planFeedback, setPlanFeedback] = useState({ text: "", severity: "success" });

  useEffect(() => {
    let cancelled = false;
    const loadPlan = async () => {
      try {
        const { plan, updatedAt } = await fetchPlan();
        if (cancelled) return;
        if (plan) setTradingPlan(plan);
        if (updatedAt) setPlanSavedAt(updatedAt);
      } catch (err) {
        if (cancelled) return;
        console.warn("Impossible de charger le plan :", err);
      }
    };
    loadPlan();
    return () => { cancelled = true; };
  }, []);

  const planDescription = useMemo(() => buildPlanDescription(tradingPlan), [tradingPlan]);

  const markPlanEdited = () => {
    setPlanSavedAt(null);
    if (planFeedback.text) setPlanFeedback({ text: "", severity: "success" });
  };

  const handleWindowToggle = (_, value) => {
    const newValue = Array.isArray(value) ? value : [];
    setTradingPlan((prev) => ({ ...prev, windows: newValue }));
    markPlanEdited();
  };
  
  const handleStyleChange = (_, value) => {
    if (!value) return;
    setTradingPlan((prev) => ({ ...prev, style: value }));
    markPlanEdited();
  };
  
  const handleNewsToggle = (_, value) => {
    if (!value) return;
    setTradingPlan((prev) => ({ ...prev, tradeDuringNews: value === "yes" }));
    markPlanEdited();
  };
  
  const handlePlanFieldChange = (field) => (event) => {
    setTradingPlan((prev) => ({ ...prev, [field]: event.target.value }));
    markPlanEdited();
  };

  const handlePlanSave = async () => {
    setPlanSaving(true);
    setPlanFeedback({ text: "", severity: "success" });
    try {
      const { plan, updatedAt } = await savePlan(tradingPlan);
      if (plan) setTradingPlan(plan);
      if (updatedAt) setPlanSavedAt(updatedAt);
      setPlanFeedback({ text: "Plan enregistré", severity: "success" });
    } catch (err) {
      setPlanFeedback({ text: err.message || "Impossible d’enregistrer.", severity: "error" });
    } finally {
      setPlanSaving(false);
    }
  };

  return {
    tradingPlan,
    planSavedAt,
    planSaving,
    planFeedback,
    planDescription,
    handleWindowToggle,
    handleStyleChange,
    handleNewsToggle,
    handlePlanFieldChange,
    handlePlanSave
  };
};

// --- Composant Principal ---
const SettingsPlan = () => {
  const theme = useTheme();
  const {
    tradingPlan,
    planSavedAt,
    planSaving,
    planFeedback,
    planDescription,
    handleWindowToggle,
    handleStyleChange,
    handleNewsToggle,
    handlePlanFieldChange,
    handlePlanSave
  } = useTradingPlan();
  
  const [previewOpen, setPreviewOpen] = useState(false);

  return (
    <>
      <Paper 
        elevation={0}
        sx={{ 
          maxWidth: "lg", 
          mx: "auto",
          borderRadius: 3, 
          border: `1px solid ${theme.palette.divider}`,
          overflow: 'hidden',
          bgcolor: alpha(theme.palette.background.paper, 0.6),
          backdropFilter: 'blur(10px)'
        }}
      >
        {/* --- HEADER --- */}
        <Box sx={{ 
          p: 3, 
          borderBottom: `1px solid ${theme.palette.divider}`,
          background: `linear-gradient(90deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, transparent 100%)`
        }}>
          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems="center" spacing={2}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Box sx={{ p: 1, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', display: 'flex' }}>
                <MapIcon />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.2 }}>
                  Plan de Trading Global
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Votre constitution de trader. L'IA l'utilisera pour vous coacher.
                </Typography>
              </Box>
            </Stack>

            <Button variant="outlined" size="small" onClick={() => setPreviewOpen(true)} startIcon={<AutoFixHighIcon />}>
              Voir ce que l'IA comprend
            </Button>
          </Stack>
        </Box>

        {/* --- BODY --- */}
        <Box sx={{ p: { xs: 2, md: 4 } }}>
          
          {/* 1. PROFIL (Barre de contrôle) */}
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mb: 4, bgcolor: alpha(theme.palette.background.default, 0.4) }}>
             <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} md={4}>
                    <Stack spacing={1}>
                        <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <TuneIcon fontSize="inherit" /> STYLE
                        </Typography>
                        <ToggleButtonGroup value={tradingPlan.style} exclusive onChange={handleStyleChange} size="small" fullWidth>
                            {TRADING_STYLES.map((style) => (
                            <ToggleButton key={style.value} value={style.value} sx={{ borderRadius: 1 }}>{style.label}</ToggleButton>
                            ))}
                        </ToggleButtonGroup>
                    </Stack>
                </Grid>
                <Grid item xs={12} md={5}>
                    <Stack spacing={1}>
                        <Typography variant="caption" fontWeight={700} color="text.secondary">SESSIONS / HORAIRES</Typography>
                        <ToggleButtonGroup value={tradingPlan.windows} onChange={handleWindowToggle} size="small" sx={{ flexWrap: 'wrap' }}>
                            {TRADING_WINDOWS.map((window) => (
                            <ToggleButton key={window} value={window} sx={{ borderRadius: 1, px: 2 }}>{window}</ToggleButton>
                            ))}
                        </ToggleButtonGroup>
                    </Stack>
                </Grid>
                <Grid item xs={12} md={3}>
                     <Stack spacing={1}>
                        <Typography variant="caption" fontWeight={700} color="text.secondary">NEWS ?</Typography>
                        <ToggleButtonGroup value={tradingPlan.tradeDuringNews ? "yes" : "no"} exclusive onChange={handleNewsToggle} size="small" fullWidth>
                            <ToggleButton value="yes" color="error">Autorisé</ToggleButton>
                            <ToggleButton value="no" color="success">Interdit</ToggleButton>
                        </ToggleButtonGroup>
                    </Stack>
                </Grid>
             </Grid>
          </Paper>

          {/* 2. LA TRIADE TACTIQUE (3 Colonnes) */}
          <Grid container spacing={3}>
            
            {/* A. CONTEXTE & ACTIFS (Bleu) */}
            <Grid item xs={12} md={4}>
              <Stack spacing={2} sx={{ height: '100%' }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <FlagIcon fontSize="small" sx={{ color: theme.palette.info.main }} />
                  <Typography variant="subtitle2" fontWeight={800} sx={{ color: theme.palette.info.main, letterSpacing: '0.05em' }}>
                    CONTEXTE & ENTRÉES
                  </Typography>
                </Stack>
                
                <Paper sx={{ p: 2, flex: 1, borderRadius: 2, borderTop: `3px solid ${theme.palette.info.main}` }}>
                    <Stack spacing={2}>
                        <Box>
                            <Typography variant="caption" color="text.secondary" fontWeight={600}>PAIRES PRIORITAIRES</Typography>
                            <ProInput 
                                value={tradingPlan.pairs} 
                                onChange={handlePlanFieldChange("pairs")} 
                                placeholder="Ex: EURUSD, GOLD..." 
                            />
                        </Box>
                        <Divider />
                        <Box>
                            <Typography variant="caption" color="text.secondary" fontWeight={600}>STRATÉGIE & SIGNAUX</Typography>
                            <ProInput
                                multiline
                                minRows={6}
                                value={tradingPlan.entryStrategy}
                                onChange={handlePlanFieldChange("entryStrategy")}
                                placeholder="- Breakout confirmé H1&#10;- Retest VWAP&#10;- Divergence RSI..."
                                sx={{ '& .MuiInputBase-root': { alignItems: 'flex-start' } }}
                            />
                        </Box>
                    </Stack>
                </Paper>
              </Stack>
            </Grid>

            {/* B. INVALIDATION & RISQUE (Rouge) */}
            <Grid item xs={12} md={4}>
              <Stack spacing={2} sx={{ height: '100%' }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <DangerousIcon fontSize="small" sx={{ color: theme.palette.error.main }} />
                  <Typography variant="subtitle2" fontWeight={800} sx={{ color: theme.palette.error.main, letterSpacing: '0.05em' }}>
                    RISQUE (SL)
                  </Typography>
                </Stack>
                
                <Paper sx={{ p: 2, flex: 1, borderRadius: 2, borderTop: `3px solid ${theme.palette.error.main}` }}>
                    <Stack spacing={2}>
                        <Box>
                             <Typography variant="caption" color="text.secondary" fontWeight={600}>RÈGLES DE RISQUE</Typography>
                             <ProInput
                                multiline
                                minRows={8}
                                value={tradingPlan.risk}
                                onChange={handlePlanFieldChange("risk")}
                                placeholder="- Max 1% par trade&#10;- Stop Loss obligatoire&#10;- Breakeven à 1R..."
                             />
                        </Box>
                    </Stack>
                </Paper>
              </Stack>
            </Grid>

            {/* C. OBJECTIFS & GESTION (Vert) */}
            <Grid item xs={12} md={4}>
               <Stack spacing={2} sx={{ height: '100%' }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <EmojiEventsIcon fontSize="small" sx={{ color: theme.palette.success.main }} />
                  <Typography variant="subtitle2" fontWeight={800} sx={{ color: theme.palette.success.main, letterSpacing: '0.05em' }}>
                    OBJECTIFS & SORTIES
                  </Typography>
                </Stack>
                 <Paper sx={{ p: 2, flex: 1, borderRadius: 2, borderTop: `3px solid ${theme.palette.success.main}` }}>
                    <Stack spacing={2}>
                        <Box>
                             <Typography variant="caption" color="text.secondary" fontWeight={600}>GESTION DU TRADE</Typography>
                             <ProInput
                                multiline
                                minRows={8}
                                value={tradingPlan.management}
                                onChange={handlePlanFieldChange("management")}
                                placeholder="- TP1 sur zone de liquidité&#10;- Clôture partielle à 2R&#10;- Trail Stop manuel..."
                             />
                        </Box>
                    </Stack>
                </Paper>
              </Stack>
            </Grid>

            {/* D. REMARQUES (Large) */}
            <Grid item xs={12}>
               <Stack spacing={1}>
                 <Typography variant="caption" fontWeight={700} color="text.secondary">NOTES / PHILOSOPHIE</Typography>
                 <ProInput
                    multiline
                    minRows={2}
                    value={tradingPlan.notes}
                    onChange={handlePlanFieldChange("notes")}
                    placeholder="Mantra personnel, règles psychologiques..."
                  />
               </Stack>
            </Grid>

          </Grid>
        </Box>

        {/* --- FOOTER --- */}
        <Box sx={{ 
          p: 2, 
          bgcolor: alpha(theme.palette.background.default, 0.3), 
          borderTop: `1px solid ${theme.palette.divider}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
           <Box>
            {planSavedAt && (
                <Chip 
                    label={`Sauvegardé le ${formatSavedAt(planSavedAt)}`} 
                    size="small" 
                    variant="outlined" 
                    sx={{ color: 'text.secondary', borderColor: 'divider' }}
                />
            )}
            {planFeedback.text && (
                <Typography variant="caption" color={planFeedback.severity === "error" ? "error" : "success.main"} sx={{ ml: 2, fontWeight: 600 }}>
                {planFeedback.text}
                </Typography>
            )}
           </Box>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handlePlanSave}
            disabled={planSaving}
            sx={{
              borderRadius: 2,
              px: 4,
              fontWeight: 700,
              boxShadow: theme.shadows[4],
              textTransform: 'none'
            }}
          >
            {planSaving ? "Sauvegarde..." : "Enregistrer le Plan"}
          </Button>
        </Box>
      </Paper>

      {/* Modale de Prévisualisation (Inchangée) */}
      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} fullWidth maxWidth="md">
        <DialogTitle sx={{ pr: 8 }}>
          Ce que l'IA va retenir
           <IconButton
            onClick={() => setPreviewOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
            <Box
              component="pre"
              sx={{
                whiteSpace: "pre-wrap",
                fontFamily: `'JetBrains Mono',monospace`,
                bgcolor: (theme) => alpha(theme.palette.background.default, 0.5),
                borderRadius: 2,
                p: 2,
                fontSize: "0.85rem"
              }}
            >
              {planDescription}
            </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Fermer</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SettingsPlan;