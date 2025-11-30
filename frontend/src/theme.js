import { alpha, createTheme } from "@mui/material/styles";

// 1. PALETTE (INCHANGÉE PAR RAPPORT À CELLE QUE TU AS VALIDÉE)
const forgePalette = {
  obsidian: "#0A0A0F",
  nightfall: "#121218",
  graphite: "#1E1E24",
  steel: "#2A2A32",
  slate: "#4A4A52",
  accentBlue: "#3B82F6",
  accentNeutral: "#F4F6FF",
  ember: "#F15A29",
  emberGlow: "#FF8A65",
  sand: "#F4F6FF",
  dune: "#0F1729",
  porcelain: "#FFFFFF",
  fog: "#F7F8FA",
};

// 2. GRADIENTS (INCHANGÉS)
const gradients = {
  dark: {
    hero: `linear-gradient(160deg, ${forgePalette.graphite} 0%, ${forgePalette.obsidian} 100%)`,
    card: `linear-gradient(180deg, ${forgePalette.nightfall} 0%, ${alpha(forgePalette.obsidian, 0.95)} 100%)`,
    chip: `linear-gradient(120deg, ${alpha(forgePalette.accentBlue, 0.15)}, ${alpha(forgePalette.accentBlue, 0.1)})`,
    warning: `linear-gradient(120deg, ${alpha(forgePalette.ember, 0.3)}, ${alpha(forgePalette.emberGlow, 0.2)})`,
  },
  light: {
    // Gradients mis à jour pour le mode clair
    hero: `linear-gradient(160deg, ${forgePalette.porcelain} 0%, ${forgePalette.fog} 100%)`,
    card: `linear-gradient(180deg, ${alpha(forgePalette.porcelain, 0.98)} 0%, ${alpha(forgePalette.fog, 0.9)} 100%)`,
    chip: `linear-gradient(120deg, ${alpha(forgePalette.accentBlue, 0.15)}, ${alpha(forgePalette.accentBlue, 0.1)})`,
    warning: `linear-gradient(120deg, ${alpha(forgePalette.ember, 0.3)}, ${alpha(forgePalette.emberGlow, 0.2)})`,
  },
};

// 3. RADIUS (INCHANGÉ)
const sharedRadius = 8;

// 4. TYPOGRAPHIE (INCHANGÉE)
const baseTypography = {
  fontFamily: `"Space Grotesk", "Inter", "Segoe UI", "Roboto", sans-serif`,
  button: { fontWeight: 600, textTransform: "none", letterSpacing: "0.02em" },
  h1: { fontWeight: 600, letterSpacing: "-0.02em" },
  h2: { fontWeight: 600, letterSpacing: "-0.015em" },
  h3: { fontWeight: 600, letterSpacing: "-0.01em" },
  h4: { fontWeight: 600 },
  mono: `"JetBrains Mono","Fira Code",monospace`,
};

