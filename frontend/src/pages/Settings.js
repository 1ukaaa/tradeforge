import {
  Button,
  Grid,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import SettingsSuggestIcon from "@mui/icons-material/SettingsSuggest";
import { useEffect, useState } from "react";
import { fetchSettings, fetchStructuredTemplates, saveSettings, saveStructuredTemplate } from "../services/settingsClient";

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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({ text: "", severity: "success" });
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
      } finally {
        if (!cancelled) setLoading(false);
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

  const handleVariantChange = (_, value) => {
    if (!value) return;
    setStructuredVariant(value);
    setFeedback({ text: "", severity: "success" });
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

  const handleSave = async () => {
    setSaving(true);
    setFeedback({ text: "", severity: "success" });
    try {
      const result = await saveSettings({
        structuredVariant,
        analysisVariant: analysisVariantActive,
        tradeVariant: tradeVariantActive,
      });
      if (result.structuredVariant) {
        setStructuredVariant(result.structuredVariant);
      }
      if (result.analysisVariant) {
        setAnalysisVariantActive(result.analysisVariant);
      }
      if (result.tradeVariant) {
        setTradeVariantActive(result.tradeVariant);
      }
      setFeedback({ text: "Paramètre enregistré", severity: "success" });
    } catch (err) {
      setFeedback({
        text: err.message || "Impossible d’enregistrer le paramètre.",
        severity: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const activeVariant = STRUCTURED_VARIANTS.find((variant) => variant.value === structuredVariant);
  const selectedPromptDetail =
    promptVariants[selectedPromptType]?.find((variant) => variant.variant === selectedPromptVariant);

  return (
    <Stack spacing={4}>
      <Stack direction="row" spacing={1} alignItems="center">
        <SettingsSuggestIcon color="primary" fontSize="large" />
        <Typography variant="h3" color="primary">
          Paramètres
        </Typography>
      </Stack>
      <Typography variant="body1" color="text.secondary" maxWidth={580}>
        Configure les préférences IA, la structure des fiches et la synchronisation avec ton journal.
        Les intégrations et exports seront bientôt disponibles.
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 4 }} elevation={0}>
            <Typography variant="h6" mb={2}>
              IA & format
            </Typography>
            <Stack spacing={2}>
              <TextField label="Langue principale" value="Français" InputProps={{ readOnly: true }} />
              <TextField
                label="Style de synthèse"
                value="Plan d’action orienté résultats"
                InputProps={{ readOnly: true }}
              />
            </Stack>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 4 }} elevation={0}>
            <Typography variant="h6" mb={2}>
              Notifications
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <Switch defaultChecked />
              <Typography>Alertes de discipline</Typography>
            </Stack>
            <Stack direction="row" spacing={2} alignItems="center">
              <Switch defaultChecked />
              <Typography>Résumé hebdomadaire</Typography>
            </Stack>
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <Paper sx={{ p: 4 }} elevation={0}>
            <Typography variant="h6" mb={2}>
              Analyse structurée
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Choisis le niveau de détail que Gemini doit produire lorsque tu demandes une analyse structurée.
              Le choix est stocké en base afin que toutes les captures futures utilisent ce réglage.
            </Typography>
            <ToggleButtonGroup
              value={structuredVariant}
              exclusive
              onChange={handleVariantChange}
              aria-label="Analyse structurée"
              size="small"
              sx={{ mb: 2 }}
            >
              {STRUCTURED_VARIANTS.map((variant) => (
                <ToggleButton key={variant.value} value={variant.value}>
                  {variant.label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
            <Typography variant="body2" color="text.secondary">
              {activeVariant?.description}
            </Typography>
            {templates[structuredVariant]?.updatedAt && (
              <Typography variant="caption" color="text.secondary">
                Dernière version : {formatTimestamp(templates[structuredVariant]?.updatedAt)}
              </Typography>
            )}
            <Typography variant="body2" color="text.secondary" mt={2}>
              Personnalise le prompt envoyé à Gemini pour cette variante. Tu peux utiliser les placeholders suivants :
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1 }}>
              {['{{entryType}}', '{{plan}}', '{{rawText}}', '{{variantTitle}}', '{{instruction}}'].map(
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
              size="small"
              sx={{ mt: 1 }}
            />
            <Stack direction="row" spacing={2} alignItems="center" mt={2}>
              <Button variant="contained" onClick={handleSave} disabled={saving || loading}>
                {saving ? "Enregistrement…" : "Enregistrer l’analyse structurée"}
              </Button>
              {feedback.text && (
                <Typography
                  variant="body2"
                  color={feedback.severity === "error" ? "error.main" : "success.main"}
                >
                  {feedback.text}
                </Typography>
              )}
            </Stack>
            <Stack direction="row" spacing={2} alignItems="center" mt={2}>
              <Button
                variant="contained"
                color="secondary"
                onClick={handleTemplateSave}
                disabled={templateSaving || !templateText}
              >
                {templateSaving ? "Sauvegarde…" : "Sauvegarder le template"}
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
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <Paper sx={{ p: 4 }} elevation={0}>
            <Typography variant="h6" mb={2}>
              Variantes des prompts Gemini
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Gère plusieurs versions des prompts `analysis.v1` et `trade.v1`. Tu peux éditer
              chaque variante, en créer de nouvelles et indiquer laquelle doit être utilisée.
            </Typography>
            <ToggleButtonGroup
              value={selectedPromptType}
              exclusive
              onChange={handleVariantTypeChange}
              aria-label="Type de prompt"
              size="small"
              sx={{ mb: 2 }}
            >
              <ToggleButton value="analysis">Analyse</ToggleButton>
              <ToggleButton value="trade">Trade</ToggleButton>
            </ToggleButtonGroup>
            <Typography variant="body2" color="text.secondary">
              Variante active :{" "}
              {selectedPromptType === "analysis" ? analysisVariantActive : tradeVariantActive}
            </Typography>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2} mt={2}>
              <TextField
                select
                label="Variantes existantes"
                value={selectedPromptVariant}
                onChange={handleVariantSelectionChange}
                size="small"
                fullWidth
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
                fullWidth
                helperText="Nom unique identifiant cette variante."
              />
            </Stack>
            <Typography variant="caption" color="text.secondary">
              Dernière mise à jour :{" "}
              {selectedPromptDetail ? formatTimestamp(selectedPromptDetail.updatedAt) : "Aucune"}
            </Typography>
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
              {variantFeedback.text && (
                <Typography
                  variant="body2"
                  color={variantFeedback.severity === "error" ? "error.main" : "success.main"}
                >
                  {variantFeedback.text}
                </Typography>
              )}
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Stack>
  );
};

export default Settings;
