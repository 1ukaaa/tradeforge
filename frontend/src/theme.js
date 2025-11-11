import { alpha, createTheme } from "@mui/material/styles";

const forgePalette = {
  obsidian: "#05060A",
  nightfall: "#0B0F1A",
  graphite: "#141C2C",
  steel: "#1F2A3F",
  slate: "#2B3A55",
  signalBlue: "#4AC9FF",
  neonGlass: "#74F6D6",
  ember: "#F15A29",
  emberGlow: "#FF8A65",
  sand: "#F4F6FF",
  dune: "#0F1729",
  porcelain: "#FFFFFF",
  fog: "#EEF3FF",
};

const gradients = {
  dark: {
    hero: "radial-gradient(circle at 15% 10%, rgba(116, 246, 214, 0.25), transparent 45%), radial-gradient(circle at 85% 0%, rgba(241, 90, 41, 0.5), transparent 55%), linear-gradient(160deg, #05060a 0%, #0b0f1a 45%, #0f1b2d 100%)",
    card: "linear-gradient(180deg, rgba(21, 32, 54, 0.85) 0%, rgba(9, 13, 28, 0.85) 100%)",
    chip: "linear-gradient(120deg, rgba(116, 246, 214, 0.18), rgba(74, 201, 255, 0.12))",
    warning: "linear-gradient(120deg, rgba(241, 90, 41, 0.5), rgba(255, 138, 101, 0.3))",
  },
  light: {
    hero: "radial-gradient(circle at 15% 10%, rgba(116, 246, 214, 0.35), transparent 45%), radial-gradient(circle at 85% 0%, rgba(241, 90, 41, 0.35), transparent 55%), linear-gradient(160deg, #fdfdff 0%, #f4f7ff 45%, #eef4ff 100%)",
    card: "linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(243, 247, 255, 0.85) 100%)",
    chip: "linear-gradient(120deg, rgba(74, 201, 255, 0.15), rgba(116, 246, 214, 0.1))",
    warning: "linear-gradient(120deg, rgba(241, 90, 41, 0.35), rgba(255, 138, 101, 0.25))",
  },
};

const sharedRadius = 18;

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
  const palette = {
    mode,
    primary: {
      main: isDark ? forgePalette.neonGlass : "#146C94",
      contrastText: isDark ? forgePalette.obsidian : "#FFFFFF",
    },
    secondary: {
      main: isDark ? forgePalette.signalBlue : "#4C6FFF",
      contrastText: isDark ? forgePalette.obsidian : "#FFFFFF",
    },
    error: {
      main: forgePalette.ember,
      light: forgePalette.emberGlow,
    },
    background: {
      default: isDark ? forgePalette.obsidian : forgePalette.fog,
      paper: isDark ? forgePalette.graphite : forgePalette.porcelain,
    },
    text: {
      primary: isDark ? forgePalette.sand : forgePalette.dune,
      secondary: alpha(isDark ? forgePalette.sand : forgePalette.dune, isDark ? 0.76 : 0.65),
    },
    divider: alpha(isDark ? "#FFFFFF" : "#0F1729", 0.08),
  };

  const forge = {
    palette: forgePalette,
    gradients: isDark ? gradients.dark : gradients.light,
    radius: sharedRadius,
    shadows: {
      floating: isDark ? "0 25px 60px rgba(0,0,0,0.45)" : "0 18px 40px rgba(15,23,42,0.15)",
      glow: "0 0 40px rgba(116,246,214,0.25)",
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
            border: `1px solid ${alpha(isDark ? "#FFFFFF" : "#0F1729", 0.08)}`,
            backgroundImage: forge.gradients.card,
            backdropFilter: "blur(18px)",
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
            backgroundImage: isDark
              ? "linear-gradient(120deg, #74F6D6, #4AC9FF)"
              : "linear-gradient(120deg, #4AC9FF, #74F6D6)",
            color: isDark ? forgePalette.obsidian : "#0F1729",
            boxShadow: isDark
              ? "0 10px 24px rgba(74, 201, 255, 0.35)"
              : "0 12px 26px rgba(23, 93, 255, 0.2)",
            "&:hover": {
              backgroundImage: isDark
                ? "linear-gradient(120deg, #4AC9FF, #74F6D6)"
                : "linear-gradient(120deg, #74F6D6, #4AC9FF)",
            },
          },
          outlined: {
            borderWidth: 1,
            borderColor: alpha(isDark ? "#FFFFFF" : "#0F1729", 0.24),
            color: palette.text.primary,
            "&:hover": {
              borderColor: forgePalette.neonGlass,
              boxShadow: "0 0 20px rgba(116,246,214,0.2)",
            },
          },
          text: {
            color: forgePalette.neonGlass,
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
            borderColor: alpha(isDark ? "#FFFFFF" : "#0F1729", 0.12),
            color: isDark ? forgePalette.neonGlass : forgePalette.signalBlue,
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
            backgroundColor: forgePalette.neonGlass,
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
              color: palette.text.primary,
            },
          },
        },
      },
      MuiDivider: {
        styleOverrides: {
          root: {
            borderColor: alpha(isDark ? "#FFFFFF" : "#0F1729", 0.08),
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            background: forge.gradients.card,
            border: `1px solid ${alpha(isDark ? "#FFFFFF" : "#0F1729", 0.08)}`,
            boxShadow: isDark ? "0 30px 70px rgba(0,0,0,0.65)" : "0 25px 60px rgba(15,23,42,0.2)",
          },
        },
      },
      MuiSnackbarContent: {
        styleOverrides: {
          root: {
            borderRadius: sharedRadius,
            backgroundImage: forge.gradients.chip,
            color: palette.text.primary,
            border: `1px solid ${alpha(isDark ? "#FFFFFF" : "#0F1729", 0.15)}`,
          },
        },
      },
    },
  });
};

export default createForgeTheme;