const createForgeTheme = (mode = "dark") => {
  const isDark = mode === "dark";

  // 5. NOUVELLE PALETTE MUI
  const palette = {
    mode,
    // ================== MODE SOMBRE (INCHANGÉ) ==================
    primary: isDark ? {
      main: forgePalette.accentNeutral, // Blanc/Sable
      contrastText: forgePalette.obsidian,
    } : {
      // ================== MODE CLAIR (MODIFIÉ) ==================
      main: forgePalette.accentBlue, // Le bleu devient la couleur primaire
      contrastText: forgePalette.porcelain,
    },
    secondary: isDark ? {
      main: forgePalette.accentBlue,
      contrastText: forgePalette.obsidian,
    } : {
      main: forgePalette.dune, // Le noir/bleu foncé devient secondaire
      contrastText: forgePalette.porcelain,
    },
    error: {
      main: forgePalette.ember,
      light: forgePalette.emberGlow,
    },
    background: {
      default: isDark ? forgePalette.obsidian : forgePalette.fog, // Fond gris clair
      paper: isDark ? forgePalette.nightfall : forgePalette.porcelain, // Fond blanc pur
    },
    text: {
      primary: isDark ? forgePalette.sand : forgePalette.dune,
      secondary: isDark ? alpha(forgePalette.sand, 0.65) : alpha(forgePalette.dune, 0.65),
    },
    divider: alpha(isDark ? "#FFFFFF" : "#0F1729", 0.1),
  };

  const forge = {
    palette: forgePalette,
    gradients: isDark ? gradients.dark : gradients.light,
    radius: sharedRadius,
    shadows: {
      floating: isDark ? "0 10px 20px rgba(0,0,0,0.2)" : "0 10px 20px rgba(15,23,42,0.1)",
      glow: `0 0 15px ${alpha(forgePalette.accentBlue, 0.2)}`,
    },
  };

  return createTheme({
    forge,
    typography: baseTypography,
    palette,
    shape: {
      borderRadius: sharedRadius,
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: palette.background.default,
            backgroundImage: isDark
              ? "radial-gradient(circle at 20% 20%, #1b2d3f 0%, #05060a 55%)"
              : `linear-gradient(160deg, ${forgePalette.porcelain} 0%, ${forgePalette.fog} 100%)`,
            backgroundAttachment: "fixed",
            backgroundRepeat: "no-repeat",
            minHeight: "100vh",
          },
        },
      },
      MuiPaper: {
        defaultProps: {
          elevation: 0,
        },
        styleOverrides: {
          root: {
            borderRadius: sharedRadius,
            border: `1px solid ${alpha(isDark ? "#FFFFFF" : "#0F1729", 0.1)}`,
            backgroundImage: "none",
            backgroundColor: palette.background.paper,
          },
        },
      },
      MuiButton: {
        defaultProps: {
          disableElevation: true,
        },
        styleOverrides: {
          root: {
            borderRadius: sharedRadius,
            padding: "10px 22px",
            letterSpacing: "0.06em",
          },
          containedPrimary: {
            // Dark: White button (primary.main is White)
            // Light: Blue button (primary.main is Blue)
            background: palette.primary.main,
            color: palette.primary.contrastText,
            boxShadow: !isDark ? `0 4px 12px ${alpha(palette.primary.main, 0.2)}` : "none",
            "&:hover": {
              background: alpha(palette.primary.main, 0.85),
            },
          },
          containedSecondary: {
            // Dark: Blue button (secondary.main is Blue)
            // Light: Dark button (secondary.main is Dark)
            background: palette.secondary.main,
            color: palette.secondary.contrastText,
            boxShadow: "none",
            "&:hover": {
              background: alpha(palette.secondary.main, 0.85),
            },
          },
          outlined: {
            borderWidth: "1px",
            borderColor: alpha(isDark ? "#FFFFFF" : "#0F1729", 0.2),
            color: isDark ? palette.text.secondary : palette.text.primary,
            "&:hover": {
              borderColor: palette.primary.main,
              color: palette.primary.main,
              background: alpha(palette.primary.main, 0.05),
            },
          },
          text: {
            color: palette.secondary.main,
          },
        },
      },
      MuiChip: {
        defaultProps: {
          variant: "outlined",
        },
        styleOverrides: {
          root: {
            borderRadius: 999,
            fontWeight: 600,
            letterSpacing: "0.04em",
            backgroundImage: forge.gradients.chip,
            borderColor: alpha(forgePalette.accentBlue, 0.3),
            color: forgePalette.accentBlue, // Always Blue
          },
        },
      },
      MuiTabs: {
        styleOverrides: {
          root: {
            borderRadius: sharedRadius,
            padding: 6,
            backgroundColor: alpha(isDark ? "#FFFFFF" : "#0F1729", 0.04),
          },
          indicator: {
            backgroundColor: forgePalette.accentBlue, // Always Blue
            height: 3,
            borderRadius: 3,
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            fontWeight: 600,
            fontSize: "0.95rem",
            color: alpha(isDark ? "#FFFFFF" : "#0F1729", 0.6),
            "&.Mui-selected": {
              color: forgePalette.accentBlue, // Always Blue
            },
          },
        },
      },
      MuiDivider: {
        styleOverrides: {
          root: {
            borderColor: alpha(isDark ? "#FFFFFF" : "#0F1729", 0.1),
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            border: `1px solid ${alpha(isDark ? "#FFFFFF" : "#0F1729", 0.1)}`,
            boxShadow: forge.shadows.floating,
            backgroundImage: "none",
            backgroundColor: palette.background.paper,
          },
        },
      },
      MuiSnackbarContent: {
        styleOverrides: {
          root: {
            borderRadius: sharedRadius,
            backgroundImage: forge.gradients.chip,
            color: forgePalette.accentBlue,
            border: `1px solid ${alpha(forgePalette.accentBlue, 0.3)}`,
            backgroundColor: isDark ? forgePalette.nightfall : forgePalette.porcelain,
          },
        },
      },
    },
  });
};

export default createForgeTheme;