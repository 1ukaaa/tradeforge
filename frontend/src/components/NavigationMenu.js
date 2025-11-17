import {
  Box,
  Button,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListSubheader,
  alpha,
  useTheme
} from "@mui/material";
import { NavLink, useLocation } from "react-router-dom";
import BrandLogo from "./BrandLogo";

// Icônes
import DashboardCustomizeRoundedIcon from "@mui/icons-material/DashboardCustomizeRounded";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import RocketLaunchRoundedIcon from "@mui/icons-material/RocketLaunchRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import TaskAltRoundedIcon from "@mui/icons-material/TaskAltRounded";
// 1. AJOUTER L'ICÔNE CALENDRIER
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import TwitterIcon from "@mui/icons-material/Twitter";
import ForumRoundedIcon from "@mui/icons-material/ForumRounded";
import { useThemeMode } from "../context/ThemeModeContext";

// Listes d'items séparées par groupes
const MAIN_NAV = [
  {
    to: "/home",
    label: "Home",
    icon: <HomeRoundedIcon />,
  },
  {
    to: "/",
    label: "TradeForge AI",
    icon: <TaskAltRoundedIcon />,
  },
];

const WORKSPACE_NAV = [
  {
    to: "/journal",
    label: "Journal",
    icon: <DashboardCustomizeRoundedIcon />,
  },
  {
    to: "/twitter",
    label: "Twitter Studio",
    icon: <TwitterIcon />,
  },
  {
    to: "/discord",
    label: "Discord Studio",
    icon: <ForumRoundedIcon />,
  },
  {
    to: "/dashboard",
    label: "Dashboard",
    icon: <InsightsRoundedIcon />,
  },
  // 2. AJOUTER LE NOUVEL ITEM
  {
    to: "/calendar",
    label: "Calendrier",
    icon: <CalendarMonthRoundedIcon />,
  },
];

const SETTINGS_ITEM = {
  to: "/settings",
  label: "Atelier",
  icon: <SettingsRoundedIcon />,
};

// ... le reste du fichier (StyledNavItem, NavigationMenu) reste identique ...
// ...
// (Le reste du fichier que vous m'avez fourni est inchangé)
// ...

const StyledNavItem = ({ to, label, icon }) => {
  const location = useLocation();
  const theme = useTheme();
  // [MODIFICATION] Récupérer le mode pour le hover
  const { mode } = useThemeMode();
  const isDark = mode === "dark";

  const isActive =
    (to === "/" && location.pathname === "/") ||
    (to !== "/" && location.pathname.startsWith(to));

  return (
    <ListItem disablePadding sx={{ px: 1.5, py: 0.5 }}>
      <ListItemButton
        component={NavLink}
        to={to}
        // [MODIFICATION] 'end' est crucial pour le lien "/"
        end={to === "/"}
        selected={isActive}
        sx={{
          borderRadius: 2,
          "&.Mui-selected": {
            backgroundColor: alpha(theme.palette.primary.main, 0.12),
            color: isDark
              ? theme.palette.primary.main
              : theme.palette.primary.dark, // Couleur plus foncée en mode clair
            "& .MuiListItemIcon-root": {
              color: isDark
                ? theme.palette.primary.main
                : theme.palette.primary.dark,
            },
          },
          "&.Mui-selected:hover": {
            backgroundColor: alpha(theme.palette.primary.main, 0.2),
          },
          // [MODIFICATION] Correction du hover pour le mode clair
          "&:hover": {
            backgroundColor: alpha(
              isDark ? theme.palette.common.white : theme.palette.common.black,
              0.05
            ),
          },
          "& .MuiListItemIcon-root": {
            minWidth: 40,
            color: theme.palette.text.secondary,
          },
          "& .MuiListItemText-primary": {
            fontWeight: 600,
            color: isActive ? undefined : theme.palette.text.primary,
          },
        }}
      >
        {icon}
        <ListItemText primary={label} />
      </ListItemButton>
    </ListItem>
  );
};

