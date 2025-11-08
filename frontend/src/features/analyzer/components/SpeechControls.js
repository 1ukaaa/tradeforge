import MicIcon from "@mui/icons-material/Mic";
import StopIcon from "@mui/icons-material/Stop";
import { Chip, IconButton, Stack, Tooltip, Typography } from "@mui/material";

const SpeechControls = ({ isSupported, isRecording, onStart, onStop }) => {
  return (
    <Stack direction="row" alignItems="center" spacing={2}>
      <Tooltip title={isSupported ? "Dicter ton analyse" : "Web Speech API indisponible"}>
        <span>
          <IconButton
            color={isRecording ? "error" : "primary"}
            onClick={isRecording ? onStop : onStart}
            disabled={!isSupported}
            size="large"
            sx={{
              bgcolor: isRecording ? "rgba(255,73,97,0.16)" : "rgba(28,98,209,0.12)",
              borderRadius: 3,
              boxShadow: "0 14px 32px rgba(28,98,209,0.25)",
            }}
          >
            {isRecording ? <StopIcon /> : <MicIcon />}
          </IconButton>
        </span>
      </Tooltip>
      <Stack spacing={0.5}>
        <Typography fontWeight={600}>
          {isRecording ? "Enregistrement en cours…" : "Dicter en français (FR)"}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {isSupported ? "Appuie pour démarrer ou stopper la capture vocale." : "Active Chrome ou Edge pour profiter de la dictée."}
        </Typography>
      </Stack>
      {isRecording && (
        <Chip
          label="Auto-restart activé"
          color="primary"
          size="small"
          sx={{ fontWeight: 600 }}
        />
      )}
    </Stack>
  );
};

export default SpeechControls;
