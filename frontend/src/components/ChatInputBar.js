import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
// Imports ajoutés
import AnalyticsIcon from "@mui/icons-material/Analytics";
import ChatIcon from "@mui/icons-material/Chat";
import CheckIcon from "@mui/icons-material/Check";
import ShareIcon from "@mui/icons-material/Share";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import TuneIcon from "@mui/icons-material/Tune";
import {
  Box,
  CircularProgress,
  Divider,
  IconButton,
  ListItemIcon,
  ListItemText,
  // Composants de Menu ajoutés
  Menu,
  MenuItem,
  Paper,
  TextField,
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
// 'useState' est déjà importé, j'ajoute 'useMemo'
import { useEffect, useMemo, useState } from "react";
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
  discord: {
    label: "Message Discord",
    icon: <ChatIcon fontSize="small" />,
    description: "Préparer un post pour Discord (bientôt)",
    disabled: true,
  },
  twitter: {
    label: "Tweet Twitter",
    icon: <ShareIcon fontSize="small" />,
    description: "Rédiger un thread Twitter (bientôt)",
    disabled: true,
  },
};

/**
 * Barre d'input fixe en bas de page, style chatbot.
 * Gère le texte, la dictée vocale et la soumission.
 */
const ChatInputBar = ({
  onSend,
  loading,
  onSuggestionClick,
  // Nouvelles props pour gérer l'outil actif
  activeTool,
  onToolChange,
}) => {
  const theme = useTheme();
  const [text, setText] = useState("");

  // État pour le menu des outils
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const isMenuOpen = Boolean(menuAnchorEl);

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
    // 'activeTool' est déjà géré par le parent (NewEntry)
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

  // --- Nouveaux Handlers pour le menu Outils ---
  const handleToolsClick = (event) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleToolsClose = () => {
    setMenuAnchorEl(null);
  };

  const handleToolSelect = (toolKey) => {
    if (!TOOLS[toolKey].disabled) {
      onToolChange(toolKey);
    }
    handleToolsClose();
  };
  // --- Fin des nouveaux handlers ---

  // Ce hook permet au parent (NewEntry) de remplir le champ de texte
  useEffect(() => {
    if (onSuggestionClick) {
      onSuggestionClick.current = (suggestion) => {
        setText(suggestion);
      };
    }
  }, [onSuggestionClick]);

  // Récupère l'icône de l'outil actif pour l'afficher sur le bouton
  const ActiveToolIcon = useMemo(() => {
    return TOOLS[activeTool]?.icon || <TuneIcon />;
  }, [activeTool]);

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
        {/* --- NOUVEAU BOUTON OUTILS --- */}
        <Tooltip title={`Outil actif : ${TOOLS[activeTool]?.label || "Outils"}`}>
          <span>
            <IconButton
              color={activeTool === "trade" ? "secondary" : "primary"}
              onClick={handleToolsClick}
            >
              {ActiveToolIcon}
            </IconButton>
          </span>
        </Tooltip>
        {/* --- FIN NOUVEAU BOUTON OUTILS --- */}

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

      {/* --- NOUVEAU MENU OUTILS --- */}
      <Menu
        anchorEl={menuAnchorEl}
        open={isMenuOpen}
        onClose={handleToolsClose}
        anchorOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        PaperProps={{
          sx: {
            mb: 1, // Marge en dessous de l'ancre
            borderRadius: 3,
            border: (theme) => `1px solid ${theme.palette.divider}`,
            boxShadow: (theme) =>
              theme.palette.mode === "dark"
                ? "0 10px 30px rgba(0,0,0,0.4)"
                : "0 10px 30px rgba(15,23,42,0.1)",
          },
        }}
      >
        <Typography variant="overline" sx={{ px: 2, pt: 1, color: "text.secondary" }}>
          Outils
        </Typography>
        
        {/* Outils fonctionnels */}
        {Object.entries(TOOLS)
          .filter(([, tool]) => !tool.disabled)
          .map(([key, tool]) => (
            <MenuItem
              key={key}
              onClick={() => handleToolSelect(key)}
              selected={key === activeTool}
            >
              <ListItemIcon>
                {key === activeTool ? (
                  <CheckIcon fontSize="small" color="primary" />
                ) : (
                  tool.icon
                )}
              </ListItemIcon>
              <ListItemText
                primary={tool.label}
                secondary={tool.description}
                primaryTypographyProps={{ fontWeight: 600 }}
              />
            </MenuItem>
          ))}
          
        <Divider sx={{ my: 1 }} />
        
        {/* Outils non fonctionnels (désactivés) */}
        {Object.entries(TOOLS)
          .filter(([, tool]) => tool.disabled)
          .map(([key, tool]) => (
            <MenuItem
              key={key}
              onClick={() => handleToolSelect(key)}
              disabled={tool.disabled}
            >
              <ListItemIcon>{tool.icon}</ListItemIcon>
              <ListItemText
                primary={tool.label}
                secondary={tool.description}
              />
            </MenuItem>
          ))}
      </Menu>
      {/* --- FIN NOUVEAU MENU OUTILS --- */}
    </Box>
  );
};

export default ChatInputBar;