const NavigationMenu = () => {
  const theme = useTheme();
  // [MODIFICATION] Récupérer le mode pour le style de la Box
  const { mode } = useThemeMode();
  const isDark = mode === "dark";

  return (
    <Box
      component="aside" // Sémantiquement, c'est une barre latérale
      sx={{
        width: { xs: "100%", lg: 280 }, // Largeur fixe sur desktop
        flexShrink: 0,
        // [MODIFICATION] Suppression de 'position', 'top', 'alignSelf'
        // position: { lg: "sticky" },
        // top: { lg: 32 },
        // alignSelf: "flex-start",

        // [MODIFICATION] Prend toute la hauteur sur desktop
        height: { xs: "auto", lg: "100vh" },
        // maxHeight: { lg: "calc(100vh - 64px)" }, // Supprimé

        display: "flex",
        flexDirection: "column",
        p: { xs: 2, lg: 2 },
        // borderRadius: 4, // [MODIFICATION] Supprimé pour un look fixe

        // [MODIFICATION] Fond conditionnel pour le mode clair/sombre
        background: isDark
          ? "linear-gradient(150deg, rgba(4,10,24,0.95), rgba(12,18,36,0.9))"
          : theme.palette.background.paper, // Utilise le fond papier en mode clair

        // [MODIFICATION] Remplacement de 'border' par 'borderRight'
        borderRight: { lg: `1px solid ${theme.palette.divider}` },
        // border: `1px solid ${alpha("#FFFFFF", 0.08)}`, // Supprimé
        // boxShadow: "0 55px 95px rgba(0,0,0,0.65)", // [MODIFICATION] Supprimé pour un look fixe
        boxShadow: isDark
          ? "0 55px 95px rgba(0,0,0,0.65)"
          : { lg: "0 20px 50px rgba(15,23,42,0.1)" }, // Garde une ombre en mode clair
      }}
    >
      <Box sx={{ px: 1.5, mb: 2 }}>
        <BrandLogo glyphSize={40} />
      </Box>

      <Box sx={{ px: 1.5, mb: 2 }}>
        <Button
          component={NavLink}
          to="/"
          variant="contained"
          color="primary"
          startIcon={<RocketLaunchRoundedIcon />}
          fullWidth
          sx={{
            py: 1.2,
            fontSize: "0.95rem",
            // [MODIFICATION] Ombre conditionnelle
            boxShadow: (theme) =>
              isDark
                ? `0 10px 30px ${alpha(theme.palette.primary.main, 0.35)}`
                : `0 10px 25px ${alpha(theme.palette.primary.main, 0.25)}`,
          }}
        >
          Nouvelle Séance
        </Button>
      </Box>

      {/* 3. Navigation avec Groupes */}
      <Box sx={{ flexGrow: 1, overflowY: "auto" }}>
        <List component="nav" sx={{ px: 0 }}>
          {MAIN_NAV.map((item) => (
            <StyledNavItem
              key={item.label}
              to={item.to}
              label={item.label}
              icon={item.icon}
            />
          ))}
        </List>

        <List
          component="nav"
          sx={{ px: 0 }}
          subheader={
            <ListSubheader
              sx={{
                bgcolor: "transparent",
                color: theme.palette.text.secondary,
                fontSize: "0.7rem",
                fontWeight: 700,
                letterSpacing: "0.1em",
                lineHeight: 2.5,
              }}
            >
              ESPACE DE TRAVAIL
            </ListSubheader>
          }
        >
          {WORKSPACE_NAV.map((item) => (
            <StyledNavItem
              key={item.label}
              to={item.to}
              label={item.label}
              icon={item.icon}
            />
          ))}
        </List>
      </Box>

      {/* 4. Le Pied de Page (Settings) */}
      <Box>
        <Divider sx={{ mx: 2, my: 1 }} />
        <List component="nav" sx={{ px: 0 }}>
          <StyledNavItem
            to={SETTINGS_ITEM.to}
            label={SETTINGS_ITEM.label}
            icon={SETTINGS_ITEM.icon}
          />
        </List>
      </Box>
    </Box>
  );
};

export default NavigationMenu;
