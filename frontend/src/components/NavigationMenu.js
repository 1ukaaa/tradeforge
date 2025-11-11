import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import DashboardCustomizeRoundedIcon from "@mui/icons-material/DashboardCustomizeRounded";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import LiveTvRoundedIcon from "@mui/icons-material/LiveTvRounded";
import RocketLaunchRoundedIcon from "@mui/icons-material/RocketLaunchRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import TaskAltRoundedIcon from "@mui/icons-material/TaskAltRounded";
import {
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  LinearProgress,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { useMemo, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import BrandLogo from "./BrandLogo";

const NAV_LINKS = [
  {
    id: "capture",
    to: "/",
    label: "Flux capture IA",
    description: "Saisie guidée, dictée, comptes rendus instantanés",
    accent: "#4CC9F0",
    icon: <TaskAltRoundedIcon fontSize="small" />,
  },
  {
    id: "journal",
    to: "/journal",
    label: "Journal dynamique",
    description: "Replays commentés, zones d'attention, revues IA",
    accent: "#FF7B9C",
    icon: <DashboardCustomizeRoundedIcon fontSize="small" />,
  },
  {
    id: "stats",
    to: "/stats",
    label: "Lecture performance",
    description: "RR, biais comportementaux, sessions gagnantes",
    accent: "#5BE7A9",
    icon: <InsightsRoundedIcon fontSize="small" />,
    badge: "Bientôt",
  },
  {
    id: "prompts",
    to: "/settings",
    label: "Atelier prompts",
    description: "Templates Gemini, variantes, exports API",
    accent: "#B38BFF",
    icon: <SettingsRoundedIcon fontSize="small" />,
  },
];

const QUICK_ACTIONS = [
  {
    label: "Routine Londres",
    icon: <CalendarMonthRoundedIcon fontSize="small" />,
    to: "/journal",
  },
  {
    label: "Replay vidéo",
    icon: <LiveTvRoundedIcon fontSize="small" />,
    to: "/journal",
  },
  {
    label: "Brief express",
    icon: <RocketLaunchRoundedIcon fontSize="small" />,
    to: "/",
  },
];

const TIMELINE = [
  { title: "Brief IA", time: "07:15", status: "done" },
  { title: "Session Londres", time: "08:00", status: "live" },
  { title: "Revue US", time: "15:30", status: "upcoming" },
];

const METRICS = [
  { label: "Discipline", value: "82%", progress: 82 },
  { label: "RR moyen", value: "2.4R", progress: 48 },
  { label: "Sessions vertes", value: "67%" },
];

const VARIANT_META = {
  ribbon: {
    label: "Ribbon Stack",
    tagline: "Rubans verticaux, halo subtil et hiérarchie claire pour un pilotage instantané.",
  },
  focus: {
    label: "Focus Rail",
    tagline: "Colonne iconique et panneau contextuel pour naviguer en mode cockpit.",
  },
  command: {
    label: "Command Center",
    tagline: "Cartes fonctionnelles, métriques en surimpression, énergie atelier.",
  },
  minimal: {
    label: "Minimal Dock",
    tagline: "Palette neutre, respiration maximale, lecture ultra directe.",
  },
};

const VARIANT_ORDER = ["ribbon", "focus", "command", "minimal"];
const VARIANT_ACCENTS = {
  ribbon: "#4CC9F0",
  focus: "#FF7B9C",
  command: "#5BE7A9",
  minimal: "#1F2937",
};

const NavigationMenu = () => {
  const theme = useTheme();
  const location = useLocation();
  const isDark = theme.palette.mode === "dark";
  const [variant, setVariant] = useState("ribbon");

  const variantContent = useMemo(() => {
    switch (variant) {
      case "focus":
        return renderFocusRail({ isDark, location });
      case "command":
        return renderCommandCenter({ isDark, location });
      case "minimal":
        return renderMinimalDock({ isDark, location });
      case "ribbon":
      default:
        return renderRibbonStack({ isDark, location });
    }
  }, [variant, isDark, location]);

  return (
    <Box
      sx={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        borderRadius: 4,
        background: isDark
          ? "linear-gradient(160deg, #050914 0%, #0B1628 100%)"
          : "linear-gradient(160deg, #FFFFFF 0%, #F3F6FF 100%)",
        boxShadow: isDark
          ? "0 32px 80px rgba(0,0,0,0.65)"
          : "0 32px 65px rgba(15,23,42,0.18)",
        border: `1px solid ${alpha(isDark ? "#75E0FF" : "#1F2937", isDark ? 0.22 : 0.08)}`,
        overflow: "hidden",
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 3 }}>
        <Stack spacing={1}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <BrandLogo size={32} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Tradeforge cockpit
            </Typography>
          </Stack>
          <Typography
            variant="body2"
            sx={{
              color: alpha(isDark ? "#E6F4FF" : "#0F1729", 0.65),
              maxWidth: 420,
            }}
          >
            {VARIANT_META[variant].tagline}
          </Typography>
        </Stack>
        <ToggleButtonGroup
          color="primary"
          exclusive
          size="small"
          value={variant}
          onChange={(_, value) => {
            if (value) setVariant(value);
          }}
          sx={{
            backgroundColor: alpha(isDark ? "#1D2A40" : "#E5ECFF", 0.45),
            borderRadius: 999,
            p: 0.5,
          }}
        >
          {VARIANT_ORDER.map((key) => (
            <ToggleButton
              key={key}
              value={key}
              sx={{
                px: 2.5,
                textTransform: "none",
                border: "none",
                borderRadius: 999,
                color: alpha(isDark ? "#C7D7FF" : "#1F2A44", 0.7),
                "&.Mui-selected": {
                  color: isDark ? "#0B1628" : "#F8FAFF",
                  backgroundColor: key === "minimal"
                    ? alpha("#0F1729", isDark ? 0.65 : 0.85)
                    : alpha(VARIANT_ACCENTS[key], isDark ? 0.85 : 0.9),
                  boxShadow: "0 8px 20px rgba(15,23,42,0.22)",
                },
              }}
            >
              {VARIANT_META[key].label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Stack>
      <Divider sx={{ borderColor: alpha(isDark ? "#9EC8FF" : "#0F1729", 0.06) }} />
      <Box sx={{ flex: 1, overflowY: "auto" }}>{variantContent}</Box>
    </Box>
  );
};

const renderRibbonStack = ({ isDark, location }) => {
  return (
    <Stack spacing={4} sx={{ p: 3 }}>
      <Box
        sx={{
          borderRadius: 3,
          p: 3,
          background: isDark
            ? "linear-gradient(120deg, rgba(31,70,108,0.35), rgba(14,25,45,0.85))"
            : "linear-gradient(120deg, rgba(76,201,240,0.18), rgba(255,255,255,0.95))",
          border: `1px solid ${alpha("#4CC9F0", isDark ? 0.5 : 0.35)}`,
          boxShadow: isDark
            ? "0 28px 60px rgba(11,22,40,0.55)"
            : "0 24px 52px rgba(76,201,240,0.2)",
        }}
      >
        <Stack direction="row" spacing={3} alignItems="center">
          <Box
            sx={{
              borderRadius: 2,
              backgroundColor: alpha("#4CC9F0", 0.2),
              width: 48,
              height: 48,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#0B1628",
            }}
          >
            <RocketLaunchRoundedIcon />
          </Box>
          <Stack spacing={1}>
            <Typography variant="subtitle2" sx={{ color: alpha(isDark ? "#F3FAFF" : "#0F1729", 0.9) }}>
              Programme du jour
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Discipline + Exécution + Feedback
            </Typography>
            <Typography variant="body2" sx={{ color: alpha(isDark ? "#E6F4FF" : "#0F1729", 0.65) }}>
              Un ruban par atelier : capture tes insights, analyse les biais, pilote les prompts.
            </Typography>
          </Stack>
        </Stack>
        <Divider sx={{ my: 3, borderColor: alpha("#4CC9F0", 0.2) }} />
        <Stack direction="row" spacing={4}>
          {METRICS.map((metric) => (
            <Stack key={metric.label} spacing={1} sx={{ minWidth: 120 }}>
              <Typography variant="caption" sx={{ color: alpha(isDark ? "#E0F6FF" : "#0F1729", 0.65) }}>
                {metric.label}
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {metric.value}
              </Typography>
              {metric.progress && (
                <LinearProgress
                  variant="determinate"
                  value={metric.progress}
                  sx={{
                    height: 6,
                    borderRadius: 999,
                    backgroundColor: alpha("#4CC9F0", 0.2),
                    "& .MuiLinearProgress-bar": {
                      borderRadius: 999,
                      background: "linear-gradient(90deg,#4CC9F0,#38BDF8)",
                    },
                  }}
                />
              )}
            </Stack>
          ))}
        </Stack>
      </Box>
      <Stack spacing={3}>
        {NAV_LINKS.map((link) => {
          const active = location.pathname === link.to;
          return (
            <Stack
              key={link.id}
              direction="row"
              component={NavLink}
              to={link.to}
              spacing={3}
              sx={{
                textDecoration: "none",
                alignItems: "stretch",
                borderRadius: 3,
                overflow: "hidden",
                boxShadow: active
                  ? "0 24px 50px rgba(76,201,240,0.25)"
                  : "0 16px 38px rgba(15,23,42,0.12)",
                border: `1px solid ${alpha(link.accent, active ? 0.5 : 0.12)}`,
                background: active
                  ? `linear-gradient(100deg, ${alpha(link.accent, 0.25)}, rgba(12,23,45,0.92))`
                  : isDark
                  ? "rgba(10,18,32,0.85)"
                  : "rgba(255,255,255,0.92)",
                color: alpha(isDark ? "#F3FAFF" : "#0F1729", 0.85),
                transition: "all 0.25s ease",
                "&:hover": {
                  transform: "translateY(-4px)",
                  borderColor: alpha(link.accent, 0.5),
                  boxShadow: "0 32px 60px rgba(76,201,240,0.22)",
                },
              }}
            >
              <Box sx={{ width: 12, background: `linear-gradient(180deg,${link.accent},${alpha(link.accent, 0.2)})` }} />
              <Stack spacing={0.75} sx={{ py: 2.5 }}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 2,
                      backgroundColor: alpha(link.accent, 0.2),
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: isDark ? link.accent : "#0B1628",
                    }}
                  >
                    {link.icon}
                  </Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {link.label}
                  </Typography>
                  {link.badge && (
                    <Chip
                      label={link.badge}
                      size="small"
                      sx={{
                        borderRadius: 1,
                        backgroundColor: alpha(link.accent, 0.15),
                        color: link.accent,
                        border: `1px solid ${alpha(link.accent, 0.35)}`,
                      }}
                    />
                  )}
                </Stack>
                <Typography variant="body2" sx={{ color: alpha(isDark ? "#E6F4FF" : "#0F1729", 0.65) }}>
                  {link.description}
                </Typography>
              </Stack>
            </Stack>
          );
        })}
      </Stack>
      <SupportCard isDark={isDark} accent="#4CC9F0" />
    </Stack>
  );
};

const renderFocusRail = ({ isDark, location }) => {
  return (
    <Stack direction="row" sx={{ height: "100%" }}>
      <Stack
        spacing={2}
        alignItems="center"
        sx={{
          px: 2,
          py: 4,
          width: 96,
          background: isDark
            ? "linear-gradient(180deg,#150E1F,#231B33)"
            : "linear-gradient(180deg,#FFE3EC,#FFFFFF)",
          borderRight: `1px solid ${alpha(isDark ? "#FF7B9C" : "#3F1D38", 0.35)}`,
        }}
      >
        {NAV_LINKS.map((link) => {
          const active = location.pathname === link.to;
          return (
            <Tooltip key={link.id} title={link.label} placement="right" arrow>
              <IconButton
                component={NavLink}
                to={link.to}
                sx={{
                  width: 52,
                  height: 52,
                  borderRadius: 2,
                  backgroundColor: active
                    ? alpha(link.accent, 0.3)
                    : alpha(isDark ? "#FFFFFF" : "#1F2937", isDark ? 0.08 : 0.06),
                  color: active ? link.accent : alpha(isDark ? "#FFFFFF" : "#1F2937", 0.6),
                  border: active
                    ? `1px solid ${alpha(link.accent, 0.6)}`
                    : `1px solid ${alpha(isDark ? "#FFFFFF" : "#1F2937", 0.1)}`,
                  boxShadow: active ? `0 18px 28px ${alpha(link.accent, 0.35)}` : "none",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    backgroundColor: alpha(link.accent, 0.25),
                    color: link.accent,
                    borderColor: alpha(link.accent, 0.45),
                  },
                }}
              >
                {link.icon}
              </IconButton>
            </Tooltip>
          );
        })}
      </Stack>
      <Stack spacing={4} sx={{ flex: 1, p: 4 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={3} alignItems={{ md: "stretch" }}>
          <Box
            sx={{
              flex: 1,
              borderRadius: 3,
              p: 3,
              background: isDark
                ? "linear-gradient(140deg, rgba(255,123,156,0.2), rgba(24,12,32,0.85))"
                : "linear-gradient(140deg, rgba(255,123,156,0.18), rgba(255,255,255,0.9))",
              border: `1px solid ${alpha("#FF7B9C", isDark ? 0.55 : 0.35)}`,
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            <Typography variant="overline" sx={{ color: alpha("#FF7B9C", 0.9) }}>
              Focus actif
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              {activeLinkLabel(location.pathname)}
            </Typography>
            <Typography variant="body2" sx={{ color: alpha(isDark ? "#FFE9F1" : "#3F1D38", 0.7) }}>
              Optimise la séquence de ta session : rail iconique à gauche, contexte métier au centre,
              raccourcis critiques à droite.
            </Typography>
            <Stack direction="row" spacing={1.5} alignItems="center">
              {QUICK_ACTIONS.map((action) => (
                <Button
                  key={action.label}
                  component={NavLink}
                  to={action.to}
                  size="small"
                  startIcon={action.icon}
                  sx={{
                    borderRadius: 999,
                    textTransform: "none",
                    color: alpha(isDark ? "#FFE3EC" : "#3F1D38", 0.85),
                    backgroundColor: alpha("#FF7B9C", 0.15),
                    border: `1px solid ${alpha("#FF7B9C", 0.45)}`,
                    px: 2,
                    "&:hover": {
                      backgroundColor: alpha("#FF7B9C", 0.25),
                    },
                  }}
                >
                  {action.label}
                </Button>
              ))}
            </Stack>
          </Box>
          <Stack
            spacing={2}
            sx={{
              width: { md: 240 },
              borderRadius: 3,
              background: isDark ? "rgba(24,12,32,0.8)" : "rgba(255,255,255,0.92)",
              border: `1px solid ${alpha("#FF7B9C", isDark ? 0.4 : 0.25)}`,
              p: 3,
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Timeline live
            </Typography>
            <Stack spacing={2}>
              {TIMELINE.map((entry) => (
                <Stack key={entry.title} spacing={0.5}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {entry.title}
                    </Typography>
                    <Chip
                      label={entry.time}
                      size="small"
                      sx={{
                        borderRadius: 1,
                        backgroundColor: timelineColor(entry.status, isDark),
                        color: isDark ? "#150E1F" : "#3F1D38",
                        fontWeight: 600,
                      }}
                    />
                  </Stack>
                  <Box
                    sx={{
                      height: 4,
                      borderRadius: 999,
                      backgroundColor: alpha("#FF7B9C", entry.status === "live" ? 0.8 : 0.15),
                    }}
                  />
                </Stack>
              ))}
            </Stack>
          </Stack>
        </Stack>
        <Stack spacing={2}>
          {NAV_LINKS.map((link) => {
            const active = location.pathname === link.to;
            return (
              <Stack
                key={link.id}
                direction="row"
                spacing={3}
                alignItems="center"
                component={NavLink}
                to={link.to}
                sx={{
                  textDecoration: "none",
                  borderRadius: 3,
                  border: `1px solid ${alpha(link.accent, active ? 0.5 : 0.12)}`,
                  backgroundColor: active
                    ? alpha(link.accent, 0.15)
                    : alpha(isDark ? "#FFFFFF" : "#1F2937", isDark ? 0.05 : 0.03),
                  color: alpha(isDark ? "#FFFFFF" : "#1F2937", 0.85),
                  px: 3,
                  py: 2.5,
                  transition: "all 0.2s ease",
                  "&:hover": {
                    backgroundColor: alpha(link.accent, 0.18),
                    transform: "translateX(6px)",
                  },
                }}
              >
                <Stack spacing={0.5}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {link.label}
                  </Typography>
                  <Typography variant="body2" sx={{ color: alpha(isDark ? "#FFE3EC" : "#3F1D38", 0.65) }}>
                    {link.description}
                  </Typography>
                </Stack>
                <Box sx={{ flex: 1 }} />
                <Typography variant="body2" sx={{ color: alpha(link.accent, 0.9), fontWeight: 600 }}>
                  Explorer
                </Typography>
              </Stack>
            );
          })}
        </Stack>
        <SupportCard isDark={isDark} accent="#FF7B9C" horizontal />
      </Stack>
    </Stack>
  );
};

const renderCommandCenter = ({ isDark, location }) => {
  return (
    <Stack spacing={3} sx={{ p: 3 }}>
      <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
        <Box
          sx={{
            flex: 1,
            borderRadius: 3,
            p: 3,
            background: isDark
              ? "linear-gradient(125deg, rgba(31,73,61,0.35), rgba(9,21,18,0.85))"
              : "linear-gradient(125deg, rgba(91,231,169,0.2), rgba(255,255,255,0.95))",
            border: `1px solid ${alpha("#5BE7A9", isDark ? 0.5 : 0.35)}`,
            boxShadow: isDark
              ? "0 26px 55px rgba(9,21,18,0.5)"
              : "0 26px 55px rgba(91,231,169,0.25)",
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack spacing={0.5}>
              <Typography variant="overline" sx={{ color: alpha("#5BE7A9", 0.9) }}>
                Brief métrique
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                Pipeline opérationnel
              </Typography>
            </Stack>
            <Avatar
              sx={{
                width: 52,
                height: 52,
                background: `linear-gradient(140deg,#5BE7A9,#34D399)`,
                color: "#041F1A",
                fontWeight: 600,
              }}
            >
              TF
            </Avatar>
          </Stack>
          <Divider sx={{ my: 3, borderColor: alpha("#5BE7A9", 0.35) }} />
          <Stack spacing={2}>
            {METRICS.map((metric) => (
              <Stack key={metric.label} direction="row" alignItems="center" spacing={2}>
                <Box sx={{ width: 160 }}>
                  <Typography variant="caption" sx={{ color: alpha(isDark ? "#DDF7EA" : "#0F1729", 0.65) }}>
                    {metric.label}
                  </Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {metric.value}
                  </Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={metric.progress ?? 100}
                    sx={{
                      height: 8,
                      borderRadius: 999,
                      backgroundColor: alpha("#5BE7A9", 0.2),
                      "& .MuiLinearProgress-bar": {
                        borderRadius: 999,
                        background: "linear-gradient(90deg,#5BE7A9,#34D399)",
                      },
                    }}
                  />
                </Box>
              </Stack>
            ))}
          </Stack>
        </Box>
        <Stack
          spacing={2}
          sx={{
            width: { md: 260 },
            borderRadius: 3,
            p: 3,
            background: isDark ? "rgba(9,21,18,0.8)" : "rgba(255,255,255,0.9)",
            border: `1px solid ${alpha("#5BE7A9", isDark ? 0.45 : 0.25)}`,
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            Actions rapides
          </Typography>
          <Stack spacing={1.5}>
            {QUICK_ACTIONS.map((action) => (
              <Button
                key={action.label}
                component={NavLink}
                to={action.to}
                startIcon={action.icon}
                sx={{
                  justifyContent: "flex-start",
                  borderRadius: 2,
                  textTransform: "none",
                  color: alpha(isDark ? "#DDF7EA" : "#0F1729", 0.85),
                  backgroundColor: alpha("#5BE7A9", 0.18),
                  border: `1px solid ${alpha("#5BE7A9", 0.4)}`,
                  "&:hover": {
                    backgroundColor: alpha("#5BE7A9", 0.28),
                  },
                }}
              >
                {action.label}
              </Button>
            ))}
          </Stack>
          <Divider sx={{ borderColor: alpha("#5BE7A9", 0.2) }} />
          <Typography variant="caption" sx={{ color: alpha(isDark ? "#DDF7EA" : "#0F1729", 0.6) }}>
            Une commande = un objectif : déclenche un replay, synchronise le journal ou ouvre les prompts.
          </Typography>
        </Stack>
      </Stack>
      <Stack spacing={3}>
        <Box
          sx={{
            display: "grid",
            gap: 24,
            gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
          }}
        >
          {NAV_LINKS.map((link) => {
            const active = location.pathname === link.to;
            return (
              <Box
                key={link.id}
                component={NavLink}
                to={link.to}
                sx={{
                  textDecoration: "none",
                  borderRadius: 3,
                  p: 3,
                  minHeight: 160,
                  background: active
                    ? `linear-gradient(135deg, ${alpha(link.accent, 0.3)}, rgba(9,21,18,0.9))`
                    : isDark
                    ? "rgba(9,21,18,0.8)"
                    : "rgba(255,255,255,0.92)",
                  border: `1px solid ${alpha(link.accent, active ? 0.55 : 0.2)}`,
                  boxShadow: active
                    ? `0 32px 60px ${alpha(link.accent, 0.25)}`
                    : "0 18px 40px rgba(15,23,42,0.12)",
                  color: alpha(isDark ? "#DDF7EA" : "#0F1729", 0.88),
                  transition: "all 0.2s ease",
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                  "&:hover": {
                    transform: "translateY(-6px)",
                    borderColor: alpha(link.accent, 0.55),
                  },
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: 2,
                      background: alpha(link.accent, 0.18),
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: link.accent,
                    }}
                  >
                    {link.icon}
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {link.label}
                  </Typography>
                </Stack>
                <Typography variant="body2" sx={{ color: alpha(isDark ? "#DDF7EA" : "#0F1729", 0.6) }}>
                  {link.description}
                </Typography>
                <Stack direction="row" spacing={1}>
                  <Chip
                    label="Cockpit"
                    size="small"
                    sx={{
                      borderRadius: 1,
                      backgroundColor: alpha(link.accent, 0.16),
                      color: alpha(link.accent, 0.95),
                    }}
                  />
                  {link.badge && (
                    <Chip
                      label={link.badge}
                      size="small"
                      sx={{
                        borderRadius: 1,
                        backgroundColor: alpha(link.accent, 0.12),
                        color: link.accent,
                      }}
                    />
                  )}
                </Stack>
              </Box>
            );
          })}
        </Box>
        <SupportCard isDark={isDark} accent="#5BE7A9" dense />
      </Stack>
    </Stack>
  );
};

const renderMinimalDock = ({ isDark, location }) => {
  return (
    <Stack spacing={3} sx={{ p: 3, height: "100%" }}>
      <Box
        sx={{
          borderRadius: 3,
          p: 3,
          background: isDark ? "rgba(12,16,24,0.9)" : "rgba(248,249,252,0.95)",
          border: `1px solid ${alpha("#1F2937", isDark ? 0.4 : 0.12)}`,
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          Mode minimal dock
        </Typography>
        <Typography variant="body2" sx={{ color: alpha(isDark ? "#FFFFFF" : "#1F2937", 0.6), mt: 1 }}>
          Ligne claire, contraste contenu, confort visuel. La navigation devient un simple dock
          latéral.
        </Typography>
      </Box>
      <Stack spacing={1.5}>
        {NAV_LINKS.map((link) => {
          const active = location.pathname === link.to;
          return (
            <Stack
              key={link.id}
              direction="row"
              alignItems="center"
              spacing={2}
              component={NavLink}
              to={link.to}
              sx={{
                textDecoration: "none",
                borderRadius: 2,
                px: 2.5,
                py: 1.75,
                backgroundColor: active
                  ? alpha("#1F2937", 0.85)
                  : alpha(isDark ? "#FFFFFF" : "#1F2937", isDark ? 0.08 : 0.04),
                color: active ? "#F8FAFF" : alpha(isDark ? "#FFFFFF" : "#1F2937", 0.75),
                border: `1px solid ${alpha("#1F2937", active ? 0.45 : 0.12)}`,
                transition: "all 0.18s ease",
                "&:hover": {
                  backgroundColor: active
                    ? alpha("#1F2937", 0.92)
                    : alpha(isDark ? "#FFFFFF" : "#1F2937", isDark ? 0.12 : 0.08),
                },
              }}
            >
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 1.5,
                  backgroundColor: active ? alpha("#FFFFFF", 0.12) : alpha("#1F2937", 0.08),
                  color: active ? "#F8FAFF" : alpha("#1F2937", 0.65),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {link.icon}
              </Box>
              <Stack spacing={0.25}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {link.label}
                </Typography>
                <Typography variant="caption" sx={{ color: alpha(isDark ? "#FFFFFF" : "#1F2937", 0.55) }}>
                  {link.description}
                </Typography>
              </Stack>
              <Box sx={{ flex: 1 }} />
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  backgroundColor: active ? alpha("#F8FAFF", 0.9) : alpha("#1F2937", 0.25),
                }}
              />
            </Stack>
          );
        })}
      </Stack>
      <Box sx={{ flex: 1 }} />
      <SupportCard isDark={isDark} accent="#1F2937" minimal />
    </Stack>
  );
};

const SupportCard = ({ isDark, accent, horizontal, dense, minimal }) => {
  return (
    <Box
      sx={{
        borderRadius: 3,
        p: dense ? 2.5 : 3,
        background: minimal
          ? isDark
            ? "rgba(12,16,24,0.88)"
            : "rgba(248,249,252,0.92)"
          : isDark
          ? alpha(accent, 0.16)
          : alpha(accent, 0.12),
        border: `1px solid ${alpha(accent, minimal ? 0.28 : 0.45)}`,
        display: "flex",
        flexDirection: horizontal ? "row" : "column",
        alignItems: horizontal ? "center" : "flex-start",
        gap: horizontal ? 24 : 16,
      }}
    >
      <Box
        sx={{
          width: 48,
          height: 48,
          borderRadius: 2,
          background: alpha(accent, 0.15),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: accent,
        }}
      >
        <LiveTvRoundedIcon />
      </Box>
      <Stack spacing={0.75}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          Besoin d'un débrief en direct ?
        </Typography>
        <Typography variant="body2" sx={{ color: alpha(isDark ? "#FFFFFF" : "#0F1729", 0.65) }}>
          Réserve un coaching flash : 15 minutes pour faire le point sur ta session et ajuster tes prompts.
        </Typography>
        <Button
          size="small"
          sx={{
            alignSelf: horizontal ? "flex-start" : undefined,
            borderRadius: 999,
            textTransform: "none",
            px: 2.5,
            color: isDark ? "#0B1628" : "#FFFFFF",
            background: isDark
              ? "#FFFFFF"
              : `linear-gradient(135deg, ${accent}, ${alpha(accent, 0.6)})`,
            "&:hover": {
              background: isDark ? alpha("#FFFFFF", 0.9) : alpha(accent, 0.85),
            },
          }}
        >
          Planifier un call
        </Button>
      </Stack>
    </Box>
  );
};

const activeLinkLabel = (pathname) => {
  const current = NAV_LINKS.find((link) => link.to === pathname) ?? NAV_LINKS[0];
  return current.label;
};

const timelineColor = (status, isDark) => {
  switch (status) {
    case "done":
      return alpha(isDark ? "#FFFFFF" : "#3F1D38", 0.25);
    case "live":
      return alpha("#FF7B9C", 0.75);
    case "upcoming":
    default:
      return alpha(isDark ? "#FFFFFF" : "#3F1D38", 0.15);
  }
};

export default NavigationMenu;
