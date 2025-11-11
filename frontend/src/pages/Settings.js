import SettingsSuggestIcon from "@mui/icons-material/SettingsSuggest";
import {
  Box,
  Button,
  Chip,
  MenuItem,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import {
  deletePromptVariant,
  fetchPromptVariants,
  fetchSettings,
  fetchStructuredTemplates,
  savePromptVariant,
  saveSettings,
  saveStructuredTemplate,
} from "../services/settingsClient";
import { ForgeCard, PageHero } from "../components/ForgeUI";
import { useThemeMode } from "../context/ThemeModeContext";

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

const formatTimestamp = (value) => {
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" }).format(
      new Date(value)
    );
  } catch {
    return value;
  }
};

const Settings = () => {
  const [structuredVariant, setStructuredVariant] = useState("detailed");
  const [analysisVariantActive, setAnalysisVariantActive] = useState("default");
  const [tradeVariantActive, setTradeVariantActive] = useState("default");
  const [templates, setTemplates] = useState({});
  const [templateText, setTemplateText] = useState(DEFAULT_TEMPLATES.detailed);
  const [templateSaving, setTemplateSaving] = useState(false);
  const [templateFeedback, setTemplateFeedback] = useState({ text: "", severity: "success" });
  const [promptVariants, setPromptVariants] = useState({ analysis: [], trade: [] });
  const [selectedPromptType, setSelectedPromptType] = useState("analysis");
  const [selectedPromptVariant, setSelectedPromptVariant] = useState("default");
  const [variantNameInput, setVariantNameInput] = useState("default");
  const [variantPromptText, setVariantPromptText] = useState(DEFAULT_PROMPT_TEMPLATES.analysis);
  const [variantSaving, setVariantSaving] = useState(false);
  const [variantFeedback, setVariantFeedback] = useState({ text: "", severity: "success" });
  const [variantDeleting, setVariantDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState("prefs");
  const { mode: themeMode, toggleMode } = useThemeMode();

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [settings, variants] = await Promise.all([fetchSettings(), fetchPromptVariants()]);
        if (cancelled) return;
        if (settings.structuredVariant) {
          setStructuredVariant(settings.structuredVariant);
        }
        setAnalysisVariantActive(settings.analysisVariant || "default");
        setTradeVariantActive(settings.tradeVariant || "default");
        setPromptVariants(variants);
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
        console.warn("Impossible de charger les paramètres :", err);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
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
        console.warn("Impossible de charger les templates :", err);
      }
    };
    loadTemplates();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const list = promptVariants[selectedPromptType] || [];
    const matched = list.find((variant) => variant.variant === selectedPromptVariant);
    setVariantPromptText(matched?.prompt || DEFAULT_PROMPT_TEMPLATES[selectedPromptType]);
    setVariantNameInput(selectedPromptVariant);
  }, [selectedPromptType, selectedPromptVariant, promptVariants]);

  useEffect(() => {
    const selection = templates[structuredVariant];
    const fallback = DEFAULT_TEMPLATES[structuredVariant] || "";
    setTemplateText(selection?.prompt || fallback);
  }, [structuredVariant, templates]);

  useEffect(() => {
    if (typeof document !== "undefined") {
      const container = document.getElementById("settings-tabs");
      container?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [activeTab]);

  const handleTabChange = (_, newValue) => {
    setActiveTab(newValue);
  };

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
      setVariantFeedback({ text: "Variant sauvegardée", severity: "success" });
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
      setVariantFeedback({ text: "Variant active mise à jour", severity: "success" });
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
        title="Paramètres IA & Workflow"
        description="Adapte la parole de TradeForge, garde le contrôle sur tes templates et pilote les variantes Gemini qui alimentent tes fiches."
        illustration={<SettingsSuggestIcon sx={{ fontSize: 180 }} />}
        actions={
          <Button variant="outlined" color="secondary">
            Exporter la configuration
          </Button>
        }
        meta={[
          { label: "Dernière mise à jour", value: "il y a 12 min" },
          { label: "Variantes actives", value: "2" },
          { label: "Template courant", value: structuredVariant },
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
          <Tab label="Préférences IA" value="prefs" />
          <Tab label="Prompt structuré" value="prompt" />
          <Tab label="Variantes Gemini" value="variants" />
        </Tabs>
      </Box>
      <Stack spacing={3}>
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
        {activeTab === "prompt" && (
          <ForgeCard
            subtitle="PROMPT STRUCTURÉ"
            title={`Mode ${structuredVariant === "detailed" ? "détaillé" : "synthétique"}`}
            helper="Modifie la structure envoyée à Gemini en combinant les placeholders listés ci-dessous."
          >
            <Stack spacing={3}>
              <Box sx={miniCardSx}>
                <Typography variant="subtitle2" color="text.secondary">
                  Variante d’analyse active
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={1}>
                  Détermine si Gemini produit une analyse détaillée ou synthétique.
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
                    Dernière version : {formatTimestamp(templates[structuredVariant]?.updatedAt)}
                  </Typography>
                )}
              </Box>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {["{{entryType}}", "{{plan}}", "{{rawText}}", "{{variantTitle}}", "{{instruction}}"].map(
                  (token) => (
                    <Button key={token} size="small" variant="outlined" color="inherit">
                      {token}
                    </Button>
                  )
                )}
              </Stack>
              <TextField
                label="Prompt structuré"
                value={templateText}
                onChange={handleTemplateChange}
                multiline
                minRows={6}
                fullWidth
              />
              <Stack direction="row" spacing={2} alignItems="center" mt={2}>
                <Button variant="contained" onClick={handleTemplateSave} disabled={templateSaving || !templateText}>
                  {templateSaving ? "Sauvegarde…" : "Sauvegarder le prompt structuré"}
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
        {activeTab === "variants" && (
          <ForgeCard
            subtitle="VARIANTES"
            title="Prompts Gemini"
            helper="Crée, sélectionne ou active une variante différente pour chaque type de prompt."
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
                    ? "La variante default est système et ne peut pas être supprimée."
                    : "Nom unique identifiant la variante."
                }
              />
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="caption" color="text.secondary">
                Variante active :
              </Typography>
              <Chip
                size="small"
                label={selectedPromptType === "analysis" ? analysisVariantActive : tradeVariantActive}
                variant="outlined"
                color="primary"
              />
            </Stack>
            <TextField
              label="Prompt complet"
              value={variantPromptText}
              onChange={handleVariantTextChange}
              multiline
              minRows={6}
              fullWidth
              sx={{ mt: 2 }}
            />
            <Stack direction="row" spacing={2} alignItems="center" mt={2}>
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
