import MicIcon from "@mui/icons-material/Mic";
import StopIcon from "@mui/icons-material/Stop";
import { Box, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import { keyframes } from "@mui/material/styles";

const pulseRing = keyframes({
  "0%": { transform: "scale(1)", opacity: 0.45 },
  "55%": { transform: "scale(1.45)", opacity: 0 },
  "100%": { transform: "scale(1.45)", opacity: 0 },
});

const equalize = keyframes({
  "0%, 100%": { transform: "scaleY(0.6)" },
  "50%": { transform: "scaleY(1.4)" },
});

const SpeechControls = ({ isSupported, isRecording, onStart, onStop }) => {
  return (
    <Stack direction="row" alignItems="center" spacing={2}>
      <Tooltip title={isSupported ? "Dicter ton analyse" : "Web Speech API indisponible"}>
        <span>
          <Box
            sx={{
              position: "relative",
              display: "inline-flex",
              "&::before": isRecording
                ? {
                    content: '""',
                    position: "absolute",
                    inset: -16,
                    borderRadius: "50%",
                    background: "rgba(255,73,97,0.18)",
                    animation: `${pulseRing} 1.6s ease-out infinite`,
                    pointerEvents: "none",
                  }
                : undefined,
            }}
          >
            <IconButton
              color={isRecording ? "error" : "primary"}
              onClick={isRecording ? onStop : onStart}
              disabled={!isSupported}
              size="large"
              sx={{
                position: "relative",
                bgcolor: isRecording ? "rgba(255,73,97,0.22)" : "rgba(28,98,209,0.14)",
                borderRadius: 3,
                boxShadow: isRecording ? "0 18px 30px rgba(255,73,97,0.35)" : "0 14px 32px rgba(28,98,209,0.22)",
                transition: "transform 0.18s ease",
                transform: isRecording ? "scale(1.02)" : "scale(1)",
              }}
            >
              {isRecording ? <StopIcon /> : <MicIcon />}
            </IconButton>
            {isRecording && (
              <Box
                sx={{
                  position: "absolute",
                  inset: -6,
                  borderRadius: "50%",
                  border: "1px solid rgba(255,73,97,0.3)",
                  animation: `${pulseRing} 1.6s ease-out infinite`,
                  animationDelay: "0.4s",
                  pointerEvents: "none",
                }}
              />
            )}
          </Box>
        </span>
      </Tooltip>
      <Stack spacing={0.5}>
        <Stack direction="row" spacing={1} alignItems="center">
          {isRecording && (
            <Stack direction="row" spacing={0.5} alignItems="flex-end" sx={{ height: 14 }}>
              {["a", "b", "c", "d"].map((step, index) => (
                <Box
                  key={step}
                  sx={{
                    width: 3,
                    height: "100%",
                    borderRadius: 999,
                    bgcolor: "primary.main",
                    transformOrigin: "center bottom",
                    animation: `${equalize} 1s ease-in-out infinite`,
                    animationDelay: `${index * 0.12}s`,
                  }}
                />
              ))}
            </Stack>
          )}
          <Typography fontWeight={600}>
            {isRecording ? "Enregistrement en cours…" : "Dicter en français (FR)"}
          </Typography>
        </Stack>
        <Typography variant="caption" color="text.secondary">
          {isSupported ? "Appuie pour démarrer ou stopper la capture vocale." : "Active Chrome ou Edge pour profiter de la dictée."}
        </Typography>
      </Stack>
    </Stack>
  );
};

export default SpeechControls;
