import DoNotDisturbAltRoundedIcon from "@mui/icons-material/DoNotDisturbAltRounded";
import FactCheckRoundedIcon from "@mui/icons-material/FactCheckRounded";
import GraphicEqRoundedIcon from "@mui/icons-material/GraphicEqRounded";
import MicNoneRoundedIcon from "@mui/icons-material/MicNoneRounded";
import RouteRoundedIcon from "@mui/icons-material/RouteRounded";
import TimelineIcon from "@mui/icons-material/Timeline";
import {
  Box,
  Chip,
  Divider,
  Paper,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography
} from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
import ActionBar from "../features/analyzer/components/ActionBar";
import AiResponseCard from "../features/analyzer/components/AiResponseCard";
import SpeechControls from "../features/analyzer/components/SpeechControls";
import TranscriptEditor from "../features/analyzer/components/TranscriptEditor";
import useSpeechCapture from "../features/analyzer/hooks/useSpeechCapture";
import { requestAnalysis, requestStructuredAnalysis } from "../services/aiClient";
import { saveJournalEntry } from "../services/journalClient";
import { fetchPlan } from "../services/planClient"; // On garde fetchPlan pour le planDescription
import { fetchSettings } from "../services/settingsClient";

// [ACTION] : La logique de parsing de fallback a été supprimée (précédente étape)

const inferContentType = (text) => {
  const match = text.match(/Type\s*:?\s*(Trade|Analyse)/i);
  return match ? match[1].toLowerCase() : "";
};

// [ACTION] Supprimer les constantes TRADING_WINDOWS, TRADING_STYLES, DEFAULT_PLAN
// ...

// [ACTION] Garder buildPlanDescription pour l'envoi à l'IA
const buildPlanDescription = (plan) => {
  const safePlan = plan || {};
  const windowsArray = Array.isArray(safePlan.windows) ? safePlan.windows : [];
  const windows = windowsArray.length ? windowsArray.join(" / ") : "Horaires à définir";
  const styleLabel = safePlan.style || "Style non défini";
  const pairs = safePlan.pairs || "Paires non définies";
  const news = safePlan.tradeDuringNews ? "Oui (sur setups définis)" : "Non, on évite les annonces";

  return [
    `1. Horaires : ${windows}`,
    `2. Style : ${styleLabel}`,
    `3. Instruments : ${pairs}`,
    `4. Trading pendant annonces : ${news}`,
    `5. Entrées : ${plan.entryStrategy || "Non définie"}`,
    `6. Gestion du risque : ${plan.risk || "Non défini"}`,
    `7. Sorties : ${plan.management || "Non définie"}`,
    `8. Notes supplémentaires : ${plan.notes || "Aucune"}`,
  ].join("\n");
};

// [ACTION] Supprimer formatSavedAt
// ...

