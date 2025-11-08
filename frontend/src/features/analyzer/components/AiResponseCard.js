import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import DoneRoundedIcon from "@mui/icons-material/DoneRounded";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import { Alert, Box, Button, CircularProgress, IconButton, Paper, Stack, TextField, Tooltip, Typography } from "@mui/material";
import { useCallback, useEffect, useState } from "react";

const typeColor = (type) => {
  if (type === "trade") return "#FF8488";
  if (type === "analyse") return "#3CB179";
  return "#5A4BBA";
};

const AiResponseCard = ({
  detectedType,
  result,
  onReset,
  onSave,
  saving,
  saveError,
  saveSuccess,
  entryType,
}) => {
  const [copied, setCopied] = useState(false);
  const [editableResult, setEditableResult] = useState(result || "");

  useEffect(() => {
    setCopied(false);
  }, [result]);

  useEffect(() => {
    if (!copied) return undefined;
    const timeout = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(timeout);
  }, [copied]);

  useEffect(() => {
    setEditableResult(result || "");
  }, [result]);

  const handleCopy = useCallback(() => {
    if (!editableResult) return;

    const copyFromDom = () => {
      if (typeof document === "undefined") return;
      const textarea = document.createElement("textarea");
      textarea.value = editableResult;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "absolute";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    };

    const copyAsync = async () => {
      try {
        if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(editableResult);
        } else {
          copyFromDom();
        }
        setCopied(true);
      } catch {
        copyFromDom();
        setCopied(true);
      }
    };

    copyAsync();
  }, [editableResult]);

  if (!result) return null;

  const chipLabel = detectedType
    ? detectedType.charAt(0).toUpperCase() + detectedType.slice(1)
    : "Non détecté";
  const saveLabel = entryType === "trade" ? "Sauvegarder le trade" : "Sauvegarder l'analyse";
  const hasAlert = Boolean(saveError || saveSuccess);
  const isSaveDisabled = saving || !editableResult.trim();
  const helperText = entryType
    ? `Type enregistré : ${entryType === "trade" ? "Trade" : "Analyse"}`
    : "Le système ne détecte pas encore le type, le statut sera enregistré selon ton scénario.";

  return (
    <Paper
      elevation={0}
      sx={{
        mt: 4,
        p: { xs: 3, md: 4 },
        border: "1px solid rgba(39,58,150,0.12)",
        background: "linear-gradient(180deg,rgba(255,255,255,0.98) 0%,rgba(235,241,255,0.7) 100%)",
      }}
    >
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="flex-start">
        <Stack direction="row" spacing={2} alignItems="center" flex={1}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 3,
              display: "grid",
              placeItems: "center",
              bgcolor: "rgba(90,75,186,0.12)",
            }}
          >
            <CheckCircleIcon htmlColor={typeColor(detectedType)} />
          </Box>
          <Box>
            <Typography variant="overline" color="text.secondary">
              Classement IA
            </Typography>
            <Typography variant="h6" fontWeight={700} color={typeColor(detectedType)}>
              {chipLabel}
            </Typography>
          </Box>
        </Stack>
        <Stack direction="row" spacing={1} alignItems="center">
          <Button
            variant="contained"
            color="primary"
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : undefined}
            onClick={() => onSave(editableResult)}
            disabled={isSaveDisabled || !onSave}
            sx={{ px: 3, py: 1.8 }}
          >
            {saving ? "Enregistrement…" : saveLabel}
          </Button>
          <Tooltip title={copied ? "Analyse copiée" : "Copier l'analyse"}>
            <span>
              <IconButton
                color={copied ? "success" : "primary"}
                onClick={handleCopy}
                sx={{
                  bgcolor: copied ? "rgba(60,177,121,0.15)" : "rgba(39,58,150,0.12)",
                  borderRadius: 3,
                  boxShadow: copied ? "0 12px 24px rgba(60,177,121,0.22)" : "none",
                  transition: "all 0.2s ease",
                }}
              >
                {copied ? <DoneRoundedIcon /> : <ContentCopyRoundedIcon />}
              </IconButton>
            </span>
          </Tooltip>
          <Button variant="text" startIcon={<RestartAltIcon />} onClick={onReset}>
            Réinitialiser
          </Button>
        </Stack>
      </Stack>

      {hasAlert && (
        <Stack spacing={1} mt={2}>
          {saveSuccess && (
            <Alert severity="success" sx={{ borderRadius: 3 }}>
              {saveSuccess}
            </Alert>
          )}
          {saveError && (
            <Alert severity="error" sx={{ borderRadius: 3 }}>
              {saveError}
            </Alert>
          )}
        </Stack>
      )}

      <TextField
        value={editableResult}
        onChange={(event) => setEditableResult(event.target.value)}
        multiline
        minRows={12}
        fullWidth
        variant="filled"
        sx={{
          mt: 3,
          bgcolor: "rgba(15,27,61,0.04)",
          borderRadius: 3,
          "& .MuiFilledInput-root": {
            borderRadius: 3,
            fontFamily: `"JetBrains Mono","Fira Code",monospace`,
            fontSize: 16,
            lineHeight: 1.8,
          },
        }}
        helperText={helperText}
      />
    </Paper>
  );
};

export default AiResponseCard;
