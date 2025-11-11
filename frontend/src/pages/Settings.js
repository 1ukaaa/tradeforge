import SettingsSuggestIcon from "@mui/icons-material/SettingsSuggest";
import {
  Box,
  Button,
  Chip,
  MenuItem,
  Paper,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { ForgeCard, PageHero } from "../components/ForgeUI";
import { useThemeMode } from "../context/ThemeModeContext";
import { fetchPlan, savePlan } from "../services/planClient";
import {
  deletePromptVariant,
  fetchPromptVariants,
  fetchSettings,
  fetchStructuredTemplates,
  savePromptVariant,
  saveSettings,
  saveStructuredTemplate,
} from "../services/settingsClient";
import {
  buildPlanDescription,
  DEFAULT_PLAN,
  formatSavedAt,
  TRADING_STYLES,
  TRADING_WINDOWS,
} from "../utils/planUtils";

// --- CONSTANTES LOCALES (Manquantes dans le contexte précédent) ---

const STRUCTURED_VARIANTS = [
  {
    value: "detailed",
    label: "Analyse détaillée",
    description: "Rien ne manque : contexte, scénarios, risques, verdict et enseignements.",
  },
  {
    value: "summary",
    label: "Synthèse rapide",
    description: "Focus sur l’essentiel (actions, verdict) avec des champs très courts.",
  },
];

const DEFAULT_PROMPT_TEMPLATES = {
  analysis: `Tu es un assistant de journal de trading, expert des marchés dérivés.
Analyse le contenu fourni et restitue un rapport ultra synthétique en français en respectant STRICTEMENT ce format markdown :

TYPE : Analyse

1. 🔭 Contexte multi-timeframes (Monthly / Weekly / Daily)
2. 🧭 Zones clés & stratégie (Daily)
3. ⏱️ Structure intraday (H4 / H1 / M15)
4. 🎯 Scénarios proposés — présente au moins deux options et précise le niveau d'invalidation pour chaque
5. ⚠️ Risques & invalidations
6. ✅ Next steps / synthèse finale

Règles :
- Style professionnel, phrases courtes, aucune redite, tu ne prends pas de position définitive.
- Utilise des listes à puces pour les niveaux, arguments et scénarios.
- Termine par une synthèse chiffrée si des niveaux sont mentionnés.

CONTENU SOURCE :
{{rawText}}
`,
  trade: `Tu es un assistant de journal de trading, expert des marchés dérivés.
Analyse le contenu fourni comme un trade exécuté (ou validé) et restitue un rapport ultra synthétique en français en respectant STRICTEMENT ce format markdown :

TYPE : Trade

1. 🔭 Contexte multi-timeframes (Monthly / Weekly / Daily)
2. 🧭 Zones clés & stratégie (Daily et intraday)
3. ⏱️ Structure intraday (H4 / H1 / M15) et ordre exécuté
4. 🎯 Objectifs & déroulé — mention des niveaux visés (TP, SL) et du dénouement
5. 📍 Résultat final — indique TP, SL ou en cours + ton jugement (bonne décision, ajustement à faire, erreur)
6. ⚓ Relecture du trade — si TP, explique ce qui a marché ; si SL, argumente sur la qualité de la décision malgré la perte
7. ⚠️ Risques & invalidations (ce qui aurait pu casser le plan)
8. ✅ Enseignements / verdict synthétique chiffré

Règles :
- Style direct, phrases très courtes, pas de redite.
- Mentionne explicitement si le trade a TP ou SL puis analyse si c'était une erreur ou un bon trade malgré tout.
- Utilise des listes à puces pour chaque section.

Plan de trading fourni :
{{plan || "Plan manquant — indique pourquoi l’absence de plan a impacté la lecture du trade."}}

Mission :
- Commente si l'exécution rapportée suit ou dévie du plan ; détaille les écarts (TA, gestion du risque, niveaux, timing).
- Indique la qualité de la décision finale (bonne décision, ajustement nécessaire, erreur) en lien avec ce plan.

CONTENU SOURCE :
{{rawText}}
`,
};

const DEFAULT_TEMPLATES = {
  detailed: `Tu es un assistant de trading responsable de remplir un journal de suivi (mode {{variantTitle}}).\n{{instruction}}\nAnalyse le contenu fourni et retourne STRICTEMENT un objet JSON valide avec cette structure :\n{\n  "entryType": "{{entryType}}",\n  "metadata": {\n    "title": "...",\n    "planSummary": "...",\n    "result": "...",\n    "grade": "...",\n    "planAdherence": 0-100,\n    "tags": ["...", "..."],\n    "outcome": "...",\n    "timeframe": "...",\n    "symbol": "...",\n    "nextSteps": "...",\n    "risk": "..."\n  },\n  "content": "Résumé synthétique (optionnel)"\n}\nCONTENU SOURCE :\n{{rawText}}\nPLAN :\n{{plan}}`,
  summary: `Tu es un assistant de trading responsable de remplir un journal de suivi (mode {{variantTitle}}).\n{{instruction}}\nRetourne un objet JSON valide avec la structure suivante, en restant synthétique (<=100 caractères par champ).\n{\n  "entryType": "{{entryType}}",\n  "metadata": {\n    "title": "...",\n    "planSummary": "...",\n    "result": "...",\n    "grade": "...",\n    "planAdherence": 0-100,\n    "tags": ["...", "..."],\n    "outcome": "...",\n    "timeframe": "...",\n    "symbol": "...",\n    "nextSteps": "...",\n    "risk": "..."\n  },\n  "content": "Résumé synthétique (optionnel)"\n}\nCONTENU SOURCE :\n{{rawText}}\nPLAN :\n{{plan}}`,
};

// --- COMPOSANT ---

const Settings = () => {
  // États pour les onglets
  const [activeTab, setActiveTab] = useState("plan"); // Défaut sur le plan
  const { mode: themeMode, toggleMode } = useThemeMode();
  
  // États pour le Plan de Trading
  const [tradingPlan, setTradingPlan] = useState(DEFAULT_PLAN);
  const [planSavedAt, setPlanSavedAt] = useState(null);
  const [planSaving, setPlanSaving] = useState(false);
  const [planFeedback, setPlanFeedback] = useState({ text: "", severity: "success" });

  // États pour les Prompts Structurés
  const [structuredVariant, setStructuredVariant] = useState("detailed");
  const [templates, setTemplates] = useState({});
  const [templateText, setTemplateText] = useState(DEFAULT_TEMPLATES.detailed);
  const [templateSaving, setTemplateSaving] = useState(false);
  const [templateFeedback, setTemplateFeedback] = useState({ text: "", severity: "success" });

  // États pour les Variantes Gemini
  const [analysisVariantActive, setAnalysisVariantActive] = useState("default");
  const [tradeVariantActive, setTradeVariantActive] = useState("default");
  const [promptVariants, setPromptVariants] = useState({ analysis: [], trade: [] });
  const [selectedPromptType, setSelectedPromptType] = useState("analysis");
  const [selectedPromptVariant, setSelectedPromptVariant] = useState("default");
  const [variantNameInput, setVariantNameInput] = useState("default");
  const [variantPromptText, setVariantPromptText] = useState(DEFAULT_PROMPT_TEMPLATES.analysis);
  const [variantSaving, setVariantSaving] = useState(false);
  const [variantFeedback, setVariantFeedback] = useState({ text: "", severity: "success" });
  const [variantDeleting, setVariantDeleting] = useState(false);


  // --- EFFETS DE CHARGEMENT ---

  useEffect(() => {
    let cancelled = false;
    
    // Charger le Plan de Trading
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

    // Charger les Réglages IA (settings + variants)
    const loadAISettings = async () => {
      try {
        const [settings, variants] = await Promise.all([fetchSettings(), fetchPromptVariants()]);
        if (cancelled) return;
        
        if (settings.structuredVariant) setStructuredVariant(settings.structuredVariant);
        setAnalysisVariantActive(settings.analysisVariant || "default");
        setTradeVariantActive(settings.tradeVariant || "default");
        setPromptVariants(variants);

        // Initialiser la sélection sur le premier onglet
        const initialVariant =
          variants.analysis?.find((item) => item.variant === (settings.analysisVariant || "default"))?.variant ||
          variants.analysis?.[0]?.variant ||
          "default";
        setSelectedPromptType("analysis");
        setSelectedPromptVariant(initialVariant);
        setVariantNameInput(initialVariant);
        setVariantPromptText(
          variants.analysis?.find((item) => item.variant === initialVariant)?.prompt ||
            DEFAULT_PROMPT_TEMPLATES.analysis
        );
      } catch (err) {
        if (cancelled) return;
        console.warn("Impossible de charger les paramètres IA :", err);
      }
    };

    // Charger les Templates Structurés
    const loadTemplates = async () => {
      try {
        const fetched = await fetchStructuredTemplates();
        if (cancelled) return;
        const mapped = fetched.reduce((acc, template) => {
          acc[template.variant] = template;
          return acc;
        }, {});
        setTemplates(mapped);
      } catch (err) {
        if (cancelled) return;
        console.warn("Impossible de charger les templates :", err);
      }
    };

    loadPlan();
    loadAISettings();
    loadTemplates();

    return () => {
      cancelled = true;
    };
  }, []); // Exécuté une seule fois au montage

  // --- EFFETS DE SYNCHRONISATION D'ÉTAT ---

  // Synchro pour l'éditeur de Variantes Gemini
  useEffect(() => {
    const list = promptVariants[selectedPromptType] || [];
    const matched = list.find((variant) => variant.variant === selectedPromptVariant);
    setVariantPromptText(matched?.prompt || DEFAULT_PROMPT_TEMPLATES[selectedPromptType]);
    setVariantNameInput(selectedPromptVariant);
  }, [selectedPromptType, selectedPromptVariant, promptVariants]);

  // Synchro pour l'éditeur de Prompt Structuré
  useEffect(() => {
    const selection = templates[structuredVariant];
    const fallback = DEFAULT_TEMPLATES[structuredVariant] || "";
    setTemplateText(selection?.prompt || fallback);
  }, [structuredVariant, templates]);

  // Scroll vers les onglets au changement
  useEffect(() => {
    if (typeof document !== "undefined") {
      const container = document.getElementById("settings-tabs");
      container?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [activeTab]);

  // --- HANDLERS ---

  const handleTabChange = (_, newValue) => {
    setActiveTab(newValue);
  };

  // Handlers pour le Plan
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
  
  // Handlers pour le Prompt Structuré
  const handleVariantChange = (_, value) => {
    if (!value) return;
    setStructuredVariant(value);
  };

  const handleTemplateChange = (event) => {
    setTemplateText(event.target.value);
    setTemplateFeedback({ text: "", severity: "success" });
  };

  const handleTemplateSave = async () => {
    setTemplateSaving(true);
    setTemplateFeedback("");
    try {
      const updated = await saveStructuredTemplate(structuredVariant, templateText);
      setTemplates((prev) => ({ ...prev, [updated.variant]: updated }));
      setTemplateFeedback({ text: "Template sauvegardé", severity: "success" });
    } catch (err) {
      setTemplateFeedback({
        text: err.message || "Impossible d’enregistrer le template.",
        severity: "error",
      });
    } finally {
      setTemplateSaving(false);
    }
  };

  // Handlers pour les Variantes Gemini
  const handleVariantTypeChange = (_, value) => {
    if (!value) return;
    setSelectedPromptType(value);
    const list = promptVariants[value] || [];
    const fallbackVariant = value === "analysis" ? analysisVariantActive : tradeVariantActive;
    const defaultSelection =
      list.find((variant) => variant.variant === fallbackVariant)?.variant ||
      list[0]?.variant ||
      "default";
    setSelectedPromptVariant(defaultSelection);
    setVariantNameInput(defaultSelection);
    setVariantFeedback({ text: "", severity: "success" });
  };

  const handleVariantSelectionChange = (event) => {
    setSelectedPromptVariant(event.target.value);
  };

  const handleVariantNameChange = (event) => {
    setVariantNameInput(event.target.value);
  };

  const handleVariantTextChange = (event) => {
    setVariantPromptText(event.target.value);
  };

  const handleVariantSave = async () => {
    if (!variantNameInput) {
      setVariantFeedback({ text: "Le nom de la variante est requis.", severity: "error" });
      return;
    }
    setVariantSaving(true);
    setVariantFeedback({ text: "", severity: "success" });
    try {
      const updated = await savePromptVariant(selectedPromptType, variantNameInput, variantPromptText);
      setPromptVariants((prev) => {
        const existing = prev[selectedPromptType] || [];
        const filtered = existing.filter((variant) => variant.variant !== updated.variant);
        return {
          ...prev,
          [selectedPromptType]: [...filtered, updated],
        };
      });
      setSelectedPromptVariant(updated.variant);
      setVariantFeedback({ text: "Variante sauvegardée", severity: "success" });
    } catch (err) {
      setVariantFeedback({
        text: err.message || "Impossible d’enregistrer la variante.",
        severity: "error",
      });
    } finally {
      setVariantSaving(false);
    }
  };

  const handleSetActiveVariant = async () => {
    const payload =
      selectedPromptType === "analysis"
        ? { analysisVariant: variantNameInput }
        : { tradeVariant: variantNameInput };
    try {
      const result = await saveSettings(payload);
      if (result.analysisVariant && selectedPromptType === "analysis") {
        setAnalysisVariantActive(result.analysisVariant);
      }
      if (result.tradeVariant && selectedPromptType === "trade") {
        setTradeVariantActive(result.tradeVariant);
      }
      setVariantFeedback({ text: "Variante active mise à jour", severity: "success" });
    } catch (err) {
      setVariantFeedback({
        text: err.message || "Impossible de mettre la variante active.",
        severity: "error",
      });
    }
  };

  const handleVariantDelete = async () => {
    if (!variantNameInput) {
      setVariantFeedback({ text: "Le nom de la variante est requis.", severity: "error" });
      return;
    }
    if (variantNameInput === "default") {
      setVariantFeedback({
        text: "La variante default est système et ne peut pas être supprimée.",
        severity: "error",
      });
      return;
    }
    setVariantDeleting(true);
    setVariantFeedback({ text: "", severity: "success" });
    const currentList = promptVariants[selectedPromptType] || [];
    const filteredVariants = currentList.filter((variant) => variant.variant !== variantNameInput);
    const activeVariant =
      selectedPromptType === "analysis" ? analysisVariantActive : tradeVariantActive;
    const cleanedActive = activeVariant !== variantNameInput ? activeVariant : null;
    const nextVariant = filteredVariants[0]?.variant || cleanedActive || "default";

    try {
      await deletePromptVariant(selectedPromptType, variantNameInput);
      setPromptVariants((prev) => ({
        ...prev,
        [selectedPromptType]: filteredVariants,
      }));
      if (selectedPromptType === "analysis" && analysisVariantActive === variantNameInput) {
        setAnalysisVariantActive("default");
      }
      if (selectedPromptType === "trade" && tradeVariantActive === variantNameInput) {
        setTradeVariantActive("default");
      }
      setSelectedPromptVariant(nextVariant);
      setVariantNameInput(nextVariant);
      setVariantFeedback({ text: "Variante supprimée", severity: "success" });
    } catch (err) {
      setVariantFeedback({
        text: err.message || "Impossible de supprimer la variante.",
        severity: "error",
      });
    } finally {
      setVariantDeleting(false);
    }
  };

  // --- STYLES & RENDER PROPS ---

  const miniCardSx = {
    flex: 1,
    p: 3,
    borderRadius: 3,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.02)",
  };

  const activeVariant = STRUCTURED_VARIANTS.find((variant) => variant.value === structuredVariant);
  const isDefaultVariantName = variantNameInput === "default";

  return (
    <Stack spacing={4} pb={6}>
      <PageHero
        eyebrow="RÉGLAGES"
        title="Atelier & Préférences"
        description="Ajuste ton plan de trading, personnalise les prompts de Gemini et configure tes préférences d'affichage."
        illustration={<SettingsSuggestIcon sx={{ fontSize: 180 }} />}
        actions={
          <Button variant="outlined" color="secondary">
            Exporter la configuration
          </Button>
        }
        meta={[
          { label: "Plan Sauvegardé", value: formatSavedAt(planSavedAt) || "Jamais" },
          { label: "Variantes Actives", value: `${analysisVariantActive} / ${tradeVariantActive}` },
          { label: "Mode Structuré", value: structuredVariant },
        ]}
      />

      <Box id="settings-tabs" sx={{ width: "100%" }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="Sections paramètres"
          variant="fullWidth"
          textColor="primary"
          indicatorColor="primary"
          sx={{
            borderRadius: 3,
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.02)",
          }}
        >
          <Tab label="Plan de Trading" value="plan" />
          <Tab label="Préférences" value="prefs" />
          <Tab label="Prompt Structuré (JSON)" value="prompt" />
          <Tab label="Variantes Prompt (Texte)" value="variants" />
        </Tabs>
      </Box>

      <Stack spacing={3}>
        {/* Onglet Plan de Trading */}
        {activeTab === "plan" && (
          <ForgeCard
            subtitle="WORKFLOW"
            title="Plan de Trading"
            helper="C'est le plan qui est utilisé comme référence par l'IA lors de chaque analyse."
          >
            <Stack direction={{ xs: "column", lg: "row" }} spacing={3}>
              <Paper
                elevation={0}
                sx={{
                  flex: 1.2, // Le formulaire prend plus de place
                  borderRadius: 3,
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.03)",
                  p: { xs: 2, md: 3 },
                }}
              >
                <Stack spacing={3}>
                  <Stack spacing={1}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Horaires favorisés
                    </Typography>
                    <ToggleButtonGroup
                      value={tradingPlan.windows}
                      onChange={handleWindowToggle}
                      aria-label="Horaires de trading"
                      size="small"
                      sx={{ flexWrap: "wrap" }}
                    >
                      {TRADING_WINDOWS.map((window) => (
                        <ToggleButton key={window} value={window}>
                          {window}
                        </ToggleButton>
                      ))}
                    </ToggleButtonGroup>
                  </Stack>
                  <Stack spacing={1}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Style de trading
                    </Typography>
                    <ToggleButtonGroup
                      value={tradingPlan.style}
                      exclusive
                      onChange={handleStyleChange}
                      aria-label="Style de trading"
                      size="small"
                      sx={{ flexWrap: "wrap" }}
                    >
                      {TRADING_STYLES.map((style) => (
                        <ToggleButton key={style.value} value={style.value}>
                          {style.label}
                        </ToggleButton>
                      ))}
                    </ToggleButtonGroup>
                  </Stack>
                  <Stack spacing={1}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Instruments et gestion
                    </Typography>
                    <TextField
                      label="Paires prioritaires"
                      value={tradingPlan.pairs}
                      onChange={handlePlanFieldChange("pairs")}
                      placeholder="EURUSD, NAS100"
                      size="small"
                    />
                    <ToggleButtonGroup
                      value={tradingPlan.tradeDuringNews ? "yes" : "no"}
                      exclusive
                      onChange={handleNewsToggle}
                      aria-label="Trading pendant annonces"
                      size="small"
                      sx={{ mt: 1 }}
                    >
                      <ToggleButton value="yes">Oui</ToggleButton>
                      <ToggleButton value="no">Non</ToggleButton>
                    </ToggleButtonGroup>
                  </Stack>
                  <TextField
                    label="Entrées & Signaux"
                    value={tradingPlan.entryStrategy}
                    onChange={handlePlanFieldChange("entryStrategy")}
                    multiline
                    minRows={3}
                    fullWidth
                    size="small"
                  />
                  <TextField
                    label="Gestion du risque"
                    value={tradingPlan.risk}
                    onChange={handlePlanFieldChange("risk")}
                    multiline
                    minRows={2}
                    fullWidth
                    size="small"
                  />
                  <TextField
                    label="Gestion des sorties"
                    value={tradingPlan.management}
                    onChange={handlePlanFieldChange("management")}
                    multiline
                    minRows={2}
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
                  <Button variant="contained" onClick={handlePlanSave} disabled={planSaving}>
                    {planSaving ? "Enregistrement…" : "Sauvegarder le plan"}
                  </Button>
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
              </Paper>
              <Paper
                elevation={0}
                sx={{
                  flex: 0.8,
                  borderRadius: 3,
                  border: "1px dashed rgba(255,255,255,0.2)",
                  background: "rgba(255,255,255,0.02)",
                  p: { xs: 2, md: 3 },
                  // Se fixe au scroll à l'intérieur de la colonne
                  position: { lg: "sticky" },
                  top: 100, 
                  alignSelf: "flex-start"
                }}
              >
                <Stack spacing={1}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Prévisualisation du plan
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Ce texte est envoyé à Gemini pour calibrer la capture.
                  </Typography>
                  <Box
                    component="pre"
                    sx={{
                      whiteSpace: "pre-wrap",
                      wordWrap: "break-word",
                      fontFamily: `'JetBrains Mono','Fira Code',monospace`,
                      bgcolor: "rgba(255,255,255,0.04)",
                      borderRadius: 2,
                      p: 2,
                      mb: 1,
                      maxHeight: "60vh",
                      overflowY: "auto"
                    }}
                  >
                    {planDescription}
                  </Box>
                </Stack>
              </Paper>
            </Stack>
          </ForgeCard>
        )}
        
        {/* Onglet Préférences */}
        {activeTab === "prefs" && (
          <ForgeCard
            subtitle="PRÉFÉRENCES"
            title="IA locale et notifications"
            helper="Ces paramètres assurent une cohérence totale entre tes fiches et ton workflow."
          >
            <Stack spacing={3}>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ flexWrap: "wrap" }}>
                <Box sx={miniCardSx}>
                  <Typography variant="subtitle2" color="text.secondary">
                    IA & format
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={1}>
                    Ces paramètres restent immuables pour garder la cohérence des fiches.
                  </Typography>
                  <TextField label="Langue principale" value="Français" InputProps={{ readOnly: true }} fullWidth />
                  <TextField
                    label="Style de synthèse"
                    value="Plan d’action orienté résultats"
                    InputProps={{ readOnly: true }}
                    fullWidth
                    sx={{ mt: 1 }}
                  />
                </Box>
                <Box sx={miniCardSx}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Notifications
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={1}>
                    Active les alertes que tu veux recevoir.
                  </Typography>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Switch defaultChecked />
                    <Typography>Alertes de discipline</Typography>
                  </Stack>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Switch defaultChecked />
                    <Typography>Résumé hebdomadaire</Typography>
                  </Stack>
                </Box>
              </Stack>
              <Box sx={miniCardSx}>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Mode d’affichage
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Choisis entre l’ambiance “Forge nuit” et la version claire pour tes revues de jour.
                    </Typography>
                  </Box>
                  <Chip
                    label={themeMode === "dark" ? "Mode sombre" : "Mode clair"}
                    size="small"
                    sx={{ bgcolor: "rgba(116,246,214,0.15)", color: "primary.main" }}
                  />
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center" justifyContent="flex-end" mt={2}>
                  <Typography variant="caption" color="text.secondary">
                    Clair
                  </Typography>
                  <Switch checked={themeMode === "dark"} onChange={toggleMode} />
                  <Typography variant="caption" color="text.secondary">
                    Sombre
                  </Typography>
                </Stack>
              </Box>
            </Stack>
          </ForgeCard>
        )}

        {/* Onglet Prompt Structuré (JSON) */}
        {activeTab === "prompt" && (
          <ForgeCard
            subtitle="PROMPT STRUCTURÉ (JSON)"
            title={`Mode ${structuredVariant === "detailed" ? "détaillé" : "synthétique"}`}
            helper="Modifie la structure JSON envoyée à Gemini. Utilise les placeholders listés."
          >
            <Stack spacing={3}>
              <Box sx={miniCardSx}>
                <Typography variant="subtitle2" color="text.secondary">
                  Variante d’analyse active (JSON)
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={1}>
                  Détermine si Gemini produit une analyse détaillée ou synthétique pour les métadonnées.
                </Typography>
                <ToggleButtonGroup
                  value={structuredVariant}
                  exclusive
                  onChange={handleVariantChange}
                  aria-label="Analyse structurée"
                  size="small"
                >
                  {STRUCTURED_VARIANTS.map((variant) => (
                    <ToggleButton key={variant.value} value={variant.value}>
                      {variant.label}
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
                <Typography variant="caption" color="text.secondary" mt={1} display="block">
                  {activeVariant?.description}
                </Typography>
                {templates[structuredVariant]?.updatedAt && (
                  <Typography variant="caption" color="text.secondary">
                    Dernière version : {formatSavedAt(templates[structuredVariant]?.updatedAt)}
                  </Typography>
                )}
              </Box>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {[
                  "{{entryType}}",
                  "{{plan}}",
                  "{{rawText}}",
                  "{{variantTitle}}",
                  "{{instruction}}",
                ].map((token) => (
                  <Button key={token} size="small" variant="outlined" color="inherit">
                    {token}
                  </Button>
                ))}
              </Stack>
              <TextField
                label="Prompt structuré (JSON)"
                value={templateText}
                onChange={handleTemplateChange}
                multiline
                minRows={10}
                fullWidth
                InputProps={{ sx: { fontFamily: `"JetBrains Mono","Fira Code",monospace`, fontSize: "0.9rem" } }}
              />
              <Stack direction="row" spacing={2} alignItems="center" mt={2}>
                <Button variant="contained" onClick={handleTemplateSave} disabled={templateSaving || !templateText}>
                  {templateSaving ? "Sauvegarde…" : "Sauvegarder le prompt JSON"}
                </Button>
                {templateFeedback.text && (
                  <Typography
                    variant="body2"
                    color={templateFeedback.severity === "error" ? "error.main" : "success.main"}
                  >
                    {templateFeedback.text}
                  </Typography>
                )}
              </Stack>
            </Stack>
          </ForgeCard>
        )}

        {/* Onglet Variantes Prompt (Texte) */}
        {activeTab === "variants" && (
          <ForgeCard
            subtitle="VARIANTES PROMPT (TEXTE)"
            title="Prompts Gemini (Texte Brut)"
            helper="Crée, sélectionne ou active une variante différente pour chaque type de prompt (Analyse vs Trade)."
          >
            <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="center">
              <ToggleButtonGroup
                value={selectedPromptType}
                exclusive
                onChange={handleVariantTypeChange}
                aria-label="Type de prompt"
                size="small"
              >
                <ToggleButton value="analysis">Analyse</ToggleButton>
                <ToggleButton value="trade">Trade</ToggleButton>
              </ToggleButtonGroup>
              <TextField
                select
                label="Variantes existantes"
                value={selectedPromptVariant}
                onChange={handleVariantSelectionChange}
                size="small"
                sx={{ minWidth: 200 }}
              >
                {(promptVariants[selectedPromptType] || []).map((variant) => (
                  <MenuItem key={variant.variant} value={variant.variant}>
                    {variant.variant}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Nom de la variante"
                value={variantNameInput}
                onChange={handleVariantNameChange}
                size="small"
                sx={{ minWidth: 200 }}
                helperText={
                  isDefaultVariantName
                    ? "La variante default est système."
                    : "Nom unique identifiant la variante."
                }
              />
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="caption" color="text.secondary">
                Variante active pour ce type :
              </Typography>
              <Chip
                size="small"
                label={selectedPromptType === "analysis" ? analysisVariantActive : tradeVariantActive}
                variant="outlined"
                color="primary"
              />
            </Stack>
            <TextField
              label="Prompt complet (Texte)"
              value={variantPromptText}
              onChange={handleVariantTextChange}
              multiline
              minRows={10}
              fullWidth
              sx={{ mt: 2 }}
              InputProps={{ sx: { fontFamily: `"JetBrains Mono","Fira Code",monospace`, fontSize: "0.9rem" } }}
            />
            <Stack direction="row" spacing={2} alignItems="center" mt={2} flexWrap="wrap">
              <Button variant="contained" onClick={handleVariantSave} disabled={variantSaving}>
                {variantSaving ? "Sauvegarde…" : "Sauvegarder la variante"}
              </Button>
              <Button
                variant="outlined"
                onClick={handleSetActiveVariant}
                disabled={!variantNameInput}
              >
                Définir comme variante active
              </Button>
              <Button
                variant="outlined"
                color="error"
                onClick={handleVariantDelete}
                disabled={variantDeleting || !variantNameInput || isDefaultVariantName}
              >
                {variantDeleting ? "Suppression…" : "Supprimer la variante"}
              </Button>
              {variantFeedback.text && (
                <Typography
                  variant="body2"
                  color={variantFeedback.severity === "error" ? "error.main" : "success.main"}
                >
                  {variantFeedback.text}
                </Typography>
              )}
            </Stack>
          </ForgeCard>
        )}
      </Stack>
    </Stack>
  );
};

export default Settings;