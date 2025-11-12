// frontend/src/pages/settings/SettingsPlan.js
// VARIANTE 4 : LE MODE "ZEN" (FOCUS)
//
// Approche : Supprime la prévisualisation latérale au profit d'un formulaire large et centré.
//            La prévisualisation est disponible via un bouton qui ouvre une modale.
// + Avantages : Interface très épurée, focus total sur la rédaction du plan.
// - Inconvénients : Pas de feedback visuel instantané de la prévisualisation.

import CloseIcon from "@mui/icons-material/Close"; // Pour la modale
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { ForgeCard } from "../../components/ForgeUI";
import { fetchPlan, savePlan } from "../../services/planClient";
import {
  buildPlanDescription,
  DEFAULT_PLAN,
  formatSavedAt,
  TRADING_STYLES,
  TRADING_WINDOWS,
} from "../../utils/planUtils";

// Logique de hook (inchangée)
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
        setPlanFeedback({ text: `Erreur au chargement du plan: ${err.message}`, severity: "error" });
      }
    };
    loadPlan();
    return () => { cancelled = true; };
  }, []);

  const planDescription = useMemo(() => buildPlanDescription(tradingPlan), [tradingPlan]);

  const markPlanEdited = () => {
    setPlanSavedAt(null);
    if (planFeedback.text) {
      setPlanFeedback({ text: "", severity: "success" });
    }
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
      setPlanFeedback({
        text: err.message || "Impossible d’enregistrer le plan.",
        severity: "error",
      });
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

const SettingsPlan = () => {
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
      <ForgeCard
        subtitle="WORKFLOW / FOCUS"
        title="Éditeur de Plan"
        helper="Rédigez votre plan sans distraction. Cliquez sur 'Prévisualiser' pour voir le rendu final."
        // Centre la carte et limite sa largeur pour le mode focus
        sx={{ maxWidth: "md", mx: "auto" }} 
      >
        <Stack spacing={3} sx={{ p: { xs: 0, md: 2 } }}>
          {/* Section 1: Profil */}
          <Stack spacing={2}>
            <Typography variant="h6">Profil de Trading</Typography>
            <Stack spacing={1}>
              <Typography variant="subtitle2" color="text.secondary">Style</Typography>
              <ToggleButtonGroup value={tradingPlan.style} exclusive onChange={handleStyleChange} size="small" sx={{ flexWrap: "wrap" }}>
                {TRADING_STYLES.map((style) => (
                  <ToggleButton key={style.value} value={style.value}>{style.label}</ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Stack>
            <Stack spacing={1}>
              <Typography variant="subtitle2" color="text.secondary">Horaires</Typography>
              <ToggleButtonGroup value={tradingPlan.windows} onChange={handleWindowToggle} size="small" sx={{ flexWrap: "wrap" }}>
                {TRADING_WINDOWS.map((window) => (
                  <ToggleButton key={window} value={window}>{window}</ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Stack>
          </Stack>

          {/* Section 2: Stratégie */}
          <Stack spacing={2}>
            <Typography variant="h6">Stratégie</Typography>
            <TextField
              label="Paires prioritaires"
              value={tradingPlan.pairs}
              onChange={handlePlanFieldChange("pairs")}
              placeholder="EURUSD, NAS100"
              size="small"
            />
            <TextField
              label="Entrées & Signaux"
              value={tradingPlan.entryStrategy}
              onChange={handlePlanFieldChange("entryStrategy")}
              multiline
              minRows={4}
              fullWidth
              size="small"
            />
          </Stack>
          
          {/* Section 3: Gestion */}
          <Stack spacing={2}>
            <Typography variant="h6">Gestion & Risque</Typography>
             <Stack spacing={1}>
                <Typography variant="subtitle2" color="text.secondary">Trading pendant les annonces ?</Typography>
                <ToggleButtonGroup
                  value={tradingPlan.tradeDuringNews ? "yes" : "no"}
                  exclusive
                  onChange={handleNewsToggle}
                  size="small"
                >
                  <ToggleButton value="yes">Oui</ToggleButton>
                  <ToggleButton value="no">Non</ToggleButton>
                </ToggleButtonGroup>
              </Stack>
            <TextField
              label="Gestion du risque"
              value={tradingPlan.risk}
              onChange={handlePlanFieldChange("risk")}
              multiline
              minRows={3}
              fullWidth
              size="small"
            />
            <TextField
              label="Gestion des sorties"
              value={tradingPlan.management}
              onChange={handlePlanFieldChange("management")}
              multiline
              minRows={3}
              fullWidth
              size="small"
            />
              <TextField
              label="Remarques"
              value={tradingPlan.notes}
              onChange={handlePlanFieldChange("notes")}
              multiline
              minRows={2}
              fullWidth
              size="small"
            />
          </Stack>
          
          {/* Actions */}
          <Stack spacing={2} direction="row" sx={{ mt: 3, pt: 3, borderTop: 1, borderColor: "divider" }}>
             <Button variant="contained" onClick={handlePlanSave} disabled={planSaving}>
              {planSaving ? "Enregistrement…" : "Sauvegarder le plan"}
            </Button>
            <Button variant="outlined" color="secondary" onClick={() => setPreviewOpen(true)}>
              Prévisualiser le Plan
            </Button>
          </Stack>
          {planSavedAt && (
            <Typography variant="caption" color="text.secondary">
              Plan sauvegardé le {formatSavedAt(planSavedAt)}
            </Typography>
          )}
          {planFeedback.text && (
            <Typography
              variant="caption"
              color={planFeedback.severity === "error" ? "error.main" : "success.main"}
            >
              {planFeedback.text}
            </Typography>
          )}
        </Stack>
      </ForgeCard>

      {/* Modale de Prévisualisation */}
      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} fullWidth maxWidth="md">
        <DialogTitle sx={{ pr: 8 }}>
          Prévisualisation du Plan
           <IconButton
            aria-label="close"
            onClick={() => setPreviewOpen(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
           <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Ce texte sera envoyé à Gemini pour calibrer la capture de vos futures entrées.
            </Typography>
            <Box
              component="pre"
              sx={{
                whiteSpace: "pre-wrap",
                wordWrap: "break-word",
                fontFamily: `'JetBrains Mono','Fira Code',monospace`,
                bgcolor: (theme) => theme.palette.mode === 'dark' ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                borderRadius: 2,
                p: 2,
                mb: 1,
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