const InputArea = () => {
  const [transcript, setTranscript] = useState("");
  const [aiResult, setAiResult] = useState("");
  const [detectedType, setDetectedType] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [contentMode, setContentMode] = useState("analyse");

  // [ACTION] Supprimer tous les états liés au plan
  // const [tradingPlan, setTradingPlan] = useState(DEFAULT_PLAN);
  // const [planSavedAt, setPlanSavedAt] = useState(null);
  // const [planSaving, setPlanSaving] = useState(false);
  // const [planFeedback, setPlanFeedback] = useState({ text: "", severity: "success" });
  // const [activeTab, setActiveTab] = useState("capture");

  // [ACTION] On garde le plan en mémoire pour l'envoyer à l'IA, mais on ne le gère plus
  const [planDescription, setPlanDescription] = useState("Chargement du plan...");
  const [planPreview, setPlanPreview] = useState("Chargement...");

  const [structuredVariant, setStructuredVariant] = useState("detailed");
  const [journalSaving, setJournalSaving] = useState(false);
  const [journalError, setJournalError] = useState("");
  const [journalSuccess, setJournalSuccess] = useState("");

  const wordCount = useMemo(
    () => transcript.trim().split(/\s+/).filter(Boolean).length,
    [transcript]
  );

  const appendTranscript = useCallback((chunk) => {
    setTranscript((prev) => `${prev}${chunk}`);
  }, []);

  const { isSupported, isRecording, startRecording, stopRecording } =
    useSpeechCapture({
      onTranscript: appendTranscript,
    });

  const captureStatus = useMemo(() => {
    if (!isSupported) {
      return {
        label: "Dictée indisponible",
        icon: <DoNotDisturbAltRoundedIcon fontSize="small" />,
        sx: {
          bgcolor: "rgba(214, 65, 65, 0.12)",
          color: "#B42318",
          border: "1px solid rgba(214, 65, 65, 0.2)",
        },
      };
    }
    if (isRecording) {
      return {
        label: "Dictée active",
        icon: <GraphicEqRoundedIcon fontSize="small" />,
        sx: {
          background:
            "linear-gradient(120deg, rgba(255,76,91,0.9) 0%, rgba(255,119,119,0.82) 100%)",
          color: "#fff",
          boxShadow: "0 14px 28px rgba(255,76,91,0.28)",
        },
        iconColor: "#fff",
      };
    }
    return {
      label: "Dictée prête",
      icon: <MicNoneRoundedIcon fontSize="small" />,
      sx: {
        bgcolor: "rgba(28,98,209,0.14)",
        color: "primary.main",
        border: "1px solid rgba(28,98,209,0.24)",
      },
    };
  }, [isSupported, isRecording]);

  const captureStages = [
    { icon: <TimelineIcon fontSize="small" />, label: "Contexte" },
    { icon: <RouteRoundedIcon fontSize="small" />, label: "Plan" },
    { icon: <FactCheckRoundedIcon fontSize="small" />, label: "Checklist" },
  ];

  // [ACTION] Simplifier la logique du plan
  useEffect(() => {
    let cancelled = false;
    const loadPlan = async () => {
      try {
        const { plan } = await fetchPlan();
        if (cancelled) return;
        const description = buildPlanDescription(plan);
        setPlanDescription(description);
        const firstLine =
          description.split("\n").find((line) => line.trim()) || "";
        setPlanPreview(
          firstLine.length > 120 ? `${firstLine.slice(0, 120)}…` : firstLine
        );
      } catch (err) {
        console.warn("Impossible de charger le plan :", err);
        setPlanDescription("Erreur: Impossible de charger le plan.");
        setPlanPreview("Erreur plan.");
      }
    };
    loadPlan();
    return () => {
      cancelled = true;
    };
  }, []);

  const contentTemplate = contentMode === "trade" ? "trade.v1" : "analysis.v1";

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      const payload = {
        rawText: transcript,
        template: contentTemplate,
        plan: planDescription,
      };
      const result = await requestAnalysis(payload);
      setAiResult(result);
      setDetectedType(contentMode || inferContentType(result));
    } catch (err) {
      setError(err.message || "Erreur inconnue lors de l'appel IA.");
      setAiResult("");
      setDetectedType("");
    } finally {
      setLoading(false);
    }
  };

  const resetAnalysis = () => {
    setAiResult("");
    setDetectedType("");
    setJournalError("");
    setJournalSuccess("");
  };

  useEffect(() => {
    setJournalError("");
    setJournalSuccess("");
  }, [aiResult]);

  useEffect(() => {
    let cancelled = false;
    const loadSettings = async () => {
      try {
        const { structuredVariant: variant } = await fetchSettings();
        if (cancelled) return;
        if (variant) {
          setStructuredVariant(variant);
        }
      } catch (err) {
        console.warn("Impossible de charger les paramètres :", err);
      }
    };
    loadSettings();
    return () => {
      cancelled = true;
    };
  }, []);

  const entryType = detectedType || contentMode || "analyse";

  // [ACTION] Supprimer TOUTES les fonctions de gestion du plan :
  // markPlanEdited, handleWindowToggle, handleStyleChange, handleNewsToggle,
  // handlePlanFieldChange, handlePlanSave

  // [ACTION] Garder handleJournalSave (la version corrigée de la réponse précédente)
  const handleJournalSave = async (content) => {
    setJournalSaving(true);
    setJournalError("");
    setJournalSuccess("");
    const textForStructure = content || aiResult;

    if (!textForStructure) {
      setJournalError("Impossible d'enregistrer : contenu IA manquant.");
      setJournalSaving(false);
      return;
    }

    let structuredData = null;
    try {
      structuredData = await requestStructuredAnalysis({
        rawText: textForStructure,
        entryType,
        plan: planDescription,
        variant: structuredVariant,
      });
      if (!structuredData || !structuredData.metadata) {
        throw new Error(
          "L'analyse structurée de l'IA a échoué. Réponse invalide."
        );
      }
    } catch (err) {
      console.error("Structured analysis failed:", err);
      setJournalError(`Échec de l'analyse structurée : ${err.message}`);
      setJournalSaving(false);
      return;
    }

    try {
      const journalType = structuredData.entryType || entryType;
      await saveJournalEntry({
        type: journalType,
        content: textForStructure,
        plan: planDescription,
        transcript,
        metadata: structuredData.metadata,
      });
      setJournalSuccess(
        `Entrée ${
          journalType === "trade" ? "trade" : "analyse"
        } enregistrée dans le journal.`
      );
    } catch (err) {
      setJournalError(
        err.message || "Impossible d'enregistrer l'entrée dans le journal."
      );
    } finally {
      setJournalSaving(false);
    }
  };

  return (
    <>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, md: 4 },
          borderRadius: { xs: 3, md: 3.5 },
          border: "1px solid rgba(255,255,255,0.08)",
          background:
            "linear-gradient(160deg, rgba(8,13,28,0.96) 0%, rgba(5,8,18,0.9) 100%)",
          boxShadow: "0 40px 80px rgba(0,0,0,0.55)",
        }}
      >
        <Stack spacing={{ xs: 3, md: 4 }}>
          {/* [ACTION] Supprimer les onglets (Tabs) */}

          {/* On affiche directement la capture */}
          <Stack spacing={{ xs: 3, md: 4 }}>
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={{ xs: 2.5, md: 3.5 }}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", md: "center" }}
            >
              <Stack spacing={1.5}>
                <Typography
                  variant="overline"
                  color="text.secondary"
                  fontWeight={700}
                  letterSpacing="0.14em"
                >
                  Capture & préparation
                </Typography>
                <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
                  {captureStages.map(({ icon, label }) => (
                    <Chip
                      key={label}
                      icon={icon}
                      label={label}
                      size="small"
                      sx={{
                        fontWeight: 600,
                        bgcolor: "rgba(39,58,150,0.1)",
                        color: "primary.main",
                        borderRadius: 2,
                      }}
                    />
                  ))}
                </Stack>
              </Stack>

              <Stack
                direction={{ xs: "row", md: "row" }}
                spacing={1.5}
                alignItems="center"
              >
                <SpeechControls
                  isSupported={isSupported}
                  isRecording={isRecording}
                  onStart={startRecording}
                  onStop={stopRecording}
                />
                <Chip
                  icon={captureStatus.icon}
                  label={captureStatus.label}
                  sx={{
                    fontWeight: 600,
                    borderRadius: 999,
                    px: 1.5,
                    height: 32,
                    ...captureStatus.sx,
                    "& .MuiChip-icon": {
                      color: captureStatus.iconColor || captureStatus.sx?.color,
                    },
                  }}
                />
              </Stack>
            </Stack>

            <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />

            <Box
              sx={{
                borderRadius: { xs: 2.5, md: 3 },
                border: "1px solid rgba(255,255,255,0.08)",
                backgroundColor: "rgba(255,255,255,0.03)",
                boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.04)",
                p: { xs: 1.5, md: 2 },
              }}
            >
              <TranscriptEditor value={transcript} onChange={setTranscript} />
            </Box>

            <Stack spacing={1} sx={{ mt: { xs: 1.5, md: 2 } }}>
              <Typography variant="subtitle2" fontWeight={600}>
                Type de capture
              </Typography>
              <ToggleButtonGroup
                exclusive
                value={contentMode}
                onChange={(_, value) => value && setContentMode(value)}
                aria-label="Type de contenu"
                size="small"
              >
                <ToggleButton value="analyse">Analyse</ToggleButton>
                <ToggleButton value="trade">Trade</ToggleButton>
              </ToggleButtonGroup>
              <Typography variant="caption" color="text.secondary">
                Choisissez une analyse pure pour explorer plusieurs scénarios ou un
                trade pour qualifier un positionnement avec conclusion (TP/SL,
                jugement d'erreur/bonne décision).
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Plan actif : {planPreview || "Aucun plan renseigné"}.
              </Typography>
            </Stack>

            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={{ xs: 2, md: 3 }}
              alignItems={{ xs: "flex-start", md: "center" }}
              justifyContent="space-between"
            >
              <Chip
                label={`${wordCount} mots`}
                size="small"
                sx={{
                  fontWeight: 600,
                  bgcolor: "rgba(28,98,209,0.1)",
                  color: "primary.main",
                  borderRadius: 999,
                }}
              />
              <ActionBar
                disabled={!transcript.trim()}
                loading={loading}
                onSubmit={handleSubmit}
                error={error}
              />
            </Stack>
          </Stack>

          {/* [ACTION] Supprimer tout le bloc "activeTab === 'plan'" */}
        </Stack>
      </Paper>

      <AiResponseCard
        detectedType={detectedType}
        result={aiResult}
        onReset={resetAnalysis}
        entryType={entryType}
        onSave={handleJournalSave}
        saving={journalSaving}
        saveError={journalError}
        saveSuccess={journalSuccess}
      />
    </>
  );
};

export default InputArea;