// frontend/src/pages/TradeForgeAI.js

import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import DescriptionIcon from '@mui/icons-material/Description';
import PersonIcon from '@mui/icons-material/Person';
import {
  Alert,
  alpha,
  Avatar,
  Box,
  Chip,
  CircularProgress,
  Container,
  Fade,
  Paper,
  Stack,
  Typography,
  useTheme
} from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

import ChatInputBar from "../components/ChatInputBar";
import EditableAnalysis from "../components/EditableAnalysis";
import WelcomeScreen from "../components/WelcomeScreen";
import { requestAnalysis, requestStructuredAnalysis } from "../services/aiClient";
import { fetchBrokerPositions, fetchBrokerSummary } from "../services/brokerClient";
import { saveJournalEntry } from "../services/journalClient";
import { fetchPlan } from "../services/planClient";
import { fetchSettings } from "../services/settingsClient";
import { buildPlanDescription } from "../utils/planUtils";
import { stringifyTimeframes } from "../utils/timeframeUtils";

// --- COMPOSANTS UI ---

const UserPrompt = ({ text }) => {
  const theme = useTheme();
  return (
    <Fade in={true} timeout={500}>
      <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ width: "100%", mb: 4 }}>
        <Stack alignItems="flex-end" spacing={1} sx={{ maxWidth: { xs: "85%", md: "70%" } }}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: "20px 20px 4px 20px",
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              color: "primary.contrastText",
              boxShadow: theme.shadows[4],
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <Typography variant="body1" sx={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
              {text}
            </Typography>
          </Paper>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              VOUS
            </Typography>
            <Avatar sx={{ width: 24, height: 24, bgcolor: 'primary.main' }}>
              <PersonIcon sx={{ fontSize: 16 }} />
            </Avatar>
          </Stack>
        </Stack>
      </Stack>
    </Fade>
  );
};

const AILoadingBubble = () => {
  const theme = useTheme();
  return (
    <Fade in={true}>
      <Stack direction="row" spacing={2} sx={{ width: "100%", mb: 4 }}>
        <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main', boxShadow: theme.shadows[2] }}>
          <AutoAwesomeIcon sx={{ fontSize: 18 }} />
        </Avatar>
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: "4px 20px 20px 20px",
            bgcolor: alpha(theme.palette.background.paper, 0.6),
            border: `1px solid ${theme.palette.divider}`,
            backdropFilter: "blur(10px)",
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}
        >
          <CircularProgress size={20} color="secondary" />
          <Typography variant="body2" color="text.secondary" fontWeight={500}>
            Analyse en cours...
          </Typography>
        </Paper>
      </Stack>
    </Fade>
  );
};

/**
 * Page principale TradeForge AI.
 * Gère le cycle de vie : Vide -> Soumission -> Affichage éditable
 */
