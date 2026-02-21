import { alpha, createTheme } from "@mui/material/styles";

// ─────────────────────────────────────────────────────────────────────────────
// 1. PALETTE TOKENS — Single source of truth for every colour in the app
// ─────────────────────────────────────────────────────────────────────────────
const tokens = {
  // Dark palette
  dark: {
    bg: "#0E0E12",   // page background — unified across sidebar & content
    surface: "#16161C",   // slightly elevated surfaces (cards, panels)
    elevated: "#1C1C24",   // 2nd level elevation (hover states, tooltips)
    border: "rgba(255,255,255,0.07)",
    borderHov: "rgba(255,255,255,0.14)",
  },
  // Light palette
  light: {
    bg: "#F0F2F7",   // soft blue-grey page background
    surface: "#FFFFFF",   // clean white cards
    elevated: "#F7F9FC",   // slight hover elevation
    border: "rgba(15,23,42,0.09)",
    borderHov: "rgba(15,23,42,0.18)",
  },
  // Dark-mode neon accents (fluorescent — only work on dark backgrounds)
  neonGreen: "#00FF66",
  neonRed: "#FF2D55",
  // Light-mode semantic accents (rich, readable on white — non-fluorescent)
  lightPositive: "#0F766E",  // deep teal  — gain/profit
  lightNegative: "#9F1239",  // rose-cardinal — loss/negative
  // Shared
  accentBlue: "#4F8EF7",
  white: "#FFFFFF",
  nearBlack: "#0E0E12",
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. TYPOGRAPHY
// ─────────────────────────────────────────────────────────────────────────────
const baseTypography = {
  fontFamily: `"Inter", "Space Grotesk", "Segoe UI", sans-serif`,
  mono: `"JetBrains Mono", "SF Mono", "Fira Code", monospace`,
  button: { fontWeight: 600, textTransform: "none", letterSpacing: "0.02em" },
  h1: { fontWeight: 700, letterSpacing: "-0.03em" },
  h2: { fontWeight: 700, letterSpacing: "-0.025em" },
  h3: { fontWeight: 600, letterSpacing: "-0.02em" },
  h4: { fontWeight: 600, letterSpacing: "-0.015em" },
  h5: { fontWeight: 600 },
  h6: { fontWeight: 600 },
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. THEME FACTORY
// ─────────────────────────────────────────────────────────────────────────────
const createForgeTheme = (mode = "dark") => {
  const isDark = mode === "dark";
  const t = isDark ? tokens.dark : tokens.light;

  const palette = {
    mode,
    primary: {
      // Dark: white pill / Light: blue pill
      main: isDark ? tokens.white : tokens.accentBlue,
      contrastText: isDark ? tokens.nearBlack : tokens.white,
    },
    secondary: {
      main: tokens.accentBlue,
      contrastText: tokens.white,
    },
    // Positive/negative semantic colours differ per mode
    success: {
      main: isDark ? tokens.neonGreen : tokens.lightPositive,
    },
    error: {
      main: isDark ? tokens.neonRed : tokens.lightNegative,
      light: isDark ? "#FF6B87" : "#BE185D",
    },
    background: {
      default: t.bg,
      paper: t.surface,
    },
    text: {
      primary: isDark ? "rgba(255,255,255,0.92)" : "rgba(15,23,42,0.92)",
      secondary: isDark ? "rgba(255,255,255,0.42)" : "rgba(15,23,42,0.52)",
    },
    divider: t.border,
  };

  // Custom tokens exposed on theme.forge
  const forge = {
    tokens,
    t,
    isDark,
    mono: baseTypography.mono,
    shadows: {
      floating: isDark
        ? "0 16px 40px rgba(0,0,0,0.5)"
        : "0 8px 32px rgba(15,23,42,0.12)",
      glow: (color) => `0 0 20px ${color}40, 0 0 8px ${color}20`,
    },
  };

  return createTheme({
    forge,
    palette,
    typography: baseTypography,
    shape: { borderRadius: 12 },
    components: {

      // ── Global body ────────────────────────────────────────────────
      MuiCssBaseline: {
        styleOverrides: {
          "*, *::before, *::after": { boxSizing: "border-box" },
          body: {
            backgroundColor: t.bg,
            backgroundImage: isDark
              ? "none"
              : `radial-gradient(ellipse at 60% 0%, rgba(79,142,247,0.06) 0%, transparent 60%),
                 radial-gradient(ellipse at 0% 80%, rgba(0,255,102,0.04) 0%, transparent 50%)`,
            backgroundAttachment: "fixed",
            minHeight: "100vh",
          },
        },
      },

      // ── Paper / Cards ──────────────────────────────────────────────
      MuiPaper: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            backgroundImage: "none",
            backgroundColor: t.surface,
            border: `1px solid ${t.border}`,
            borderRadius: 12,
          },
        },
      },

      // ── Buttons ────────────────────────────────────────────────────
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: {
            borderRadius: 10,
            padding: "9px 20px",
            letterSpacing: "0.02em",
            fontWeight: 600,
          },
          containedPrimary: {
            background: isDark
              ? tokens.white
              : tokens.accentBlue,
            color: isDark ? tokens.nearBlack : tokens.white,
            boxShadow: isDark
              ? "none"
              : `0 4px 14px ${alpha(tokens.accentBlue, 0.3)}`,
            "&:hover": {
              background: isDark
                ? alpha(tokens.white, 0.88)
                : alpha(tokens.accentBlue, 0.88),
            },
          },
          containedSecondary: {
            background: tokens.accentBlue,
            color: tokens.white,
            boxShadow: `0 4px 14px ${alpha(tokens.accentBlue, 0.28)}`,
            "&:hover": { background: alpha(tokens.accentBlue, 0.88) },
          },
          outlined: {
            borderColor: t.border,
            color: isDark ? alpha(tokens.white, 0.7) : alpha(tokens.nearBlack, 0.7),
            "&:hover": {
              borderColor: t.borderHov,
              backgroundColor: isDark
                ? alpha(tokens.white, 0.04)
                : alpha(tokens.nearBlack, 0.04),
            },
          },
        },
      },

      // ── Chip ───────────────────────────────────────────────────────
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 999,
            fontWeight: 600,
            fontSize: "0.75rem",
            letterSpacing: "0.04em",
            backgroundColor: isDark
              ? alpha(tokens.accentBlue, 0.12)
              : alpha(tokens.accentBlue, 0.08),
            borderColor: alpha(tokens.accentBlue, 0.28),
            color: tokens.accentBlue,
          },
        },
      },

      // ── Tabs ───────────────────────────────────────────────────────
      MuiTabs: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            padding: 6,
            backgroundColor: isDark
              ? alpha(tokens.white, 0.04)
              : alpha(tokens.nearBlack, 0.04),
          },
          indicator: {
            backgroundColor: tokens.accentBlue,
            height: 3,
            borderRadius: 3,
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            fontWeight: 600,
            fontSize: "0.9rem",
            color: isDark
              ? alpha(tokens.white, 0.5)
              : alpha(tokens.nearBlack, 0.5),
            "&.Mui-selected": { color: tokens.accentBlue },
          },
        },
      },

      // ── Divider ────────────────────────────────────────────────────
      MuiDivider: {
        styleOverrides: {
          root: { borderColor: t.border },
        },
      },

      // ── Dialog ────────────────────────────────────────────────────
      MuiDialog: {
        styleOverrides: {
          paper: {
            backgroundImage: "none",
            backgroundColor: t.surface,
            border: `1px solid ${t.border}`,
          },
        },
      },

      // ── ListItemButton ─────────────────────────────────────────────
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            transition: "background 0.15s, color 0.15s",
          },
        },
      },
    },
  });
};

export default createForgeTheme;