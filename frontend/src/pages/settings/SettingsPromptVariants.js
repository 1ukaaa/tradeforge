import {
  Box,
  Button,
  Chip,
  MenuItem,
  Paper,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  alpha,
  useTheme
} from "@mui/material";
import { useEffect, useState } from "react";
import {
  deletePromptVariant,
  fetchPromptVariants,
  fetchSettings,
  savePromptVariant,
  saveSettings,
} from "../../services/settingsClient";

const PROMPT_TYPES = [
  { value: "analysis", label: "Analyse", hasActive: true },
  { value: "trade", label: "Trade", hasActive: true },
  { value: "twitter", label: "Twitter", hasActive: false },
];

const TYPE_SETTINGS_KEYS = {
  analysis: "analysisVariant",
  trade: "tradeVariant",
};

const DEFAULT_PROMPT_TEMPLATES = {
  analysis: {
    default: `Tu es un assistant de journal de trading, expert des marchés dérivés.
Analyse le contenu fourni et restitue un rapport ultra synthétique en français en respectant STRICTEMENT ce format markdown :

TYPE : Analyse

### 1. 🔭 Contexte multi-timeframes (Monthly / Weekly / Daily)
Weekly — ...
Daily — ...
Monthly — ...

### 2. 🧭 Zones clés & stratégie (Daily)
Zone clé — ...
Stratégie — ...
Validation — ...

### 3. ⏱️ Structure intraday (H4 / H1 / M15)
Cadre intraday — ...
Déclencheur — ...
Gestion — ...

### 4. 🎯 Scénarios proposés
Scénario 1 — ...
Invalidation 1 — ...
Scénario 2 — ...
Invalidation 2 — ...

### 5. ⚠️ Risques & invalidations
Risque principal — ...
Plan B — ...

### 6. ✅ Next steps / synthèse finale
Priorité — ...
Monitoring — ...

Règles :
1) Style professionnel, phrases très courtes, aucune redite, tu ne prends pas de position définitive.
2) Chaque ligne interne commence par un intitulé (Weekly, Stratégie, Scénario 1, etc.) suivi d'un espace, d'un tiret long « — » puis d'une phrase descriptive.
3) N'utilise jamais de listes à puces (*, -, •) ni de gras/italique.
4) Ajoute une ligne vide entre chaque section pour la lisibilité.
5) Termine par un rappel chiffré si des niveaux sont mentionnés.

CONTENU SOURCE :
{{rawText}}`,
  },
  trade: {
    default: `Tu es un assistant de journal de trading, expert des marchés dérivés.
Analyse le contenu fourni comme un trade exécuté (ou validé) et restitue un rapport ultra synthétique en français en respectant STRICTEMENT ce format markdown :

TYPE : Trade

### 1. 🔭 Contexte multi-timeframes (Monthly / Weekly / Daily)
Weekly — ...
Daily — ...
Monthly — ...

### 2. 🧭 Zones clés & stratégie (Daily et intraday)
Plan — ...
Zone clé — ...
Gestion du risque — ...

### 3. ⏱️ Structure intraday (H4 / H1 / M15) et ordre exécuté
Structure — ...
Entrée — ...
Gestion — ...

### 4. 🎯 Objectifs & déroulé
Objectif — ...
Déroulé — ...
Niveaux — ...

### 5. 📍 Résultat final
Résultat — ...
Jugement — ...

### 6. ⚓ Relecture du trade
Points positifs — ...
Points à améliorer — ...
Ajustement — ...

### 7. ⚠️ Risques & invalidations
Risque — ...
Invalidation — ...

### 8. ✅ Enseignements / verdict synthétique chiffré
Synthèse — ...
Leçon chiffrée — ...

Règles :
1) Style direct, phrases très courtes, pas de redite.
2) Mentionne explicitement si le trade a TP ou SL puis analyse si c'était une erreur ou un bon trade malgré tout.
3) Chaque ligne interne commence par un intitulé suivi d'un tiret long « — » puis d'une phrase descriptive. N'utilise jamais de listes à puces (*, -, •) ni de gras/italique.
4) Ajoute une ligne vide entre chaque section pour la lisibilité.

Plan de trading fourni :
{{plan || "Plan manquant — indique pourquoi l’absence de plan a impacté la lecture du trade."}}

Mission :
1) Commente si l'exécution rapportée suit ou dévie du plan ; détaille les écarts (TA, gestion du risque, niveaux, timing).
2) Indique la qualité de la décision finale (bonne décision, ajustement nécessaire, erreur) en lien avec ce plan.

CONTENU SOURCE :
{{rawText}}`,
  },
  twitter: {
    default: `Tu es un ghostwriter spécialisé en finance et en trading. Tu écris un TWEET UNIQUE (<= 280 caractères) en français qui résume une idée clé de trading de façon punchy.

Contraintes :
1) Une seule phrase principale, ton direct et professionnel.
2) Autorise jusqu'à 1 emoji pertinent, pas plus.
3) Pas d'hashtags génériques (#trading), pas de mention autopromo.
4) Termine par un CTA léger ou une observation chiffrée.

Format attendu :
Tweet — <message>

CONTENU SOURCE :
{{rawText}}`,
    "tweet.simple": `Tu es un ghostwriter spécialisé en finance et en trading. Tu écris un TWEET UNIQUE (<= 280 caractères) en français qui simplifie l'analyse fournie.

Contraintes :
- Une seule idée forte, ton direct, pas de jargon inutile.
- Maximum 1 emoji pertinent.
- Pas d'hashtags génériques, sauf si cité dans la source.
- Ajoute un chiffre ou niveau clé si pertinent.

Format attendu :
Tweet — <message>

CONTENU SOURCE :
{{rawText}}`,
    "thread.analysis": `Tu es un ghostwriter spécialisé en threads Twitter pour traders (X). Tu écris un thread de 4 à 6 tweets pour présenter une analyse ou un trade.

Contraintes :
- Chaque tweet <= 260 caractères.
- Utilise ce format exact :
Tweet 1 — ...
Tweet 2 — ...
...
- Tweet 1 : Hook fort + contexte.
- Dernier tweet : call-to-action léger ou leçon clé.
- Autorise 1 emoji par tweet maximum, pas de hashtag générique.

Inspiration :
CONTENU SOURCE :
{{rawText}}`,
    "thread.annonce": `Tu es un ghostwriter spécialisé dans les annonces produit / release pour Twitter (X). Tu écris un thread de 3 à 5 tweets pour annoncer une nouveauté, un outil ou une série d'insights.

Contraintes :
- Chaque tweet <= 260 caractères.
- Format :
Tweet 1 — Hook annonce (emoji possible)
Tweet 2 — Détail / bénéfice #1
Tweet 3 — Détail / bénéfice #2
Tweet 4 — Exemple ou preuve (optionnel)
Tweet 5 — Call-to-action clair
- Pas plus de 2 hashtags dans tout le thread, uniquement s'ils sont déjà fournis dans la source.

Inspiration :
{{rawText}}`,
  },
};

