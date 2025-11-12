// frontend/src/pages/settings/SettingsStructuredPrompt.js
import {
    Box,
    Button,
    Stack,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Typography
} from "@mui/material";
import { useEffect, useState } from "react";
import { ForgeCard } from "../../components/ForgeUI";
import {
    fetchSettings,
    fetchStructuredTemplates,
    saveStructuredTemplate
} from "../../services/settingsClient";
import { formatSavedAt } from "../../utils/planUtils";

// Constantes (copiées de l'ancien Settings.js)
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

const DEFAULT_TEMPLATES = {
  detailed: `... (copiez le contenu de DEFAULT_TEMPLATES.detailed de l'ancien Settings.js) ...`,
  summary: `... (copiez le contenu de DEFAULT_TEMPLATES.summary de l'ancien Settings.js) ...`,
};

const SettingsStructuredPrompt = () => {
  const [structuredVariant, setStructuredVariant] = useState("detailed");
  const [templates, setTemplates] = useState({});
  const [templateText, setTemplateText] = useState(DEFAULT_TEMPLATES.detailed);
  const [templateSaving, setTemplateSaving] = useState(false);
  const [templateFeedback, setTemplateFeedback] = useState({ text: "", severity: "success" });

  useEffect(() => {
    let cancelled = false;
    const loadData = async () => {
      try {
        const [settings, fetchedTemplates] = await Promise.all([
          fetchSettings(),
          fetchStructuredTemplates()
        ]);
        if (cancelled) return;

        if (settings.structuredVariant) setStructuredVariant(settings.structuredVariant);
        
        const mapped = fetchedTemplates.reduce((acc, template) => {
          acc[template.variant] = template;
          return acc;
        }, {});
        setTemplates(mapped);
      } catch (err) {
        if (cancelled) return;
        console.warn("Impossible de charger les données IA :", err);
      }
    };
    loadData();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const selection = templates[structuredVariant];
    const fallback = DEFAULT_TEMPLATES[structuredVariant] || "";
    setTemplateText(selection?.prompt || fallback);
  }, [structuredVariant, templates]);

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

  const activeVariant = STRUCTURED_VARIANTS.find((v) => v.value === structuredVariant);

  return (
    <ForgeCard
      subtitle="PROMPT STRUCTURÉ (JSON)"
      title={`Mode ${structuredVariant === "detailed" ? "détaillé" : "synthétique"}`}
      helper="Modifie la structure JSON envoyée à Gemini. Utilise les placeholders listés."
    >
      <Stack spacing={3}>
        <Box sx={{
          p: 3,
          borderRadius: 3,
          border: (theme) => `1px solid ${theme.palette.divider}`,
          background: (theme) => theme.palette.mode === 'dark' ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)",
        }}>
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
  );
};

export default SettingsStructuredPrompt;