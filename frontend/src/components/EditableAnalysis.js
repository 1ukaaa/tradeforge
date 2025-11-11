import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import DoneRoundedIcon from "@mui/icons-material/DoneRounded";
import SaveIcon from "@mui/icons-material/Save";
import { Alert, alpha, Autocomplete, Box, Button, Chip, CircularProgress, Divider, IconButton, Paper, Stack, TextField, Tooltip, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useCallback, useEffect, useState } from "react";
import BrandLogo from "./BrandLogo";

// Simule un rendu Markdown simple (identique à l'ancien AnalysisDisplay)
const SimpleMarkdownViewer = ({ content }) => {
  const blocks = content.split("\n").reduce((acc, line) => {
    const trimmed = line.trim();
    if (trimmed === "") {
      if (acc.length > 0 && acc[acc.length - 1].type !== "space") {
        acc.push({ type: "space", content: "" });
      }
    } else if (trimmed.match(/^(\d+\.|-|\*)\s/)) {
      if (acc.length > 0 && acc[acc.length - 1].type === "list") {
        acc[acc.length - 1].items.push(trimmed.replace(/^(\d+\.|-|\*)\s/, ""));
      } else {
        acc.push({
          type: "list",
          items: [trimmed.replace(/^(\d+\.|-|\*)\s/, "")],
        });
      }
    } else if (trimmed.match(/^(#+)\s/)) {
      acc.push({ type: "heading", content: trimmed.replace(/^(#+)\s/, "") });
    } else {
      if (acc.length > 0 && acc[acc.length - 1].type === "paragraph") {
        acc[acc.length - 1].content += " " + trimmed;
      } else {
        acc.push({ type: "paragraph", content: trimmed });
      }
    }
    return acc;
  }, []);

  return (
    <Stack spacing={1.5}>
      {blocks.map((block, index) => {
        if (block.type === "paragraph") {
          return (
            <Typography key={index} variant="body1" sx={{ fontFamily: `"JetBrains Mono","Fira Code",monospace`, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
              {block.content}
            </Typography>
          );
        }
        if (block.type === "heading") {
          return (
            <Typography key={index} variant="h6" sx={{ fontWeight: 600, mt: 2 }}>
              {block.content}
            </Typography>
          );
        }
        if (block.type === "list") {
          return (
            <Box component="ul" key={index} sx={{ pl: 3, m: 0 }}>
              {block.items.map((item, itemIndex) => (
                <Typography component="li" key={itemIndex} sx={{ fontFamily: `"JetBrains Mono","Fira Code",monospace`, lineHeight: 1.7 }}>
                  {item}
                </Typography>
              ))}
            </Box>
          );
        }
        return null;
      })}
    </Stack>
  );
};

/**
 * Affiche la réponse de l'IA ET les métadonnées éditables.
 * Remplace AnalysisDisplay.js
 */
const EditableAnalysis = ({
  content,
  initialMetadata, // Reçoit les métadonnées brutes de l'IA
  onSave, // Renvoie le 'content' et les 'metadata' finales
  saving,
  saveError,
  saveSuccess,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const [copied, setCopied] = useState(false);
  
  // État local pour les champs éditables
  const [editableMeta, setEditableMeta] = useState(initialMetadata || {});

  // Synchroniser l'état local si les métadonnées initiales changent
  useEffect(() => {
    setEditableMeta(initialMetadata || {});
  }, [initialMetadata]);

  useEffect(() => {
    setCopied(false);
  }, [content]);

  useEffect(() => {
    if (!copied) return undefined;
    const timeout = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(timeout);
  }, [copied]);

  const handleCopy = useCallback(() => {
    if (!content) return;
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true);
    });
  }, [content]);

  // Gérer les changements de champs
  const handleMetaChange = (field) => (event) => {
    setEditableMeta(prev => ({ ...prev, [field]: event.target.value }));
  };

  const handleTagsChange = (event, newValue) => {
    setEditableMeta(prev => ({
      ...prev,
      // Gère l'ajout de nouvelles étiquettes à la volée
      tags: newValue.map(value => (typeof value === 'string' ? value : value.inputValue)),
    }));
  };

  // Appeler onSave avec le contenu et les métadonnées finales
  const handleSaveClick = () => {
    onSave(content, editableMeta);
  };
  
  const allTags = editableMeta.tags || [];

  return (
    <Stack direction="row" spacing={2} sx={{ width: "100%" }}>
      {/* Avatar IA */}
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <BrandLogo glyphSize={24} showText={false} />
      </Box>

      {/* Bulle de Contenu */}
      <Paper
        sx={{
          p: { xs: 2, md: 3 },
          flex: 1,
          borderRadius: 4,
          borderTopLeftRadius: 0, // Style "bulle"
          background: isDark
            ? "linear-gradient(160deg, rgba(8,13,28,0.96) 0%, rgba(5,8,18,0.9) 100%)"
            : alpha(theme.palette.common.white, 0.7),
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: isDark
            ? "0 20px 40px rgba(0,0,0,0.4)"
            : "0 20px 40px rgba(15,23,42,0.1)",
        }}
      >
        <Stack spacing={2.5}>
          {/* 1. L'analyse texte (non éditable) */}
          <SimpleMarkdownViewer content={content} />
          
          <Divider />
          
          {/* 2. Le formulaire de métadonnées éditable */}
          <Stack spacing={2}>
            <Typography variant="overline" color="text.secondary">
              Valider les métadonnées
            </Typography>
            <TextField
              label="Titre de l'analyse"
              variant="outlined"
              size="small"
              fullWidth
              value={editableMeta.title || ""}
              onChange={handleMetaChange("title")}
            />
            <Stack direction={{xs: "column", sm: "row"}} spacing={2}>
              <TextField
                label="Symbole(s)"
                variant="outlined"
                size="small"
                value={editableMeta.symbol || ""}
                onChange={handleMetaChange("symbol")}
                sx={{flex: 1}}
              />
              <TextField
                label="Timeframe(s)"
                variant="outlined"
                size="small"
                value={editableMeta.timeframe || ""}
                onChange={handleMetaChange("timeframe")}
                sx={{flex: 1}}
              />
            </Stack>
            <Autocomplete
              multiple
              freeSolo // Permet d'ajouter des tags qui ne sont pas dans la liste
              options={[]} // On pourrait charger les tags existants ici
              value={allTags}
              onChange={handleTagsChange}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip variant="outlined" label={option} size="small" {...getTagProps({ index })} />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  variant="outlined"
                  label="Tags"
                  size="small"
                  placeholder="Ajouter des tags..."
                />
              )}
            />
          </Stack>

          <Divider />
          
          {/* 3. Les actions */}
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Tooltip title={copied ? "Copié !" : "Copier l'analyse"}>
              <IconButton onClick={handleCopy} size="small">
                {copied ? <DoneRoundedIcon fontSize="small" color="success" /> : <ContentCopyRoundedIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
            
            <Button
              variant="contained"
              color="primary"
              size="small"
              startIcon={
                saving ? (
                  <CircularProgress size={16} color="inherit" />
                ) : saveSuccess ? (
                  <CheckCircleIcon fontSize="small" />
                ) : (
                  <SaveIcon fontSize="small" />
                )
              }
              onClick={handleSaveClick} // Utilise le nouveau handler
              disabled={saving || !!saveSuccess}
              sx={{
                borderRadius: 99,
                bgcolor: saveSuccess ? "success.main" : "primary.main",
                "&:hover": {
                  bgcolor: saveSuccess ? "success.dark" : "primary.dark",
                }
              }}
            >
              {saving
                ? "Sauvegarde..."
                : saveSuccess
                ? "Enregistré !"
                : "Enregistrer au Journal"}
            </Button>
          </Stack>
          
          {/* Feedback de sauvegarde */}
          {saveError && (
            <Alert severity="error" sx={{ borderRadius: 2, mt: 1 }}>
              {saveError}
            </Alert>
          )}

        </Stack>
      </Paper>
    </Stack>
  );
};

export default EditableAnalysis;