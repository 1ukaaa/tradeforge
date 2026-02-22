import {
  Box,
  Button,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  alpha,
  useTheme
} from "@mui/material";
import { NavLink, useLocation } from "react-router-dom";
import BrandLogo from "./BrandLogo";

// ─── Icons ────────────────────────────────────────────────────────
import CalculateRoundedIcon from "@mui/icons-material/CalculateRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import DashboardCustomizeRoundedIcon from "@mui/icons-material/DashboardCustomizeRounded";
import ForumRoundedIcon from "@mui/icons-material/ForumRounded";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import RocketLaunchRoundedIcon from "@mui/icons-material/RocketLaunchRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import TaskAltRoundedIcon from "@mui/icons-material/TaskAltRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import TwitterIcon from "@mui/icons-material/Twitter";

// ─── Nav Definitions ─────────────────────────────────────────────
const MAIN_NAV = [
  { to: "/", label: "Dashboard", icon: <InsightsRoundedIcon /> },
  { to: "/tradeforge-ai", label: "TradeForge AI", icon: <TaskAltRoundedIcon /> },
];

const WORKSPACE_NAV = [
  { to: "/journal", label: "Journal", icon: <DashboardCustomizeRoundedIcon /> },
  { to: "/investissements", label: "Investissements", icon: <TrendingUpRoundedIcon /> },
  { to: "/twitter", label: "Twitter Studio", icon: <TwitterIcon /> },
  { to: "/discord", label: "Discord Studio", icon: <ForumRoundedIcon /> },
  { to: "/calendar", label: "Calendrier", icon: <CalendarMonthRoundedIcon /> },
  { to: "/calculator", label: "Calculateur", icon: <CalculateRoundedIcon /> },
];

const SETTINGS_ITEM = {
  to: "/settings", label: "Atelier", icon: <SettingsRoundedIcon />,
};

// ─── Nav Item ────────────────────────────────────────────────────
const StyledNavItem = ({ to, label, icon, onNavigate = () => { } }) => {
  const location = useLocation();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const isActive =
    (to === "/" && location.pathname === "/") ||
    (to !== "/" && location.pathname.startsWith(to));

  const activeColor = isDark ? theme.palette.primary.main : theme.palette.secondary.main;

  return (
    <ListItem disablePadding sx={{ px: 1, py: 0.25 }}>
      <ListItemButton
        component={NavLink}
        to={to}
        end={to === "/"}
        selected={isActive}
        onClick={onNavigate}
        sx={{
          borderRadius: "10px",
          py: 1,
          px: 1.5,
          gap: 1.5,
          // Active state
          "&.Mui-selected": {
            backgroundColor: isDark
              ? alpha(theme.palette.primary.main, 0.10)
              : alpha(theme.palette.secondary.main, 0.10),
            "& .nav-icon": { color: activeColor },
            "& .nav-label": { color: activeColor, fontWeight: 700 },
          },
          "&.Mui-selected:hover": {
            backgroundColor: isDark
              ? alpha(theme.palette.primary.main, 0.16)
              : alpha(theme.palette.secondary.main, 0.16),
          },
          // Idle hover
          "&:hover:not(.Mui-selected)": {
            backgroundColor: isDark
              ? alpha("#FFFFFF", 0.05)
              : alpha("#0F172A", 0.05),
          },
        }}
      >
        <ListItemIcon
          className="nav-icon"
          sx={{
            minWidth: "auto",
            color: isActive
              ? activeColor
              : isDark
                ? alpha("#FFFFFF", 0.42)
                : alpha("#0F172A", 0.42),
            fontSize: 20,
            transition: "color 0.15s",
            "& svg": { fontSize: 20 },
          }}
        >
          {icon}
        </ListItemIcon>
        <ListItemText
          className="nav-label"
          primary={label}
          primaryTypographyProps={{
            fontSize: "0.88rem",
            fontWeight: isActive ? 700 : 500,
            color: isActive
              ? activeColor
              : isDark
                ? alpha("#FFFFFF", 0.75)
                : alpha("#0F172A", 0.75),
            letterSpacing: "0.01em",
            lineHeight: 1,
            transition: "color 0.15s, font-weight 0.15s",
          }}
        />
      </ListItemButton>
    </ListItem>
  );
};