DEFAULT_PROMPT_TEMPLATES.twitter.default = DEFAULT_PROMPT_TEMPLATES.twitter["tweet.simple"];

const getDefaultVariantName = (type) => {
  if (type === "twitter") return "tweet.simple";
  return "default";
};

const getDefaultPromptText = (type, variant) => {
  const typeMap = DEFAULT_PROMPT_TEMPLATES[type] || {};
  return typeMap[variant] || typeMap.default || "";
};

const SettingsPromptVariants = () => {
  const theme = useTheme();
  const [activeVariants, setActiveVariants] = useState({
    analysis: "default",
    trade: "default",
  });
  const [promptVariants, setPromptVariants] = useState({ analysis: [], trade: [], twitter: [] });
  const [selectedPromptType, setSelectedPromptType] = useState("analysis");
  const [selectedPromptVariant, setSelectedPromptVariant] = useState(
    getDefaultVariantName("analysis")
  );
  const [variantNameInput, setVariantNameInput] = useState(getDefaultVariantName("analysis"));
  const [variantPromptText, setVariantPromptText] = useState(
    getDefaultPromptText("analysis", getDefaultVariantName("analysis"))
  );
  const [variantSaving, setVariantSaving] = useState(false);
  const [variantFeedback, setVariantFeedback] = useState({ text: "", severity: "success" });
  const [variantDeleting, setVariantDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const loadData = async () => {
      try {
        const [settings, variants] = await Promise.all([fetchSettings(), fetchPromptVariants()]);
        if (cancelled) return;

        setActiveVariants({
          analysis: settings.analysisVariant || "default",
          trade: settings.tradeVariant || "default",
        });
        setPromptVariants({
          analysis: variants.analysis || [],
          trade: variants.trade || [],
          twitter: variants.twitter || [],
        });

        const initialType = "analysis";
        const analysisList = variants.analysis || [];
        const resolvedVariant =
          analysisList.find(
            (item) => item.variant === (settings.analysisVariant || "default")
          )?.variant ||
          analysisList[0]?.variant ||
          getDefaultVariantName("analysis");

        setSelectedPromptType(initialType);
        setSelectedPromptVariant(resolvedVariant);
        setVariantNameInput(resolvedVariant);
        const matched =
          analysisList.find((item) => item.variant === resolvedVariant)?.prompt ||
          getDefaultPromptText(initialType, resolvedVariant);
        setVariantPromptText(matched);
      } catch (err) {
        if (cancelled) return;
        console.warn("Impossible de charger les variantes IA :", err);
      }
    };
    loadData();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const list = promptVariants[selectedPromptType] || [];
    const matched = list.find((variant) => variant.variant === selectedPromptVariant);
    const fallback = getDefaultPromptText(selectedPromptType, selectedPromptVariant);
    setVariantPromptText(matched?.prompt || fallback);
    setVariantNameInput(selectedPromptVariant);
  }, [selectedPromptType, selectedPromptVariant, promptVariants]);

  const handleVariantTypeChange = (_, value) => {
    if (!value) return;
    setSelectedPromptType(value);
    const list = promptVariants[value] || [];
    const fallbackVariant = activeVariants[value];
    const defaultSelection =
      list.find((variant) => variant.variant === fallbackVariant)?.variant ||
      list[0]?.variant ||
      getDefaultVariantName(value);
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
    const settingsKey = TYPE_SETTINGS_KEYS[selectedPromptType];
    if (!settingsKey) {
      setVariantFeedback({
        text: "Ce type de prompt n'utilise pas de variante active.",
        severity: "info",
      });
      return;
    }
    const payload = { [settingsKey]: variantNameInput };
    try {
      const result = await saveSettings(payload);
      if (result[settingsKey]) {
        setActiveVariants((prev) => ({
          ...prev,
          [selectedPromptType]: result[settingsKey],
        }));
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
    const activeVariant = TYPE_SETTINGS_KEYS[selectedPromptType]
      ? activeVariants[selectedPromptType]
      : null;
    const cleanedActive = activeVariant && activeVariant !== variantNameInput ? activeVariant : null;
    const nextVariant =
      filteredVariants[0]?.variant || cleanedActive || getDefaultVariantName(selectedPromptType);

    try {
      await deletePromptVariant(selectedPromptType, variantNameInput);
      setPromptVariants((prev) => ({
        ...prev,
        [selectedPromptType]: filteredVariants,
      }));
      if (TYPE_SETTINGS_KEYS[selectedPromptType] && activeVariants[selectedPromptType] === variantNameInput) {
        setActiveVariants((prev) => ({
          ...prev,
          [selectedPromptType]: "default",
        }));
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

  const isDefaultVariantName = variantNameInput === "default";
  const canSetActive = Boolean(TYPE_SETTINGS_KEYS[selectedPromptType]);
  const availableVariants = promptVariants[selectedPromptType] || [];

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 3,
        border: `1px solid ${theme.palette.divider}`,
        bgcolor: alpha(theme.palette.background.paper, 0.4),
        backdropFilter: "blur(10px)",
      }}
    >
      <Box mb={3}>
        <Typography variant="overline" fontWeight={700} color="primary" sx={{ letterSpacing: 1.2 }}>
          INTELLIGENCE ARTIFICIELLE
        </Typography>
        <Typography variant="h6" fontWeight={700}>
          Prompts Système (Texte Brut)
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, maxWidth: 800 }}>
          Personnalisez les instructions envoyées à l'IA pour chaque type de tâche. Créez des variantes pour tester différentes approches.
        </Typography>
      </Box>

      <Stack spacing={3}>
        {/* CONTROLS */}
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.background.default, 0.4) }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="center">
            <ToggleButtonGroup
              value={selectedPromptType}
              exclusive
              onChange={handleVariantTypeChange}
              aria-label="Type de prompt"
              size="small"
              sx={{ '& .MuiToggleButton-root': { borderRadius: 1, px: 2 } }}
            >
              {PROMPT_TYPES.map((type) => (
                <ToggleButton key={type.value} value={type.value}>
                  {type.label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>

            <TextField
              select
              label="Variante"
              value={selectedPromptVariant}
              onChange={handleVariantSelectionChange}
              size="small"
              sx={{ minWidth: 200 }}
              variant="outlined"
            >
              {availableVariants.map((variant) => (
                <MenuItem key={variant.variant} value={variant.variant}>
                  {variant.variant}
                </MenuItem>
              ))}
              {availableVariants.length === 0 && (
                <MenuItem value={selectedPromptVariant} disabled>
                  Aucune variante
                </MenuItem>
              )}
            </TextField>

            <TextField
              label="Nom (pour nouvelle variante)"
              value={variantNameInput}
              onChange={handleVariantNameChange}
              size="small"
              sx={{ minWidth: 200 }}
              variant="outlined"
            />
          </Stack>

          {canSetActive && (
            <Stack direction="row" spacing={1} alignItems="center" mt={2}>
              <Typography variant="caption" fontWeight={600} color="text.secondary">
                ACTUELLEMENT UTILISÉ :
              </Typography>
              <Chip
                size="small"
                label={activeVariants[selectedPromptType]}
                color="primary"
                sx={{ fontWeight: 700, height: 24 }}
              />
            </Stack>
          )}
        </Paper>

        {/* EDITOR */}
        <TextField
          label="Prompt Système"
          value={variantPromptText}
          onChange={handleVariantTextChange}
          multiline
          minRows={15}
          fullWidth
          variant="outlined"
          sx={{
            '& .MuiOutlinedInput-root': {
              fontFamily: `"JetBrains Mono","Fira Code",monospace`,
              fontSize: "0.9rem",
              lineHeight: 1.6,
              bgcolor: 'background.paper'
            }
          }}
        />

        {/* ACTIONS */}
        <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
          <Box>
            {variantFeedback.text && (
              <Typography
                variant="body2"
                fontWeight={600}
                color={variantFeedback.severity === "error" ? "error.main" : "success.main"}
              >
                {variantFeedback.text}
              </Typography>
            )}
          </Box>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              color="error"
              onClick={handleVariantDelete}
              disabled={variantDeleting || !variantNameInput || isDefaultVariantName}
            >
              Supprimer
            </Button>
            {canSetActive && (
              <Button
                variant="outlined"
                onClick={handleSetActiveVariant}
                disabled={!variantNameInput}
              >
                Définir comme actif
              </Button>
            )}
            <Button
              variant="contained"
              onClick={handleVariantSave}
              disabled={variantSaving}
              sx={{ px: 3, fontWeight: 700 }}
            >
              Sauvegarder
            </Button>
          </Stack>
        </Stack>
      </Stack>
    </Paper>
  );
};

export default SettingsPromptVariants;
