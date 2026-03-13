// frontend/src/pages/SharedJournal.js
import {
  Alert,
  alpha,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogContent,
  Divider,
  Fade,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import BrandLogo from "../components/BrandLogo";
import { checkShareToken, authenticateShare, fetchSharedJournal } from "../services/shareClient";
import { COMMON_ASSETS } from "../utils/assetUtils";

// Icons
import CloseIcon from "@mui/icons-material/Close";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";

const RESULT_COLORS = {
  Win: "success",
  Loss: "error",
  Breakeven: "info",
};

const getAssetCategory = (assetValue) => {
  const found = COMMON_ASSETS.find((a) => a.value === assetValue);
  return found ? found.group : "Autre";
};

// ─── PIN Authentication Screen ──────────────────────────────────────
const PinScreen = ({ onAuthenticated, tokenLabel, error: externalError }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPin, setShowPin] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pin || pin.length < 4) {
      setError("Le PIN doit faire au moins 4 caractères.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await onAuthenticated(pin);
    } catch (err) {
      setError(err.message || "PIN incorrect.");
    } finally {
      setLoading(false);
    }
  };

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

          {/* Lock Icon */}
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
            Journal Partagé
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 4, lineHeight: 1.6 }}
          >
            {tokenLabel
              ? `Accédez au journal « ${tokenLabel} ».`
              : "Entrez le code PIN pour accéder à ce journal."}
          </Typography>

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Code PIN"
              type={showPin ? "text" : "password"}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              autoFocus
              inputProps={{ maxLength: 20, autoComplete: "off" }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => setShowPin(!showPin)}
                      edge="end"
                    >
                      {showPin ? (
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
                  letterSpacing: showPin ? "0" : "0.2em",
                },
              }}
            />

            {(error || externalError) && (
              <Alert
                severity="error"
                sx={{ mb: 3, borderRadius: 2, textAlign: "left" }}
              >
                {error || externalError}
              </Alert>
            )}

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading || pin.length < 4}
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
              {loading ? (
                <CircularProgress size={22} sx={{ color: "#fff" }} />
              ) : (
                "Accéder au Journal"
              )}
            </Button>
          </form>

          <Typography
            variant="caption"
            color="text.disabled"
            sx={{ mt: 3, display: "block" }}
          >
            <VerifiedUserOutlinedIcon
              sx={{ fontSize: 12, mr: 0.5, verticalAlign: "middle" }}
            />
            Accès en lecture seule · Protégé par PIN
          </Typography>
        </Paper>
      </Fade>
    </Box>
  );
};

