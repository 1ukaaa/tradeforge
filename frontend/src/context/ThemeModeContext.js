import { CssBaseline, ThemeProvider } from "@mui/material";
import PropTypes from "prop-types";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import createForgeTheme from "../theme";

const ThemeModeContext = createContext({
  mode: "dark",
  toggleMode: () => {},
  setMode: () => {},
});

export const useThemeMode = () => useContext(ThemeModeContext);

export const ThemeModeProvider = ({ children }) => {
  const [mode, setMode] = useState(() => {
    if (typeof window === "undefined") return "dark";
    return localStorage.getItem("tradeforge-theme") || "dark";
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("tradeforge-theme", mode);
    }
  }, [mode]);

  const toggleMode = useCallback(() => {
    setMode((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  const theme = useMemo(() => createForgeTheme(mode), [mode]);

  return (
    <ThemeModeContext.Provider value={{ mode, setMode, toggleMode }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeModeContext.Provider>
  );
};

ThemeModeProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