// ─── Sidebar Section Header ──────────────────────────────────────
const NavSection = ({ label, children }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  return (
    <List
      component="nav"
      sx={{ px: 0, pt: 0.5 }}
      subheader={
        <ListSubheader
          disableSticky
          sx={{
            bgcolor: "transparent",
            color: isDark ? alpha("#FFFFFF", 0.25) : alpha("#0F172A", 0.35),
            fontSize: "0.62rem",
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            lineHeight: 2.8,
            px: 2.5,
          }}
        >
          {label}
        </ListSubheader>
      }
    >
      {children}
    </List>
  );
};

// ─── Main Sidebar Component ───────────────────────────────────────
const NavigationMenu = ({ onNavigate = () => { }, showBrand = true }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <Box
      component="aside"
      sx={{
        width: { xs: "100%", lg: 272 },
        flexShrink: 0,
        height: { xs: "100%", lg: "100vh" },
        position: { lg: "sticky" },
        top: 0,
        display: "flex",
        flexDirection: "column",

        // ── Unified background: same token as main bg, slightly elevated
        backgroundColor: isDark
          ? theme.palette.background.paper  // #16161C — slightly above #0E0E12
          : theme.palette.background.paper, // #FFFFFF — clean white on light bg

        borderRight: `1px solid ${theme.palette.divider}`,

        // Only box-shadow in dark mode for depth
        boxShadow: isDark
          ? "inset -1px 0 0 rgba(255,255,255,0.04)"
          : "inset -1px 0 0 rgba(15,23,42,0.06)",

        p: 2,
        pt: 2.5,
      }}
    >
      {/* Brand */}
      {showBrand && (
        <Box sx={{ px: 1, mb: 3 }}>
          <BrandLogo glyphSize={38} />
        </Box>
      )}

      {/* CTA */}
      <Box sx={{ px: 1, mb: 3 }}>
        <Button
          component={NavLink}
          to="/tradeforge-ai"
          variant="contained"
          color="secondary"
          startIcon={<RocketLaunchRoundedIcon sx={{ fontSize: 17 }} />}
          fullWidth
          onClick={onNavigate}
          sx={{
            py: 1.2,
            borderRadius: "10px",
            fontSize: "0.88rem",
            background: `linear-gradient(135deg, #4F8EF7 0%, #7B5CF6 100%)`,
            color: "#FFFFFF",
            boxShadow: `0 4px 18px ${alpha("#4F8EF7", 0.38)}`,
            "&:hover": {
              background: `linear-gradient(135deg, #3B7EF0 0%, #6B4CE6 100%)`,
              boxShadow: `0 6px 24px ${alpha("#4F8EF7", 0.5)}`,
              transform: "translateY(-1px)",
            },
            transition: "all 0.2s cubic-bezier(0.4,0,0.2,1)",
          }}
        >
          Nouvelle Séance
        </Button>
      </Box>

      {/* Main Nav */}
      <Box sx={{ flexGrow: 1, overflowY: "auto", overflowX: "hidden" }}>
        <List component="nav" sx={{ px: 0 }}>
          {MAIN_NAV.map((item) => (
            <StyledNavItem key={item.to} {...item} onNavigate={onNavigate} />
          ))}
        </List>

        <NavSection label="Espace de travail">
          {WORKSPACE_NAV.map((item) => (
            <StyledNavItem key={item.to} {...item} onNavigate={onNavigate} />
          ))}
        </NavSection>
      </Box>

      {/* Footer — Settings */}
      <Box>
        <Divider sx={{ mx: 1, mb: 1 }} />
        <List component="nav" sx={{ px: 0 }}>
          <StyledNavItem {...SETTINGS_ITEM} onNavigate={onNavigate} />
        </List>
      </Box>
    </Box>
  );
};

export default NavigationMenu;
