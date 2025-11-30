import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import { Box, Paper, Stack, SvgIcon, Typography, alpha, useTheme } from "@mui/material";
import { useThemeMode } from "../../context/ThemeModeContext";

// Simple SVG pour la carte "Dark"
const DarkModeIllustration = () => (
  <SvgIcon viewBox="0 0 160 90" sx={{ width: "100%", height: "auto", display: "block" }}>
    <rect width="160" height="90" rx="8" fill="#0A0A0F" />
    <rect x="12" y="10" width="98" height="70" rx="4" fill="#1E1E24" />
    <rect x="118" y="10" width="30" height="28" rx="4" fill="#1E1E24" />
    <rect x="118" y="42" width="30" height="38" rx="4" fill="#1E1E24" />
    <rect x="16" y="16" width="60" height="6" rx="2" fill="#2A2A32" />
    <rect x="16" y="26" width="70" height="4" rx="2" fill="#2A2A32" />
    <rect x="16" y="34" width="65" height="4" rx="2" fill="#2A2A32" />
  </SvgIcon>
);

// Simple SVG pour la carte "Light"
const LightModeIllustration = () => (
  <SvgIcon viewBox="0 0 160 90" sx={{ width: "100%", height: "auto", display: "block" }}>
    <rect width="160" height="90" rx="8" fill="#F7F8FA" />
    <rect x="12" y="10" width="98" height="70" rx="4" fill="#FFFFFF" />
    <rect x="118" y="10" width="30" height="28" rx="4" fill="#FFFFFF" />
    <rect x="118" y="42" width="30" height="38" rx="4" fill="#FFFFFF" />
    <rect x="16" y="16" width="60" height="6" rx="2" fill="#E0E0E0" />
    <rect x="16" y="26" width="70" height="4" rx="2" fill="#E0E0E0" />
    <rect x="16" y="34" width="65" height="4" rx="2" fill="#E0E0E0" />
  </SvgIcon>
);

const ThemeCard = ({ title, icon, illustration, selected, onClick }) => {
  const theme = useTheme();
  return (
    <Paper
      variant="outlined"
      onClick={onClick}
      sx={{
        borderColor: selected ? "primary.main" : "divider",
        bgcolor: selected ? alpha(theme.palette.primary.main, 0.05) : "transparent",
        borderWidth: selected ? 2 : 1,
        p: 2,
        width: 240,
        position: "relative",
        cursor: 'pointer',
        transition: 'all 0.2s',
        '&:hover': {
          borderColor: 'primary.main',
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[4]
        }
      }}
    >
      {selected && (
        <CheckCircleIcon
          color="primary"
          sx={{ position: "absolute", top: -10, right: -10, zIndex: 2, bgcolor: 'background.paper', borderRadius: '50%' }}
        />
      )}
      <Box
        sx={{
          borderRadius: 2,
          overflow: "hidden",
          border: "1px solid",
          borderColor: "divider",
          lineHeight: 0,
          mb: 2
        }}
      >
        {illustration}
      </Box>
      <Stack direction="row" spacing={1.5} alignItems="center">
        {icon}
        <Typography variant="h6" fontWeight={700}>
          {title}
        </Typography>
      </Stack>
    </Paper>
  );
};

const SettingsAppearance = () => {
  const theme = useTheme();
  const { mode, setMode } = useThemeMode();

  return (
    <Paper
      elevation={0}
      sx={{
        p: 4,
        borderRadius: 3,
        border: `1px solid ${theme.palette.divider}`,
        bgcolor: alpha(theme.palette.background.paper, 0.4),
        backdropFilter: "blur(10px)",
      }}
    >
      <Box mb={4}>
        <Typography variant="overline" fontWeight={700} color="primary" sx={{ letterSpacing: 1.2 }}>
          PRÉFÉRENCES
        </Typography>
        <Typography variant="h6" fontWeight={700}>
          Thème de l'interface
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, maxWidth: 600 }}>
          Choisissez l'apparence de TradeForge. Le thème sombre est recommandé pour les sessions de trading nocturnes.
        </Typography>
      </Box>

      <Stack direction="row" spacing={3} sx={{ flexWrap: "wrap", gap: 2 }}>
        <ThemeCard
          title="Clair"
          icon={<LightModeIcon />}
          illustration={<LightModeIllustration />}
          selected={mode === "light"}
          onClick={() => setMode("light")}
        />
        <ThemeCard
          title="Sombre"
          icon={<DarkModeIcon />}
          illustration={<DarkModeIllustration />}
          selected={mode === "dark"}
          onClick={() => setMode("dark")}
        />
      </Stack>
    </Paper>
  );
};

export default SettingsAppearance;