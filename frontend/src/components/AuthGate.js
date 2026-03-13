// frontend/src/components/AuthGate.js
import {
  Alert,
  alpha,
  Box,
  Button,
  CircularProgress,
  Fade,
  IconButton,
  InputAdornment,
  Paper,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import { useEffect, useState } from "react";
import { checkAuthStatus, verifyMasterPassword } from "../services/authClient";
import BrandLogo from "./BrandLogo";

// Icons
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";

const AuthGate = ({ children }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const [loadingConfig, setLoadingConfig] = useState(true);
  const [authRequired, setAuthRequired] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  // Form states
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loadingVerification, setLoadingVerification] = useState(false);
  const [error, setError] = useState("");

  const STORAGE_KEY = "tf_master_session";

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const required = await checkAuthStatus();
        setAuthRequired(required);

        if (!required) {
          // No password set in backend .env
          setAuthenticated(true);
        } else {
          // Check if we already have the password saved locally
          const savedPass = localStorage.getItem(STORAGE_KEY);
          if (savedPass) {
            // Validate the cached password
            try {
              const isValid = await verifyMasterPassword(savedPass);
              if (isValid) {
                setAuthenticated(true);
              } else {
                // Password changed or invalid, clear cache
                localStorage.removeItem(STORAGE_KEY);
              }
            } catch (e) {
              console.error("Saved password verification failed", e);
              localStorage.removeItem(STORAGE_KEY);
            }
          }
        }
      } catch (err) {
        console.error("Failed to check auth status", err);
        // Fallback: If we can't reach the backend, we stay in loading or show error?
        // Let's assume auth is not required if the backend is down (tho it implies nothing works anyway)
        // Usually, the API will throw network errors in the console.
      } finally {
        setLoadingConfig(false);
      }
    };

    initializeAuth();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password) return;

    setLoadingVerification(true);
    setError("");

    try {
      const isValid = await verifyMasterPassword(password);
      if (isValid) {
        // Save the valid password "forever"
        localStorage.setItem(STORAGE_KEY, password);
        setAuthenticated(true);
      }
    } catch (err) {
      setError(err.message || "Mot de passe incorrect.");
    } finally {
      setLoadingVerification(false);
    }
  };

  // 1. Initial payload check
  if (loadingConfig) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: isDark ? "#0a0a0f" : "#f8f9fc",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // 2. Auth not required OR authenticated > Load the actual App
  if (!authRequired || authenticated) {
    return <>{children}</>;
  }

  // 3. Needs authentication UI
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: isDark ? "#0a0a0f" : "#f8f9fc",
        background: isDark
          ? "radial-gradient(ellipse at 50% 0%, rgba(79, 142, 247, 0.08) 0%, transparent 60%), #0a0a0f"
          : "radial-gradient(ellipse at 50% 0%, rgba(79, 142, 247, 0.06) 0%, transparent 60%), #f8f9fc",
        p: 2,
      }}
    >
      <Fade in timeout={600}>
        <Paper
          elevation={0}
          sx={{
            maxWidth: 420,
            width: "100%",
            p: { xs: 4, sm: 5 },
            borderRadius: 4,
            border: `1px solid ${theme.palette.divider}`,
            bgcolor: isDark ? alpha("#16161C", 0.9) : "rgba(255,255,255,0.95)",
            backdropFilter: "blur(20px)",
            textAlign: "center",
          }}
        >
          {/* Logo */}
          <Box sx={{ mb: 4, display: "flex", justifyContent: "center" }}>
            <BrandLogo glyphSize={42} />
          </Box>

          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              bgcolor: isDark
                ? alpha(theme.palette.primary.main, 0.12)
                : alpha(theme.palette.primary.main, 0.08),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mx: "auto",
              mb: 3,
            }}
          >
            <LockOutlinedIcon
              sx={{ fontSize: 28, color: theme.palette.primary.main }}
            />
          </Box>

          <Typography
            variant="h5"
            fontWeight={700}
            letterSpacing="-0.02em"
            gutterBottom
          >
            Accès Protégé
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 4, lineHeight: 1.6 }}
          >
            Entrez votre mot de passe maître pour déverrouiller TradeForge. Ce mot de passe sera mémorisé sur cet appareil.
          </Typography>

          <form onSubmit={handleSubmit}>
            {/* Champ caché ("Honeypot/Username") pour aider 1Password & autres gestionnaires à comprendre que c'est un formulaire de connexion */}
            <input type="text" name="username" defaultValue="TradeForge Admin" style={{ display: "none" }} autoComplete="username" />

            <TextField
              fullWidth
              name="password"
              id="password"
              label="Mot de passe"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              inputProps={{ autoComplete: "current-password" }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? (
                        <VisibilityOffIcon fontSize="small" />
                      ) : (
                        <VisibilityIcon fontSize="small" />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                mb: 3,
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2.5,
                  fontSize: "1.1rem",
                  letterSpacing: showPassword ? "0" : "0.2em",
                },
              }}
            />

            {error && (
              <Alert
                severity="error"
                sx={{ mb: 3, borderRadius: 2, textAlign: "left" }}
              >
                {error}
              </Alert>
            )}

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loadingVerification || !password}
              disableElevation
              sx={{
                py: 1.5,
                borderRadius: 2.5,
                fontWeight: 600,
                fontSize: "1rem",
                textTransform: "none",
                background: "linear-gradient(135deg, #4F8EF7 0%, #7B5CF6 100%)",
                color: "#fff",
                "&:hover": {
                  background:
                    "linear-gradient(135deg, #3B7EF0 0%, #6B4CE6 100%)",
                },
                "&:disabled": {
                  background: isDark
                    ? alpha("#fff", 0.08)
                    : alpha("#000", 0.08),
                },
              }}
            >
              {loadingVerification ? (
                <CircularProgress size={22} sx={{ color: "#fff" }} />
              ) : (
                "Déverrouiller l'app"
              )}
            </Button>
          </form>
        </Paper>
      </Fade>
    </Box>
  );
};

export default AuthGate;
