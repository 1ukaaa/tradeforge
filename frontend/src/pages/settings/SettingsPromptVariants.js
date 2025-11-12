// frontend/src/pages/settings/SettingsPromptVariants.js
import {
    Button,
    Chip,
    MenuItem,
    Stack,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Typography
} from "@mui/material";
import { useEffect, useState } from "react";
import { ForgeCard } from "../../components/ForgeUI";
import {
    deletePromptVariant,
    fetchPromptVariants,
    fetchSettings,
    savePromptVariant,
    saveSettings
} from "../../services/settingsClient";

// Constantes (copiées de l'ancien Settings.js)
const DEFAULT_PROMPT_TEMPLATES = {
  analysis: `... (copiez le contenu de DEFAULT_PROMPT_TEMPLATES.analysis de l'ancien Settings.js) ...`,
  trade: `... (copiez le contenu de DEFAULT_PROMPT_TEMPLATES.trade de l'ancien Settings.js) ...`,
};

const SettingsPromptVariants = () => {
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

  useEffect(() => {
    let cancelled = false;
    const loadData = async () => {
      try {
        const [settings, variants] = await Promise.all([fetchSettings(), fetchPromptVariants()]);
        if (cancelled) return;
        
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
    setVariantPromptText(matched?.prompt || DEFAULT_PROMPT_TEMPLATES[selectedPromptType]);
    setVariantNameInput(selectedPromptVariant);
  }, [selectedPromptType, selectedPromptVariant, promptVariants]);

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
  
  const isDefaultVariantName = variantNameInput === "default";

  return (
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
  );
};

export default SettingsPromptVariants;