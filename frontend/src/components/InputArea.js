import DoNotDisturbAltRoundedIcon from "@mui/icons-material/DoNotDisturbAltRounded";
import FactCheckRoundedIcon from "@mui/icons-material/FactCheckRounded";
import GraphicEqRoundedIcon from "@mui/icons-material/GraphicEqRounded";
import MicNoneRoundedIcon from "@mui/icons-material/MicNoneRounded";
import RouteRoundedIcon from "@mui/icons-material/RouteRounded";
import TimelineIcon from "@mui/icons-material/Timeline";
import { Box, Button, Chip, Divider, Paper, Stack, Tab, Tabs, TextField, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
import ActionBar from "../features/analyzer/components/ActionBar";
import AiResponseCard from "../features/analyzer/components/AiResponseCard";
import SpeechControls from "../features/analyzer/components/SpeechControls";
import TranscriptEditor from "../features/analyzer/components/TranscriptEditor";
import useSpeechCapture from "../features/analyzer/hooks/useSpeechCapture";
import { requestAnalysis, requestStructuredAnalysis } from "../services/aiClient";
import { saveJournalEntry } from "../services/journalClient";
import { fetchPlan, savePlan } from "../services/planClient";
import { fetchSettings } from "../services/settingsClient";
import { structureGeminiResult } from "../utils/journalMetadata";

const inferContentType = (text) => {
  const match = text.match(/Type\s*:?\s*(Trade|Analyse)/i);
  return match ? match[1].toLowerCase() : "";
};

const TRADING_WINDOWS = ["Asie / Pacifique", "Europe", "US"];
const TRADING_STYLES = [
  { value: "swing", label: "Swing trading" },
  { value: "intra", label: "Intraday" },
  { value: "scalp", label: "Scalping" },
];

const DEFAULT_PLAN = {
  windows: ["Europe", "US"],
  style: "swing",
  pairs: "EURUSD, NAS100, DAX",
  tradeDuringNews: false,
  entryStrategy:
    "Attendre un retracement M15 confirmé par un support Daily, puis valider sur impulsion H1 avant d'entrer.",
  risk: "1,5 % maximum par trade, stop sous le dernier swing et TP1 à +0,5 % / TP2 à +1,2 %.",
  management:
    "Sorties progressives : basculer en BE dès +0,2 %, verrouiller un tiers à TP1 et laisser le reste courir lorsque le momentum le permet.",
  notes: "Pas de trade pendant les annonces majeures, vérification des niveaux macro avant toute entrée.",
};

const sanitizePairs = (value = "") =>
  value
    .split(",")
    .map((entry) => entry.trim().toUpperCase())
    .filter(Boolean)
    .join(", ");

const buildPlanDescription = (plan) => {
  const safePlan = plan || DEFAULT_PLAN;
  const windowsArray = Array.isArray(safePlan.windows) ? safePlan.windows : [];
  const windows = windowsArray.length ? windowsArray.join(" / ") : "Horaires à définir";
  const styleLabel =
    TRADING_STYLES.find((option) => option.value === safePlan.style)?.label || safePlan.style;
  const pairs = sanitizePairs(safePlan.pairs) || "Paires non définies";
  const news = safePlan.tradeDuringNews ? "Oui (sur setups définis)" : "Non, on évite les annonces";

  return [
    `1. Horaires : ${windows}`,
    `2. Style : ${styleLabel}`,
    `3. Instruments : ${pairs}`,
    `4. Trading pendant annonces : ${news}`,
    `5. Entrées : ${plan.entryStrategy}`,
    `6. Gestion du risque : ${plan.risk}`,
    `7. Sorties : ${plan.management}`,
    `8. Notes supplémentaires : ${plan.notes}`,
  ].join("\n");
};

const formatSavedAt = (timestamp) => {
  try {
    return new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" }).format(
      new Date(timestamp)
    );
  } catch {
    return timestamp;
  }
};

