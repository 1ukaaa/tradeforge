// frontend/src/pages/settings/SettingsAppearance.js
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import { Box, CardActionArea, Paper, Stack, SvgIcon, Typography, alpha } from "@mui/material";
import { ForgeCard } from "../../components/ForgeUI";
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
  return (
    <Paper
      variant="outlined"
      onClick={onClick}
      sx={{
        borderColor: selected ? "primary.main" : "divider",
        bgcolor: selected ? alpha("#3B82F6", 0.05) : "transparent",
        p: 1.5,
        width: 240,
        position: "relative",
      }}
    >
      <CardActionArea sx={{ borderRadius: 2 }}>
        {selected && (
          <CheckCircleIcon
            color="primary"
            sx={{ position: "absolute", top: 8, right: 8, zIndex: 2 }}
          />
        )}
        <Box
          sx={{
            borderRadius: 2,
            overflow: "hidden",
            border: "1px solid",
            borderColor: "divider",
            lineHeight: 0,
          }}
        >
          {illustration}
        </Box>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 1.5, pl: 0.5 }}>
          {icon}
          <Typography variant="h6" fontWeight={600}>
            {title}
          </Typography>
        </Stack>
      </CardActionArea>
    </Paper>
  );
};

const SettingsAppearance = () => {
  const { mode, setMode } = useThemeMode();

  return (
    <ForgeCard
      title="Apparence"
      subtitle="PRÉFÉRENCES"
      helper="Choisissez le thème par défaut de l'application."
    >
      <Stack direction="row" spacing={3} sx={{ flexWrap: "wrap" }}>
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
        {/* Note: La version "Système" n'est pas implémentée dans le ThemeContext.
            Elle peut être ajoutée plus tard en modifiant ThemeModeContext.js */}
      </Stack>
    </ForgeCard>
  );
};

export default SettingsAppearance;