const TradeForgeAI = () => {
  const theme = useTheme();
  const [planDescription, setPlanDescription] = useState("");
  const [structuredVariant, setStructuredVariant] = useState("detailed");
  const [analysisVariant, setAnalysisVariant] = useState("default");
  const [tradeVariant, setTradeVariant] = useState("default");
  const [accountOptions, setAccountOptions] = useState([]);
  const [brokerTrades, setBrokerTrades] = useState([]);
  const [defaultAccountId, setDefaultAccountId] = useState(null);

  // États du "chat"
  const [userTranscript, setUserTranscript] = useState("");
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [structuredMetadata, setStructuredMetadata] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // États de sauvegarde
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");

  // Navigation state
  const { state } = useLocation();
  const getInitialTool = () => {
    const defaultTab = state?.defaultTab;
    if (defaultTab === 'trade') {
      return 'trade';
    }
    return 'analyse';
  };
  const [activeTool, setActiveTool] = useState(getInitialTool);

  const suggestionClickCallback = useRef(null);
  const scrollRef = useRef(null);

  // 1. Charger le plan et les réglages
  useEffect(() => {
    const loadPrereqs = async () => {
      try {
        const { plan } = await fetchPlan();
        setPlanDescription(buildPlanDescription(plan));
      } catch (e) { console.error("Erreur chargement plan:", e); }

      try {
        const settings = await fetchSettings();
        setStructuredVariant(settings.structuredVariant || "detailed");
        setAnalysisVariant(settings.analysisVariant || "default");
        setTradeVariant(settings.tradeVariant || "default");

        const [summary, positions] = await Promise.all([
          fetchBrokerSummary(),
          fetchBrokerPositions(),
        ]);
        const derivedAccounts = summary.accounts || [];
        setAccountOptions(derivedAccounts);
        setBrokerTrades(positions || []);
        if (derivedAccounts.length) {
          setDefaultAccountId(derivedAccounts[0].id);
        }
      } catch (e) { console.error("Erreur chargement réglages:", e); }
    };
    loadPrereqs();
  }, []);

  // Scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [userTranscript, aiAnalysis, loading]);

  // 2. Logique de soumission
  const handleSend = async (rawText) => {
    setLoading(true);
    setError("");
    setSaveError("");
    setSaveSuccess("");
    setUserTranscript(rawText);
    setAiAnalysis("");
    setStructuredMetadata(null);

    const entryType = activeTool;
    const template = entryType === "trade" ? tradeVariant : analysisVariant;

    try {
      const [analysisResult, structuredData] = await Promise.all([
        requestAnalysis({
          rawText,
          template,
          plan: planDescription,
        }),
        requestStructuredAnalysis({
          rawText,
          entryType,
          plan: planDescription,
          variant: structuredVariant,
        })
      ]);

      if (!structuredData || !structuredData.metadata) {
        throw new Error("L'IA n'a pas pu structurer la réponse.");
      }

      setAiAnalysis(analysisResult);
      setStructuredMetadata({
        ...structuredData.metadata,
        timeframe: stringifyTimeframes(structuredData.metadata?.timeframe),
      });

    } catch (err) {
      console.error("Échec de l'analyse:", err);
      setError(err.message || "Une erreur est survenue.");
      setAiAnalysis(`**Erreur :** ${err.message || "Impossible de générer l'analyse."}`);
    } finally {
      setLoading(false);
    }
  };

  // 3. Logique de Sauvegarde
  const handleSave = async (finalContent, finalMetadata) => {
    if (!finalContent || !userTranscript) {
      setSaveError("Aucune analyse à sauvegarder.");
      return;
    }

    setSaving(true);
    setSaveError("");
    setSaveSuccess("");

    try {
      const entryType = finalMetadata.entryType || activeTool;

      await saveJournalEntry({
        type: entryType,
        content: finalContent,
        plan: planDescription,
        transcript: userTranscript,
        metadata: finalMetadata,
      });

      setSaveSuccess("Analyse enregistrée au journal !");

      setTimeout(() => {
        setUserTranscript("");
        setAiAnalysis("");
        setStructuredMetadata(null);
        setSaveSuccess("");
      }, 2000);

    } catch (err) {
      console.error("Échec de la sauvegarde:", err);
      setSaveError(err.message || "Une erreur est survenue lors de la sauvegarde.");
    } finally {
      setSaving(false);
    }
  };

  const handleSuggestion = (suggestion) => {
    if (suggestionClickCallback.current) {
      suggestionClickCallback.current(suggestion);
    }
  };

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column", bgcolor: "background.default" }}>

      {/* MINIMAL HEADER - Context Aware */}
      <Paper
        elevation={0}
        sx={{
          py: 1.5,
          px: { xs: 2, md: 4 },
          borderBottom: `1px solid ${theme.palette.divider}`,
          bgcolor: alpha(theme.palette.background.paper, 0.8),
          backdropFilter: "blur(12px)",
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Stack direction="row" alignItems="center" spacing={2}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
            <AutoAwesomeIcon sx={{ fontSize: 18 }} />
          </Avatar>
          <Typography variant="subtitle1" fontWeight={700}>
            TradeForge AI
          </Typography>
        </Stack>

        {/* Context Indicators */}
        <Stack direction="row" spacing={1}>
          {planDescription && (
            <Chip
              icon={<DescriptionIcon sx={{ fontSize: 14 }} />}
              label="Plan Chargé"
              size="small"
              color="success"
              variant="outlined"
              sx={{ height: 24, fontSize: 11, fontWeight: 600 }}
            />
          )}
          {accountOptions.length > 0 && (
            <Chip
              icon={<AccountBalanceWalletIcon sx={{ fontSize: 14 }} />}
              label={`${accountOptions.length} Compte(s)`}
              size="small"
              color="info"
              variant="outlined"
              sx={{ height: 24, fontSize: 11, fontWeight: 600 }}
            />
          )}
        </Stack>
      </Paper>

      {/* SCROLLABLE CONTENT AREA */}
      <Box
        ref={scrollRef}
        sx={{
          flex: 1,
          overflowY: "auto",
          px: { xs: 2, md: 4 },
          py: 4,
          scrollBehavior: 'smooth'
        }}
      >
        <Container maxWidth="lg">
          <Stack spacing={4}>
            {/* État vide */}
            {!userTranscript && !aiAnalysis && (
              <Fade in={true} timeout={800}>
                <Box sx={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <WelcomeScreen onSuggestionClick={handleSuggestion} />
                </Box>
              </Fade>
            )}

            {/* Prompt Utilisateur */}
            {userTranscript && <UserPrompt text={userTranscript} />}

            {/* Loader */}
            {loading && <AILoadingBubble />}

            {/* Bulle éditable (Réponse IA) */}
            {aiAnalysis && structuredMetadata && (
              <Fade in={true} timeout={600}>
                <Box sx={{ width: '100%', display: 'flex', gap: 2 }}>
                  <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main', mt: 1, boxShadow: theme.shadows[2] }}>
                    <AutoAwesomeIcon sx={{ fontSize: 18 }} />
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <EditableAnalysis
                      content={aiAnalysis}
                      initialMetadata={structuredMetadata}
                      onSave={handleSave}
                      saving={saving}
                      saveError={saveError}
                      saveSuccess={saveSuccess}
                      accountOptions={accountOptions}
                      defaultAccountId={defaultAccountId}
                      entryType={activeTool}
                      brokerTrades={brokerTrades}
                    />
                  </Box>
                </Box>
              </Fade>
            )}

            {/* Afficher l'erreur principale */}
            {error && !aiAnalysis && (
              <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>
            )}

            {/* Spacer for bottom input bar */}
            <Box sx={{ height: 100 }} />
          </Stack>
        </Container>
      </Box>

      {/* INPUT BAR - Fixed at bottom */}
      <ChatInputBar
        onSend={handleSend}
        loading={loading}
        onSuggestionClick={suggestionClickCallback}
        activeTool={activeTool}
        onToolChange={setActiveTool}
      />
    </Box>
  );
};

export default TradeForgeAI;
