import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import DashboardCustomizeRoundedIcon from "@mui/icons-material/DashboardCustomizeRounded";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import LiveTvRoundedIcon from "@mui/icons-material/LiveTvRounded";
import RocketLaunchRoundedIcon from "@mui/icons-material/RocketLaunchRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import TaskAltRoundedIcon from "@mui/icons-material/TaskAltRounded";
import { Box, Button, Chip, Divider, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { NavLink, useLocation } from "react-router-dom";
import BrandLogo from "./BrandLogo";

const NAV_SECTIONS = [
  {
    title: "Ateliers",
    subtitle: "Production quotidienne",
    items: [
      {
        to: "/",
        label: "Boîte noire IA",
        description: "Capture, dictée, structure instantanée",
        icon: <TaskAltRoundedIcon />,
        accent: "#74F6D6",
      },
      {
        to: "/journal",
        label: "Journal",
        description: "Replays, annotations, revues IA",
        icon: <DashboardCustomizeRoundedIcon />,
        accent: "#4AC9FF",
      },
    ],
  },
  {
    title: "Expansion",
    subtitle: "Vision long-terme",
    items: [
      {
        to: "/stats",
        label: "Dashboard performance",
        description: "RR, biais, sessions gagnantes",
        icon: <InsightsRoundedIcon />,
        accent: "#FF8A65",
        badge: "Bientôt",
      },
      {
        to: "/settings",
        label: "Atelier prompts",
        description: "Templates Gemini, variantes, exports",
        icon: <SettingsRoundedIcon />,
        accent: "#A18CFF",
      },
    ],
  },
];

const QUICK_ACTIONS = [
  { label: "Routine Londres", icon: <CalendarMonthRoundedIcon fontSize="small" />, to: "/journal" },
  { label: "Replay vidéo", icon: <LiveTvRoundedIcon fontSize="small" />, to: "/journal" },
];

const TIMELINE = [
  { title: "Brief IA", time: "07:15", status: "done" },
  { title: "Session Londres", time: "08:00", status: "live" },
  { title: "Revue US", time: "15:30", status: "upcoming" },
];

const NavigationTile = ({ item, active }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const accent = item.accent || "#74F6D6";
  const inactiveBg = isDark ? "rgba(255,255,255,0.02)" : "rgba(15,23,42,0.04)";
  const activeBg = isDark
    ? `linear-gradient(135deg, ${alpha(accent, 0.25)}, rgba(5,10,21,0.95))`
    : `linear-gradient(135deg, ${alpha(accent, 0.3)}, rgba(255,255,255,0.95))`;
  const borderColor = isDark ? alpha(accent, 0.5) : alpha(accent, 0.6);
  return (
    <Box
      component={NavLink}
      to={item.to}
      style={{ textDecoration: "none" }}
      sx={{
        position: "relative",
        borderRadius: 4,
        p: 2,
        display: "block",
        overflow: "hidden",
        background: active ? activeBg : inactiveBg,
        border: active
          ? `1px solid ${borderColor}`
          : `1px solid ${alpha(isDark ? "#FFFFFF" : "#0F1729", 0.1)}`,
        boxShadow: active
          ? isDark
            ? "0 35px 65px rgba(0,0,0,0.55)"
            : "0 30px 55px rgba(15,23,42,0.2)"
          : isDark
          ? "0 18px 40px rgba(0,0,0,0.4)"
          : "0 16px 32px rgba(15,23,42,0.12)",
        color: active ? accent : "text.secondary",
        transition: "all 0.3s ease",
        "&:hover": {
          borderColor: alpha(accent, 0.65),
          transform: "translateY(-2px)",
          boxShadow: "0 40px 70px rgba(0,0,0,0.6)",
        },
      }}
    >
      <Stack direction="row" spacing={1.5}>
        <Box
          sx={{
            width: 46,
            height: 46,
            borderRadius: 2,
            display: "grid",
            placeItems: "center",
            background: active
              ? `linear-gradient(135deg, ${accent}, ${alpha(accent, 0.4)})`
              : isDark
              ? "rgba(255,255,255,0.05)"
              : "rgba(15,23,42,0.08)",
            color: active ? (isDark ? "#05060A" : "#0F1729") : "text.secondary",
            boxShadow: active ? `0 18px 36px ${alpha(accent, 0.4)}` : "none",
          }}
        >
          {item.icon}
        </Box>
        <Stack spacing={0.2} flex={1}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="subtitle1" fontWeight={700} color={active ? accent : "text.primary"}>
              {item.label}
            </Typography>
            {item.badge && (
              <Chip
                label={item.badge}
                size="small"
                sx={{
                  height: 18,
                  borderRadius: 999,
                  fontSize: 10,
                  fontWeight: 700,
                  bgcolor: alpha(accent, 0.15),
                  color: accent,
                }}
              />
            )}
          </Stack>
          <Typography variant="caption" color={active ? alpha("#FFFFFF", 0.85) : "text.secondary"}>
            {item.description}
          </Typography>
        </Stack>
        <Box
          sx={{
            width: 5,
            borderRadius: 999,
            background: active ? accent : alpha(isDark ? "#FFFFFF" : "#0F1729", 0.1),
          }}
        />
      </Stack>
    </Box>
  );
};

const NavigationMenu = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const location = useLocation();
  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <Box
      sx={{
        width: { xs: "100%", lg: 320 },
        flexShrink: 0,
        position: { lg: "sticky" },
        top: { lg: 24 },
        alignSelf: "flex-start",
        maxHeight: { lg: "calc(100vh - 48px)" },
        overflowY: { lg: "auto" },
        pr: { lg: 1 },
        scrollbarWidth: "thin",
        "&::-webkit-scrollbar": { width: 6 },
        "&::-webkit-scrollbar-thumb": {
          background: isDark ? "rgba(255,255,255,0.25)" : "rgba(15,23,42,0.2)",
          borderRadius: 999,
        },
      }}
    >
      <Stack
        spacing={3}
        sx={{
          p: { xs: 2.5, lg: 3 },
          borderRadius: 4,
          border: `1px solid ${alpha(isDark ? "#FFFFFF" : "#0F1729", 0.08)}`,
          background: isDark
            ? "linear-gradient(150deg, rgba(4,10,24,0.95), rgba(12,18,36,0.9))"
            : "linear-gradient(150deg, rgba(255,255,255,0.96), rgba(237,241,255,0.95))",
          boxShadow: isDark ? "0 55px 95px rgba(0,0,0,0.65)" : "0 35px 70px rgba(15,23,42,0.18)",
        }}
      >
        <Stack
          spacing={1.5}
          sx={{
            p: 2,
            borderRadius: 4,
            position: "relative",
            overflow: "hidden",
            background: isDark
              ? "linear-gradient(135deg, rgba(5,96,146,0.6), rgba(3,9,22,0.92))"
              : "linear-gradient(135deg, rgba(116,246,214,0.25), rgba(255,255,255,0.95))",
            border: `1px solid ${alpha("#74F6D6", isDark ? 0.25 : 0.4)}`,
          }}
        >
          <Box
            sx={{
              position: "absolute",
              top: -60,
              right: -40,
              width: 200,
              height: 200,
              borderRadius: "50%",
              background: isDark
                ? "radial-gradient(circle, rgba(116,246,214,0.35), transparent 60%)"
                : "radial-gradient(circle, rgba(116,246,214,0.25), transparent 60%)",
              filter: "blur(6px)",
            }}
          />
          <BrandLogo glyphSize={52} />
          <Typography variant="caption" color="rgba(255,255,255,0.75)">
            Forge ton process. Une mission à la fois.
          </Typography>
          <Stack direction="row" spacing={2}>
            <Stack spacing={0.3}>
              <Typography variant="overline" letterSpacing="0.3em" color="rgba(255,255,255,0.6)">
                Discipline
              </Typography>
              <Typography variant="h5" color="#74F6D6">
                82%
              </Typography>
            </Stack>
            <Stack spacing={0.3}>
              <Typography variant="overline" letterSpacing="0.3em" color="rgba(255,255,255,0.6)">
                RR MOYEN
              </Typography>
              <Typography variant="h5" color="#4AC9FF">
                2.4R
              </Typography>
            </Stack>
          </Stack>
          <Button
            component={NavLink}
            to="/"
            variant="contained"
            color="primary"
            startIcon={<RocketLaunchRoundedIcon />}
            sx={{ alignSelf: "flex-start" }}
          >
            Nouvelle séance
          </Button>
        </Stack>

        {NAV_SECTIONS.map((section) => (
          <Stack key={section.title} spacing={1.5}>
            <Stack spacing={0.3}>
              <Typography variant="overline" color="text.secondary" letterSpacing="0.35em">
                {section.title}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {section.subtitle}
              </Typography>
            </Stack>
            <Stack spacing={1.5}>
              {section.items.map((item) => (
                <NavigationTile key={item.to} item={item} active={isActive(item.to)} />
              ))}
            </Stack>
          </Stack>
        ))}

        <Divider sx={{ borderColor: alpha(isDark ? "#FFFFFF" : "#0F1729", 0.08) }} />

        <Stack spacing={1.5}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="subtitle2" color="text.secondary">
              Rituels rapides
            </Typography>
            <Chip label="Live" size="small" sx={{ bgcolor: "rgba(255,138,101,0.15)", color: "#FF8A65" }} />
          </Stack>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {QUICK_ACTIONS.map((action) => (
              <Button
                key={action.label}
                size="small"
                component={NavLink}
                to={action.to}
                startIcon={action.icon}
                sx={{
                  borderRadius: 999,
                  bgcolor: isDark ? "rgba(255,255,255,0.04)" : "rgba(15,23,42,0.06)",
                  border: `1px solid ${alpha(isDark ? "#FFFFFF" : "#0F1729", 0.1)}`,
                }}
              >
                {action.label}
              </Button>
            ))}
          </Stack>
        </Stack>

        <Stack spacing={1}>
          <Typography variant="subtitle2" color="text.secondary">
            Cycle du jour
          </Typography>
          <Stack spacing={1.2}>
            {TIMELINE.map((step) => (
              <Stack
                key={step.title}
                direction="row"
                spacing={1.5}
                alignItems="center"
                sx={{
                  p: 1.2,
                  borderRadius: 3,
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.02)",
                }}
              >
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    background:
                      step.status === "done"
                        ? "linear-gradient(120deg,#74F6D6,#4AC9FF)"
                        : step.status === "live"
                        ? "linear-gradient(120deg,#FF8A65,#FF5E62)"
                        : "rgba(255,255,255,0.15)",
                    boxShadow:
                      step.status === "live" ? "0 0 12px rgba(255,94,98,0.6)" : "0 0 6px rgba(116,246,214,0.5)",
                  }}
                />
                <Stack spacing={0}>
                  <Typography variant="subtitle2" color="text.primary">
                    {step.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {step.time}
                  </Typography>
                </Stack>
              </Stack>
            ))}
          </Stack>
        </Stack>

        <Divider sx={{ borderColor: alpha(isDark ? "#FFFFFF" : "#0F1729", 0.08) }} />

        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
          <Stack spacing={0}>
            <Typography variant="subtitle2">Besoin d’aide ?</Typography>
            <Typography variant="caption" color="text.secondary">
              Accès concierge, revues en live.
            </Typography>
          </Stack>
          <Tooltip title="Contact support TradeForge">
            <IconButton
              component="a"
              href="mailto:support@tradeforge.app"
              sx={{
                borderRadius: 3,
                bgcolor: isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.08)",
                color: "#74F6D6",
                border: `1px solid ${alpha(isDark ? "#FFFFFF" : "#0F1729", 0.12)}`,
              }}
            >
              <RocketLaunchRoundedIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>
    </Box>
  );
};

export default NavigationMenu;
