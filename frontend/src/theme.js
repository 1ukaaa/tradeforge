import { createTheme } from "@mui/material/styles";

const brandPalette = {
  midnight: "#0F1B3D",
  indigo: "#273A96",
  iris: "#5A4BBA",
  sky: "#73B3FF",
  blush: "#F7D5FF",
  sand: "#F3F7FF",
};

const theme = createTheme({
  typography: {
    fontFamily: `"Inter", "Segoe UI", "Roboto", "Helvetica", "Arial", sans-serif`,
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 700 },
    button: { fontWeight: 700, textTransform: "none" },
  },
  palette: {
    mode: "light",
    primary: {
      main: brandPalette.indigo,
      contrastText: "#ffffff",
    },
    secondary: {
      main: brandPalette.iris,
      light: "#AD8BFF",
      contrastText: "#ffffff",
    },
    background: {
      default: brandPalette.sand,
      paper: "#ffffff",
    },
    text: {
      primary: brandPalette.midnight,
      secondary: "#4A5674",
    },
  },
  shape: {
    borderRadius: 14,
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 18,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          padding: "12px 24px",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          fontWeight: 600,
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        subtitle1: {
          letterSpacing: "0.01em",
        },
      },
    },
  },
});

export default theme;