const InputArea = () => {
  const [transcript, setTranscript] = useState("");
  const [aiResult, setAiResult] = useState("");
  const [detectedType, setDetectedType] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [contentMode, setContentMode] = useState("analyse");
  const [tradingPlan, setTradingPlan] = useState(DEFAULT_PLAN);
  const [planSavedAt, setPlanSavedAt] = useState(null);
  const [structuredVariant, setStructuredVariant] = useState("detailed");
  const [planSaving, setPlanSaving] = useState(false);
  const [planFeedback, setPlanFeedback] = useState({ text: "", severity: "success" });
  const [activeTab, setActiveTab] = useState("capture");
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

  const { isSupported, isRecording, startRecording, stopRecording } = useSpeechCapture({
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
          background: "linear-gradient(120deg, rgba(255,76,91,0.9) 0%, rgba(255,119,119,0.82) 100%)",
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

  const planDescription = useMemo(() => buildPlanDescription(tradingPlan), [tradingPlan]);
  const planPreview = useMemo(() => {
    const firstLine = planDescription.split("\n").find((line) => line.trim()) || "";
    return firstLine.length > 120 ? `${firstLine.slice(0, 120)}…` : firstLine;
  }, [planDescription]);

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
    const loadPlan = async () => {
      try {
        const { plan, updatedAt } = await fetchPlan();
        if (cancelled) return;
        if (plan) {
          setTradingPlan(plan);
        }
        if (updatedAt) {
          setPlanSavedAt(updatedAt);
        }
      } catch (err) {
        console.warn("Impossible de charger le plan :", err);
      }
    };
    loadPlan();
    return () => {
      cancelled = true;
    };
  }, []);

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
      if (plan) {
        setTradingPlan(plan);
      }
      if (updatedAt) {
        setPlanSavedAt(updatedAt);
      }
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

  const handleJournalSave = async (content) => {
    setJournalSaving(true);
    setJournalError("");
    setJournalSuccess("");
    const textForStructure = content || aiResult || transcript;
    let structuredData = null;
    if (textForStructure) {
      try {
        structuredData = await requestStructuredAnalysis({
          rawText: textForStructure,
          entryType,
          plan: planDescription,
          variant: structuredVariant,
        });
      } catch (err) {
        console.warn("Structured analysis failed:", err);
      }
    }

    try {
      const fallback = structureGeminiResult(textForStructure || "", entryType, planDescription);
      const structuredMetadata = structuredData?.metadata || {};
      const structuredOverrides = Object.entries(structuredMetadata).reduce(
        (acc, [key, value]) => {
          if (Array.isArray(value)) {
            if (value.length) acc[key] = value;
            return acc;
          }
          if (value !== undefined && value !== null && value !== "") {
            acc[key] = value;
          }
          return acc;
        },
        {}
      );
      const mergedMetadata = {
        ...fallback.metadata,
        ...structuredOverrides,
        tags:
          structuredOverrides.tags?.length > 0
            ? structuredOverrides.tags
            : fallback.metadata.tags,
      };
      const journalContent = content || aiResult || transcript;
      const journalType = structuredData?.entryType || entryType;
      await saveJournalEntry({
        type: journalType,
        content: journalContent,
        plan: planDescription,
        transcript,
        metadata: mergedMetadata,
      });
      setJournalSuccess(
        `Entrée ${journalType === "trade" ? "trade" : "analyse"} enregistrée dans le journal.`
      );
    } catch (err) {
      setJournalError(err.message || "Impossible d'enregistrer l'entrée dans le journal.");
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
          background: "linear-gradient(160deg, rgba(8,13,28,0.96) 0%, rgba(5,8,18,0.9) 100%)",
          boxShadow: "0 40px 80px rgba(0,0,0,0.55)",
        }}
      >
        <Stack spacing={{ xs: 3, md: 4 }}>
          <Tabs
            value={activeTab}
            onChange={(_, value) => value && setActiveTab(value)}
            aria-label="Sections de l'input"
            sx={{ borderBottom: 1, borderColor: "divider" }}
          >
            <Tab value="capture" label="Capture" />
            <Tab value="plan" label="Plan de trading" />
          </Tabs>

          {activeTab === "capture" ? (
            <Stack spacing={{ xs: 3, md: 4 }}>
              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={{ xs: 2.5, md: 3.5 }}
                justifyContent="space-between"
                alignItems={{ xs: "flex-start", md: "center" }}
              >
                <Stack spacing={1.5}>
                  <Typography variant="overline" color="text.secondary" fontWeight={700} letterSpacing="0.14em">
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

                <Stack direction={{ xs: "row", md: "row" }} spacing={1.5} alignItems="center">
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
                  Choisissez une analyse pure pour explorer plusieurs scénarios ou un trade pour qualifier un
                  positionnement avec conclusion (TP/SL, jugement d'erreur/bonne décision).
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
          ) : (
            <Stack spacing={3}>
              <Stack spacing={1}>
                <Typography variant="subtitle1" fontWeight={600}>
                  Plan de trading structuré
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Définis des paramètres précis (horaires, style, instruments, règles d’actualité) pour guider
                  chaque analyse et trade. Ce plan sera envoyé à Gemini et utilisé dans toutes les évaluations.
                </Typography>
              </Stack>
              <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
                <Paper
                  elevation={0}
                  sx={{
                    flex: 1,
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
                    flex: 1,
                    borderRadius: 3,
                    border: "1px dashed rgba(255,255,255,0.2)",
                    background: "rgba(255,255,255,0.02)",
                    p: { xs: 2, md: 3 },
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
                        fontFamily: `'JetBrains Mono','Fira Code',monospace`,
                        bgcolor: "rgba(255,255,255,0.04)",
                        borderRadius: 2,
                        p: 2,
                        mb: 1,
                      }}
                    >
                      {planDescription}
                    </Box>
                  </Stack>
                </Paper>
              </Stack>
            </Stack>
          )}
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
