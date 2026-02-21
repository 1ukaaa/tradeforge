import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
// Imports ajoutés
import AnalyticsIcon from "@mui/icons-material/Analytics";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import {
  Box,
  CircularProgress,
  IconButton,
  Paper,
  TextField,
  Tooltip,
  alpha,
  useTheme
} from "@mui/material";
// 'useState' est déjà importé, j'ajoute 'useMemo'
import { useEffect, useState } from "react";
import useSpeechCapture from "../features/analyzer/hooks/useSpeechCapture";

// Définition des outils
const TOOLS = {
  analyse: {
    label: "Analyse",
    icon: <AnalyticsIcon fontSize="small" />,
    description: "Analyser un plan ou une session (défaut)",
    disabled: false,
  },
  trade: {
    label: "Trade",
    icon: <ShowChartIcon fontSize="small" />,
    description: "Analyser un trade spécifique (entrée/sortie)",
    disabled: false,
  },
};

/**
 * Barre d'input fixe en bas de page, style chatbot.
 * Gère le texte, la dictée vocale et la soumission.
 */
const ChatInputBar = ({
  onSend,
  loading,
  onSuggestionClick
}) => {
  const theme = useTheme();
  const [text, setText] = useState("");

  // Hook de capture vocale
  const { isSupported, isRecording, startRecording, stopRecording } =
    useSpeechCapture({
      onTranscript: (chunk) => {
        setText((prev) => (prev ? prev + " " + chunk : chunk));
      },
    });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (loading || !text.trim()) return;
    // 'activeTool' est déjà géré par le parent (TradeForgeAI)
    onSend(text);
    setText(""); // Vider le champ après envoi
  };

  const handleMicToggle = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Ce hook permet au parent (TradeForgeAI) de remplir le champ de texte
  useEffect(() => {
    if (onSuggestionClick) {
      onSuggestionClick.current = (suggestion) => {
        setText(suggestion);
      };
    }
  }, [onSuggestionClick]);

  return (
    <Box
      component="footer"
      sx={{
        position: "sticky",
        bottom: 0,
        width: "100%",
        py: 2,
        backdropFilter: "blur(12px)",
        backgroundColor: (theme) =>
          alpha(theme.palette.background.default, 0.8),
      }}
    >
      <Paper
        component="form"
        onSubmit={handleSubmit}
        sx={{
          p: 1,
          display: "flex",
          alignItems: "center",
          width: "100%",
          maxWidth: { lg: 980, xl: 1080 },
          mx: "auto",
          borderRadius: 4,
          border: (theme) => `1px solid ${theme.palette.divider}`,
          background: (theme) =>
            alpha(theme.palette.background.paper, 0.9),
          boxShadow: (theme) =>
            theme.palette.mode === "dark"
              ? "0 20px 40px rgba(0,0,0,0.4)"
              : "0 20px 40px rgba(15,23,42,0.1)",
        }}
      >

        {/* Bouton Micro */}
        <Tooltip
          title={
            isSupported
              ? isRecording
                ? "Arrêter la dictée"
                : "Commencer la dictée"
              : "Dictée non supportée"
          }
        >
          <span>
            <IconButton
              color={isRecording ? "error" : "primary"}
              onClick={handleMicToggle}
              disabled={!isSupported}
              sx={{
                bgcolor: isRecording
                  ? alpha(theme.palette.error.main, 0.1)
                  : "transparent",
              }}
            >
              {isRecording ? <MicOffIcon /> : <MicIcon />}
            </IconButton>
          </span>
        </Tooltip>

        {/* Champ de texte */}
        <TextField
          fullWidth
          multiline
          maxRows={5}
          variant="standard"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          placeholder="Dictez ou écrivez votre analyse de trade ici..."
          InputProps={{
            disableUnderline: true,
            sx: {
              p: 1,
              fontSize: "1rem",
              fontFamily: theme.typography.fontFamily,
            },
          }}
        />

        {/* Bouton Envoyer */}
        <IconButton
          type="submit"
          color="primary"
          disabled={loading || !text.trim()}
          sx={{
            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.2),
            "&:hover": {
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.3),
            },
            "&:disabled": {
              bgcolor: (theme) => alpha(theme.palette.action.disabled, 0.1),
            },
          }}
        >
          {loading ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            <SendRoundedIcon />
          )}
        </IconButton>
      </Paper>
    </Box>
  );
};

export default ChatInputBar;
