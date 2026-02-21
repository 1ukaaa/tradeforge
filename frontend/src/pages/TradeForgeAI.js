// frontend/src/pages/TradeForgeAI.js

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
  Grid,
  Paper,
  Stack,
  Typography,
  useTheme
} from "@mui/material";
import { useEffect, useRef, useState } from "react";

import ReactMarkdown from "react-markdown";
import ChatInputBar from "../components/ChatInputBar";
import { fetchJournalEntries } from "../services/journalClient";
import { fetchPlan } from "../services/planClient";
import { buildPlanDescription } from "../utils/planUtils";

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

const AIMessage = ({ text }) => {
  const theme = useTheme();
  return (
    <Fade in={true} timeout={500}>
      <Stack direction="row" spacing={2} justifyContent="flex-start" sx={{ width: "100%", mb: 4 }}>
        <Stack alignItems="flex-start" spacing={1} sx={{ maxWidth: { xs: "90%", md: "75%" } }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Avatar sx={{ width: 24, height: 24, bgcolor: 'secondary.main' }}>
              <AutoAwesomeIcon sx={{ fontSize: 16 }} />
            </Avatar>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              TRADEFORGE AI
            </Typography>
          </Stack>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: "4px 20px 20px 20px",
              bgcolor: alpha(theme.palette.background.paper, 0.8),
              border: `1px solid ${theme.palette.divider}`,
              backdropFilter: "blur(10px)",
              color: "text.primary",
              boxShadow: theme.shadows[2],
            }}
          >
            <Box sx={{ '& p': { m: 0, mb: 1, lineHeight: 1.6 }, '& ul, & ol': { m: 0, pl: 2, mb: 1 }, '& strong': { fontWeight: 800, color: 'text.primary' } }}>
              <ReactMarkdown>{text}</ReactMarkdown>
            </Box>
          </Paper>
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
        <Stack alignItems="flex-start" spacing={1}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Avatar sx={{ width: 24, height: 24, bgcolor: 'secondary.main' }}>
              <AutoAwesomeIcon sx={{ fontSize: 16 }} />
            </Avatar>
          </Stack>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: "4px 20px 20px 20px",
              bgcolor: alpha(theme.palette.background.paper, 0.4),
              border: `1px solid ${theme.palette.divider}`,
              display: 'flex',
              alignItems: 'center',
              gap: 2
            }}
          >
            <CircularProgress size={20} color="secondary" />
            <Typography variant="body2" color="text.secondary" fontWeight={500}>
              Analyse des données en cours...
            </Typography>
          </Paper>
        </Stack>
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
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [journalEntries, setJournalEntries] = useState([]);

  // Navigation state
  const scrollRef = useRef(null);

  // 1. Charger le plan et les réglages
  useEffect(() => {
    const loadPrereqs = async () => {
      try {
        const { plan } = await fetchPlan();
        setPlanDescription(buildPlanDescription(plan));
      } catch (e) { console.error("Erreur chargement plan:", e); }

      try {
        const entries = await fetchJournalEntries();
        setJournalEntries(entries || []);
      } catch (e) { console.error("Erreur chargement journal:", e); }
    };
    loadPrereqs();
  }, []);

  // Scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async (rawText) => {
    setLoading(true);
    setError("");

    const newUserMsg = { id: Date.now(), role: 'user', text: rawText };
    setMessages(prev => [...prev, newUserMsg]);

    try {
      const { requestChatAnalysis } = await import("../services/aiClient");
      const analysisResult = await requestChatAnalysis({
        rawText,
        plan: planDescription,
        recentTrades: journalEntries
      });

      const newAiMsg = { id: Date.now() + 1, role: 'ai', text: analysisResult };
      setMessages(prev => [...prev, newAiMsg]);

    } catch (err) {
      console.error("Échec de l'analyse:", err);
      setError(err.message || "Une erreur est survenue.");
    } finally {
      setLoading(false);
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
          {journalEntries.length > 0 && (
            <Chip
              icon={<DescriptionIcon sx={{ fontSize: 14 }} />}
              label={`${journalEntries.length} Trades liés`}
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
            {messages.length === 0 && (
              <Fade in={true} timeout={800}>
                <Box sx={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <Box sx={{ textAlign: 'center', mb: 6 }}>
                    <AutoAwesomeIcon sx={{ fontSize: 48, color: 'secondary.main', mb: 2 }} />
                    <Typography variant="h4" fontWeight={900} gutterBottom>Data Analyst Personnel</Typography>
                    <Typography variant="body1" color="text.secondary">Posez-moi n'importe quelle question sur vos performances et votre Journal.</Typography>
                  </Box>
                  <Grid container spacing={2}>
                    {["Combien de trades ais-je pris cette semaine ?", "Quel est mon win-rate à la vente sur le pétrole (CL) ?", "Fais-moi le bilan de mes erreurs les plus fréquentes."].map((s, i) => (
                      <Grid item xs={12} sm={4} key={i}>
                        <Paper elevation={0} onClick={() => handleSend(s)} sx={{ p: 2, height: '100%', cursor: 'pointer', borderRadius: 3, border: `1px solid ${theme.palette.divider}`, bgcolor: alpha(theme.palette.background.paper, 0.4), transition: 'all 0.2s', '&:hover': { bgcolor: alpha(theme.palette.divider, 0.1), borderColor: theme.palette.secondary.main } }}>
                          <Typography variant="body2" fontWeight={600}>{s}</Typography>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              </Fade>
            )}

            {messages.map((msg) => (
              msg.role === 'user' ? <UserPrompt key={msg.id} text={msg.text} /> : <AIMessage key={msg.id} text={msg.text} />
            ))}

            {loading && <AILoadingBubble />}

            {error && (
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
      />
    </Box>
  );
};

export default TradeForgeAI;
