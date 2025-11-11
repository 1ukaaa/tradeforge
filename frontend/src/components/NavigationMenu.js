import {
  Box,
  Button,
  Divider,
  IconButton,
  Stack,
  Tooltip,
  Typography,
  alpha,
  styled,
  useTheme,
} from "@mui/material";
import { NavLink, useLocation } from "react-router-dom";
import BrandLogo from "./BrandLogo";

// Icônes pour la nouvelle navigation
import DashboardCustomizeRoundedIcon from "@mui/icons-material/DashboardCustomizeRounded";
import HelpOutlineRoundedIcon from "@mui/icons-material/HelpOutlineRounded";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import RocketLaunchRoundedIcon from "@mui/icons-material/RocketLaunchRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import TaskAltRoundedIcon from "@mui/icons-material/TaskAltRounded";

// Définition claire des liens de navigation
const NAV_ITEMS = [
  {
    to: "/",
    label: "Boîte noire IA",
    icon: <TaskAltRoundedIcon />,
  },
  {
    to: "/journal",
    label: "Journal",
    icon: <DashboardCustomizeRoundedIcon />,
  },
  {
    to: "/stats",
    label: "Dashboard",
    icon: <InsightsRoundedIcon />,
  },
  {
    to: "/settings",
    label: "Atelier prompts",
    icon: <SettingsRoundedIcon />,
  },
];

// Création d'un composant de lien stylisé (NavLink)
// C'est le cœur du nouveau design : un bouton, pas une carte.
const StyledNavLink = styled(NavLink)(({ theme }) => ({
  ...theme.typography.button,
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-start",
  gap: theme.spacing(1.5),
  textDecoration: "none",
  padding: theme.spacing(1.2, 2),
  borderRadius: theme.shape.borderRadius / 1.5, // 12px
  color: theme.palette.text.secondary,
  border: "1px solid transparent",
  transition: "all 0.2s ease",
  fontWeight: 600,
  fontSize: "0.9rem",

  "& .MuiSvgIcon-root": {
    fontSize: "1.25rem",
    opacity: 0.7,
    transition: "all 0.2s ease",
  },

  "&:hover": {
    color: theme.palette.text.primary,
    background: alpha(theme.palette.primary.main, 0.08),
    "& .MuiSvgIcon-root": {
      opacity: 1,
    },
  },

  // Le style "actif" est le plus important
  "&.active": {
    color: theme.palette.primary.main,
    background: alpha(theme.palette.primary.main, 0.12),
    border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
    boxShadow: `0 0 15px ${alpha(theme.palette.primary.main, 0.2)}`, // Utilise le "glow" du thème
    "& .MuiSvgIcon-root": {
      opacity: 1,
      color: theme.palette.primary.main,
    },
  },
}));

// Le composant de menu principal
const NavigationMenu = () => {
  const theme = useTheme();
  const location = useLocation();
  const isDark = theme.palette.mode === "dark";

  return (
    <Box
      sx={{
        width: { xs: "100%", lg: 300 }, // Légèrement affiné
        flexShrink: 0,
        position: { lg: "sticky" },
        top: { lg: 32 }, // Aligné avec le padding de la page
        alignSelf: "flex-start",
        maxHeight: { lg: "calc(100vh - 64px)" }, // Marge en bas
        display: "flex",
        flexDirection: "column",
        p: { xs: 2, lg: 2.5 },
        borderRadius: 4, // 18px de votre thème
        border: `1px solid ${alpha(isDark ? "#FFFFFF" : "#0F1729", 0.08)}`,
        background: isDark
          ? "linear-gradient(150deg, rgba(4,10,24,0.95), rgba(12,18,36,0.9))"
          : "linear-gradient(150deg, rgba(255,255,255,0.96), rgba(237,241,255,0.95))",
        boxShadow: isDark ? "0 55px 95px rgba(0,0,0,0.65)" : "0 35px 70px rgba(15,23,42,0.18)",
      }}
    >
      {/* 1. Le Logo */}
      <Box sx={{ px: 1, mb: 2 }}>
        <BrandLogo glyphSize={44} />
      </Box>

      {/* 2. Le Bouton d'Action Principal */}
      <Button
        component={NavLink}
        to="/"
        variant="contained"
        color="primary"
        startIcon={<RocketLaunchRoundedIcon />}
        sx={{
          mb: 2.5,
          py: 1.5,
          fontSize: "1rem",
          // Utilisation du "glow" de votre thème pour le bouton principal
          boxShadow: (theme) => `0 10px 30px ${alpha(theme.palette.primary.main, 0.35)}`,
        }}
      >
        Nouvelle Séance
      </Button>

      {/* 3. La Navigation Principale */}
      <Stack component="nav" spacing={1} sx={{ flexGrow: 1 }}>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ letterSpacing: "0.2em", pl: 2, mb: 0.5 }}
        >
          ATELIERS
        </Typography>
        {NAV_ITEMS.map((item) => (
          <StyledNavLink
            key={item.label}
            to={item.to}
            // 'end' est crucial pour que le lien "/" ne soit pas actif tout le temps
            end={item.to === "/"}
            className={
              (item.to === "/" && location.pathname === "/") || (item.to !== "/" && location.pathname.startsWith(item.to))
                ? "active"
                : ""
            }
          >
            {item.icon}
            {item.label}
          </StyledNavLink>
        ))}
      </Stack>

      {/* 4. Le Pied de Page (Aide) */}
      <Divider sx={{ my: 2, borderColor: alpha(isDark ? "#FFFFFF" : "#0F1729", 0.08) }} />
      <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
        <Stack spacing={0}>
          <Typography variant="subtitle2">Besoin d’aide ?</Typography>
          <Typography variant="caption" color="text.secondary">
            Accès concierge & support.
          </Typography>
        </Stack>
        <Tooltip title="Contact support TradeForge">
          <IconButton
            component="a"
            href="mailto:support@tradeforge.app"
            sx={{
              borderRadius: 3,
              bgcolor: alpha(isDark ? "#FFFFFF" : "#0F1729", 0.08),
              color: "text.secondary",
              border: `1px solid ${alpha(isDark ? "#FFFFFF" : "#0F1729", 0.12)}`,
              "&:hover": {
                color: "primary.main",
              },
            }}
          >
            <HelpOutlineRoundedIcon />
          </IconButton>
        </Tooltip>
      </Stack>
    </Box>
  );
};

export default NavigationMenu;