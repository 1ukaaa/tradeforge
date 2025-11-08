import TimelineIcon from "@mui/icons-material/Timeline";
import RouteRoundedIcon from "@mui/icons-material/RouteRounded";
import FactCheckRoundedIcon from "@mui/icons-material/FactCheckRounded";
import GraphicEqRoundedIcon from "@mui/icons-material/GraphicEqRounded";
import MicNoneRoundedIcon from "@mui/icons-material/MicNoneRounded";
import DoNotDisturbAltRoundedIcon from "@mui/icons-material/DoNotDisturbAltRounded";
import { Box, Chip, Divider, Paper, Stack, Tab, Tabs, TextField, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
import ActionBar from "../features/analyzer/components/ActionBar";
import AiResponseCard from "../features/analyzer/components/AiResponseCard";
import SpeechControls from "../features/analyzer/components/SpeechControls";
import TranscriptEditor from "../features/analyzer/components/TranscriptEditor";
import useSpeechCapture from "../features/analyzer/hooks/useSpeechCapture";
import { requestAnalysis } from "../services/aiClient";
import { saveJournalEntry } from "../services/journalClient";

const inferContentType = (text) => {
  const match = text.match(/Type\s*:?\s*(Trade|Analyse)/i);
  return match ? match[1].toLowerCase() : "";
};

const buildJournalMetadata = (content, plan, entryType) => {
  const trimmedContent = content.trim();
  const firstLine = trimmedContent.split("\n").find((line) => line.trim());
  const snippet = trimmedContent.replace(/\n+/g, " ").slice(0, 220);
  const tags = [entryType === "trade" ? "Trade" : "Analyse", "IA"];
  return {
    title: firstLine || `${entryType === "trade" ? "Trade" : "Analyse"} généré`,
    planSummary: plan?.split("\n")[0]?.trim() || "Plan non renseigné.",
    result: entryType === "trade" ? "Trade validé" : "Analyse IA",
    grade: entryType === "trade" ? "À valider" : "Scénarios croisés",
    planAdherence: entryType === "trade" ? 85 : 40,
    tags,
    outcome: snippet || "Synthèse à compléter.",
    timeframe: entryType === "trade" ? "H1 / H4" : "Daily / H4",
    symbol: "Actif non défini",
    nextSteps:
      entryType === "trade"
        ? "Vérifier la gestion du stop et préparer la revue journalière."
        : "Suivre les niveaux mentionnés et actualiser les signaux.",
    risk:
      entryType === "trade"
        ? "Stop / gestion du risque à surveiller."
        : "Risques macro / invalidation par événements majeurs.",
  };
};

const DEFAULT_TRADING_PLAN = `1. Direction macro : privilégier les longs sur indices US/EU après consolidation.
2. Entrée : attendre un retracement M15 validé sur support Daily confirmé, puis patientez une impulsion H1.
3. Gestion des risques : 1,5 % max par trade, TP1 à +0,5 %, TP2 à +1,2 %, SL sous le dernier swing.
4. Sorties intermédiaires : basculer en BE dès que +0,2 % est atteint, ajouter une parcelle prise de profits à TP1.
5. Check final : pas de position avant la publication d'un événement majeur et validation du momentum intraday.`;

const InputArea = () => {
  const [transcript, setTranscript] = useState("");
  const [aiResult, setAiResult] = useState("");
  const [detectedType, setDetectedType] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [contentMode, setContentMode] = useState("analyse");
  const [tradingPlan, setTradingPlan] = useState(DEFAULT_TRADING_PLAN);
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

  const planPreview = useMemo(() => {
    const firstLine = tradingPlan.trim().split("\n")[0] || "";
    return firstLine.length > 120 ? `${firstLine.slice(0, 120)}…` : firstLine;
  }, [tradingPlan]);

  const contentTemplate = contentMode === "trade" ? "trade.v1" : "analysis.v1";

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      const payload = {
        rawText: transcript,
        template: contentTemplate,
        plan: tradingPlan,
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

  const entryType = detectedType || contentMode || "analyse";

  const handleJournalSave = async (content) => {
    setJournalSaving(true);
    setJournalError("");
    setJournalSuccess("");
    try {
      await saveJournalEntry({
        type: entryType,
        content,
        plan: tradingPlan,
        transcript,
        metadata: buildJournalMetadata(content, tradingPlan, entryType),
      });
      setJournalSuccess(
        `Entrée ${entryType === "trade" ? "trade" : "analyse"} enregistrée dans le journal.`
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
          border: "1px solid rgba(24,38,88,0.08)",
          background: "linear-gradient(150deg, rgba(255,255,255,0.95) 0%, rgba(232,237,255,0.9) 100%)",
          boxShadow: "0 28px 68px rgba(14,32,76,0.12)",
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

              <Divider sx={{ borderColor: "rgba(39,58,150,0.12)" }} />

              <Box
                sx={{
                  borderRadius: { xs: 2.5, md: 3 },
                  border: "1px solid rgba(37,56,124,0.08)",
                  backgroundColor: "rgba(255,255,255,0.92)",
                  boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.4)",
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
            <Stack spacing={2}>
              <Typography variant="subtitle1" fontWeight={600}>
                Plan de trading
              </Typography>
              <TextField
                label="Plan en place"
                value={tradingPlan}
                onChange={(event) => setTradingPlan(event.target.value)}
                multiline
                rows={6}
                fullWidth
                variant="outlined"
                helperText="Ce plan fictif sera transmis à Gemini pour qu'il évalue si le trade a respecté ces règles."
              />
              <Typography variant="caption" color="text.secondary">
                Si un trade est sélectionné, Gemini devra se baser sur ce plan afin de dire si la voie suivie
                respecte les conditions initiales (prise de profits, stop, momentum, etc.).
              </Typography>
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