// ─── Read-Only Detail Modal ─────────────────────────────────────────
const SharedDetailModal = ({ open, entry, onClose }) => {
  const theme = useTheme();
  if (!entry) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="lg"
      PaperProps={{
        sx: {
          bgcolor: theme.palette.background.paper,
          borderRadius: 3,
          overflow: "hidden",
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="h6" fontWeight={800}>
            {entry.asset}
          </Typography>
          <Chip
            label={getAssetCategory(entry.asset)}
            size="small"
            variant="outlined"
            sx={{
              fontWeight: 600,
              color: "text.secondary",
              borderColor: "divider",
            }}
          />
          <Chip
            label={entry.direction}
            size="small"
            color={entry.direction === "Achat" ? "primary" : "secondary"}
          />
          <Chip
            label={entry.result}
            size="small"
            color={RESULT_COLORS[entry.result] || "default"}
          />
          <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
            {new Date(entry.date).toLocaleDateString("fr-FR", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </Typography>
        </Stack>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Content */}
      <DialogContent sx={{ p: 0 }}>
        <Grid container sx={{ height: "100%" }}>
          <Grid
            item
            xs={12}
            md={8}
            sx={{
              p: 3,
              borderRight: { md: `1px solid ${theme.palette.divider}` },
              bgcolor: alpha(theme.palette.background.default, 0.4),
            }}
          >
            {entry.images && entry.images.length > 0 ? (
              <Stack spacing={2}>
                {entry.images.map((img, i) => (
                  <Box
                    component="img"
                    key={i}
                    src={img}
                    sx={{
                      width: "100%",
                      borderRadius: 2,
                      border: `1px solid ${theme.palette.divider}`,
                      boxShadow: theme.shadows[3],
                    }}
                  />
                ))}
              </Stack>
            ) : (
              <Box
                sx={{
                  height: "100%",
                  minHeight: 400,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Typography color="text.secondary">
                  Aucune image pour ce trade
                </Typography>
              </Box>
            )}
          </Grid>
          <Grid item xs={12} md={4} sx={{ p: 3 }}>
            <Typography variant="overline" color="text.secondary">
              DÉTAILS DU TRADE
            </Typography>
            <Stack spacing={2} mt={2}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  COMPTE
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {entry.account || "-"}
                </Typography>
              </Box>
              <Divider />
              <Box>
                <Typography variant="caption" color="text.secondary">
                  SETUP
                </Typography>
                <Typography variant="body1">
                  {entry.setup || "-"}
                </Typography>
              </Box>
            </Stack>
          </Grid>
        </Grid>
      </DialogContent>
    </Dialog>
  );
};

// ─── Main SharedJournal Page ────────────────────────────────────────
const SharedJournal = () => {
  const { token } = useParams();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  // States
  const [status, setStatus] = useState("checking"); // checking | pin | authenticated | error
  const [tokenLabel, setTokenLabel] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [pin, setPin] = useState("");

  const [entries, setEntries] = useState([]);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [assetFilter, setAssetFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [resultFilter, setResultFilter] = useState("");

  const [detailEntry, setDetailEntry] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Check token validity on mount
  useEffect(() => {
    const check = async () => {
      try {
        const info = await checkShareToken(token);
        setTokenLabel(info.label || "");

        // Check if we have a cached PIN in sessionStorage
        const cachedPin = sessionStorage.getItem(`share_pin_${token}`);
        if (cachedPin) {
          setPin(cachedPin);
          setStatus("authenticated");
        } else {
          setStatus("pin");
        }
      } catch (err) {
        setErrorMessage(err.message || "Lien invalide ou expiré.");
        setStatus("error");
      }
    };
    check();
  }, [token]);

  // Load journal when authenticated
  const loadJournal = useCallback(async (currentPin) => {
    setLoadingEntries(true);
    try {
      const data = await fetchSharedJournal(token, currentPin);
      setEntries(data);
    } catch (err) {
      // If auth fails, go back to PIN screen
      sessionStorage.removeItem(`share_pin_${token}`);
      setPin("");
      setStatus("pin");
      setErrorMessage("Session expirée, veuillez réentrer le PIN.");
    } finally {
      setLoadingEntries(false);
    }
  }, [token]);

  useEffect(() => {
    if (status === "authenticated" && pin) {
      loadJournal(pin);
    }
  }, [status, pin, loadJournal]);

  // Handle PIN submission
  const handlePinSubmit = async (enteredPin) => {
    await authenticateShare(token, enteredPin);
    // If it doesn't throw, we're authenticated
    setPin(enteredPin);
    sessionStorage.setItem(`share_pin_${token}`, enteredPin);
    setStatus("authenticated");
  };

  // Filter entries
  const filteredEntries = entries.filter((entry) => {
    // 1. Text search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const assetStr = (entry.asset || "").toLowerCase();
      const setupStr = (entry.setup || "").toLowerCase();
      if (!assetStr.includes(q) && !setupStr.includes(q)) {
        return false;
      }
    }
    // 2. Asset filter
    if (assetFilter && entry.asset !== assetFilter) {
      return false;
    }
    // 3. Date filter
    if (dateFilter) {
      const entryDate = entry.date ? new Date(entry.date).toISOString().slice(0, 10) : "";
      if (entryDate !== dateFilter) {
        return false;
      }
    }
    // 4. Result filter
    if (resultFilter && entry.result !== resultFilter) {
      return false;
    }
    return true;
  });

  // Stats
  const stats = (() => {
    if (filteredEntries.length === 0)
      return { winRate: 0, total: 0, bestAsset: "N/A" };
    const total = filteredEntries.length;
    const wins = filteredEntries.filter((e) => e.result === "Win").length;
    const losses = filteredEntries.filter((e) => e.result === "Loss").length;
    const relevant = wins + losses;
    const winRate = relevant > 0 ? Math.round((wins / relevant) * 100) : 0;
    const assetsCount = filteredEntries.reduce((acc, e) => {
      acc[e.asset] = (acc[e.asset] || 0) + 1;
      return acc;
    }, {});
    const bestAsset = Object.keys(assetsCount).reduce(
      (a, b) => (assetsCount[a] > assetsCount[b] ? a : b),
      "N/A"
    );
    return { winRate, total, bestAsset };
  })();

  // ─── Checking state ────────────────────────────────────────────
  if (status === "checking") {
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

  // ─── Error state ───────────────────────────────────────────────
  if (status === "error") {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: isDark ? "#0a0a0f" : "#f8f9fc",
          p: 2,
        }}
      >
        <Fade in timeout={600}>
          <Paper
            elevation={0}
            sx={{
              maxWidth: 420,
              width: "100%",
              p: 5,
              borderRadius: 4,
              border: `1px solid ${theme.palette.divider}`,
              bgcolor: isDark
                ? alpha("#16161C", 0.9)
                : "rgba(255,255,255,0.95)",
              textAlign: "center",
            }}
          >
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                bgcolor: alpha(theme.palette.error.main, 0.12),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mx: "auto",
                mb: 3,
              }}
            >
              <ErrorOutlineIcon
                sx={{ fontSize: 28, color: theme.palette.error.main }}
              />
            </Box>
            <Typography variant="h5" fontWeight={700} gutterBottom>
              Lien Invalide
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {errorMessage}
            </Typography>
          </Paper>
        </Fade>
      </Box>
    );
  }

  // ─── PIN screen ────────────────────────────────────────────────
  if (status === "pin") {
    return (
      <PinScreen
        onAuthenticated={handlePinSubmit}
        tokenLabel={tokenLabel}
        error={errorMessage}
      />
    );
  }

  // ─── Authenticated — Read-only Journal ─────────────────────────
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      {/* Minimal header without navigation */}
      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          px: { xs: 2, sm: 4 },
          py: 1.5,
          bgcolor: isDark
            ? alpha("#0a0a0f", 0.85)
            : alpha("#f8f9fc", 0.85),
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: `1px solid ${theme.palette.divider}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <BrandLogo glyphSize={28} showText={false} />
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <Typography
              variant="body2"
              fontWeight={600}
              color="text.primary"
              sx={{ letterSpacing: "-0.01em" }}
            >
              Journal Partagé
            </Typography>
            {tokenLabel && (
              <Chip
                label={tokenLabel}
                size="small"
                variant="outlined"
                sx={{
                  height: 22,
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  borderColor: "divider",
                  color: "text.secondary",
                }}
              />
            )}
          </Stack>
        </Stack>

        <Chip
          icon={
            <VerifiedUserOutlinedIcon
              sx={{ fontSize: 14, color: "success.main" }}
            />
          }
          label="Lecture seule"
          size="small"
          variant="outlined"
          sx={{
            height: 26,
            fontSize: "0.72rem",
            fontWeight: 600,
            borderColor: alpha(theme.palette.success.main, 0.3),
            color: "success.main",
          }}
        />
      </Box>

      {/* HERO */}
      <Box
        sx={{
          pt: 6,
          pb: 4,
          px: { xs: 2, md: 4 },
          bgcolor: "background.default",
        }}
      >
        <Container maxWidth={false} sx={{ px: { xs: 2, sm: 4, xl: 8 } }}>
          <Typography
            variant="h2"
            fontWeight={700}
            letterSpacing="-0.03em"
            sx={{ color: "text.primary" }}
          >
            Journal
          </Typography>
          <Typography
            variant="subtitle1"
            color="text.secondary"
            sx={{ mt: 1, fontWeight: 400 }}
          >
            Historique visuel et analyse des performances.
          </Typography>

          {/* STATS */}
          <Stack
            direction="row"
            spacing={{ xs: 3, md: 6 }}
            sx={{
              mt: 6,
              borderTop: `1px solid ${theme.palette.divider}`,
              pt: 4,
            }}
          >
            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                fontWeight={500}
                textTransform="uppercase"
                letterSpacing={1}
              >
                Total Trades
              </Typography>
              <Typography
                variant="h4"
                fontWeight={600}
                letterSpacing="-0.02em"
                mt={0.5}
              >
                {stats.total}
              </Typography>
            </Box>
            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                fontWeight={500}
                textTransform="uppercase"
                letterSpacing={1}
              >
                Win Rate
              </Typography>
              <Typography
                variant="h4"
                fontWeight={600}
                letterSpacing="-0.02em"
                mt={0.5}
                sx={{
                  color:
                    stats.winRate >= 50 ? "success.main" : "error.main",
                }}
              >
                {stats.winRate}%
              </Typography>
            </Box>
            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                fontWeight={500}
                textTransform="uppercase"
                letterSpacing={1}
              >
                Atout
              </Typography>
              <Typography
                variant="h4"
                fontWeight={600}
                letterSpacing="-0.02em"
                mt={0.5}
              >
                {stats.bestAsset}
              </Typography>
            </Box>
          </Stack>
        </Container>
      </Box>

      {/* MAIN CONTENT */}
      <Container
        maxWidth={false}
        sx={{ py: 4, px: { xs: 2, sm: 4, xl: 8 } }}
      >
        {/* Filters Stack */}
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          alignItems={{ xs: "stretch", md: "center" }}
          sx={{ mb: 4, pb: 2, borderBottom: `1px solid ${theme.palette.divider}` }}
        >
          {/* Text Search */}
          <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, px: 2, py: 1, bgcolor: alpha(theme.palette.divider, 0.04), borderRadius: 2 }}>
            <SearchIcon color="action" sx={{ mr: 1, fontSize: 20 }} />
            <TextField
              placeholder="Rechercher par actif, description..."
              variant="standard"
              InputProps={{ disableUnderline: true, style: { fontSize: '0.95rem', fontWeight: 500 } }}
              fullWidth
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </Box>

          {/* Asset Filter */}
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Actif</InputLabel>
            <Select
              value={assetFilter}
              label="Actif"
              onChange={(e) => setAssetFilter(e.target.value)}
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value=""><em>Tous</em></MenuItem>
              {Object.keys(
                entries.reduce((acc, e) => {
                  if (e.asset) acc[e.asset] = true;
                  return acc;
                }, {})
              ).sort().map((a) => (
                <MenuItem key={a} value={a}>{a}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Date Filter */}
          <TextField
            label="Date"
            type="date"
            size="small"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 150, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />

          {/* Result Filter */}
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Résultat</InputLabel>
            <Select
              value={resultFilter}
              label="Résultat"
              onChange={(e) => setResultFilter(e.target.value)}
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value=""><em>Tous</em></MenuItem>
              <MenuItem value="Win" sx={{ color: 'success.main', fontWeight: 600 }}>Gagnant</MenuItem>
              <MenuItem value="Loss" sx={{ color: 'error.main', fontWeight: 600 }}>Perdant</MenuItem>
              <MenuItem value="Breakeven" sx={{ color: 'info.main', fontWeight: 600 }}>Neutre</MenuItem>
            </Select>
          </FormControl>

          {/* Clear Filters (if active) */}
          {(searchQuery || assetFilter || dateFilter || resultFilter) && (
            <Button
              size="small"
              onClick={() => {
                setSearchQuery("");
                setAssetFilter("");
                setDateFilter("");
                setResultFilter("");
              }}
              sx={{ minWidth: "auto", textTransform: "none", color: "text.secondary", fontWeight: 600 }}
            >
              Effacer
            </Button>
          )}
        </Stack>

        {loadingEntries ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress />
          </Box>
        ) : filteredEntries.length > 0 ? (
          <Grid container spacing={3}>
            {filteredEntries.map((entry) => {
              const mainBg =
                entry.images && entry.images.length > 0
                  ? entry.images[0]
                  : null;
              const dateObj = new Date(entry.date);
              return (
                <Grid item xs={12} sm={6} md={4} lg={3} key={entry.id}>
                  <Fade in timeout={400}>
                    <Box
                      onClick={() => {
                        setDetailEntry(entry);
                        setDetailOpen(true);
                      }}
                      sx={{
                        cursor: "pointer",
                        "&:hover .img-container": { opacity: 0.85 },
                      }}
                    >
                      <Box
                        className="img-container"
                        sx={{
                          position: "relative",
                          width: "100%",
                          pt: "65%",
                          borderRadius: 2,
                          overflow: "hidden",
                          mb: 2,
                          border: `1px solid ${theme.palette.divider}`,
                          transition: "opacity 0.2s",
                          bgcolor: alpha(theme.palette.divider, 0.05),
                        }}
                      >
                        {mainBg ? (
                          <img
                            src={mainBg}
                            alt="breakdown"
                            style={{
                              position: "absolute",
                              top: 0,
                              left: 0,
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          <Box
                            sx={{
                              position: "absolute",
                              top: 0,
                              left: 0,
                              width: "100%",
                              height: "100%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <PhotoCameraIcon
                              sx={{ color: "text.disabled", opacity: 0.3 }}
                            />
                          </Box>
                        )}
                        <Box
                          sx={{
                            position: "absolute",
                            top: 12,
                            left: 12,
                            display: "flex",
                            gap: 1,
                          }}
                        >
                          <Chip
                            label={entry.result}
                            size="small"
                            sx={{
                              height: 22,
                              fontSize: "0.65rem",
                              fontWeight: 600,
                              bgcolor: "background.paper",
                              color: `${
                                RESULT_COLORS[entry.result]
                              }.main`,
                            }}
                          />
                          <Chip
                            label={entry.direction}
                            size="small"
                            sx={{
                              height: 22,
                              fontSize: "0.65rem",
                              fontWeight: 600,
                              bgcolor: "background.paper",
                              color: "text.primary",
                            }}
                          />
                        </Box>
                      </Box>

                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="flex-start"
                      >
                        <Box sx={{ pr: 2 }}>
                          <Stack
                            direction="row"
                            alignItems="center"
                            spacing={1}
                            mb={0.5}
                          >
                            <Typography
                              variant="subtitle1"
                              fontWeight={600}
                              sx={{ lineHeight: 1 }}
                            >
                              {entry.asset}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {getAssetCategory(entry.asset)}
                            </Typography>
                          </Stack>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            }}
                          >
                            {entry.setup || "Aucune description"}
                          </Typography>
                        </Box>
                        <Typography
                          variant="caption"
                          color="text.disabled"
                          fontWeight={500}
                          sx={{ flexShrink: 0 }}
                        >
                          {dateObj.toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "short",
                          })}
                        </Typography>
                      </Stack>
                    </Box>
                  </Fade>
                </Grid>
              );
            })}
          </Grid>
        ) : (
          <Paper
            variant="outlined"
            sx={{ p: 6, textAlign: "center", borderStyle: "dashed" }}
          >
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Aucun trade trouvé
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Ce journal ne contient aucune entrée pour le moment.
            </Typography>
          </Paper>
        )}
      </Container>

      {/* Detail Modal (read-only) */}
      <SharedDetailModal
        open={detailOpen}
        entry={detailEntry}
        onClose={() => setDetailOpen(false)}
      />
    </Box>
  );
};

export default SharedJournal;
