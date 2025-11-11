import EditIcon from "@mui/icons-material/Edit";
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    IconButton,
    Paper,
    Stack,
    Tooltip,
    Typography,
    alpha,
} from "@mui/material";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchPlan } from "../services/planClient";

// Fonction utilitaire pour formater le plan
const buildPlanDescription = (plan) => {
  if (!plan) return "Aucun plan chargé.";
  return [
    `1. Horaires : ${plan.windows?.join(" / ") || "Non défini"}`,
    `2. Style : ${plan.style || "Non défini"}`,
    `3. Instruments : ${plan.pairs || "Non définis"}`,
    `4. Annonces : ${plan.tradeDuringNews ? "Oui" : "Non"}`,
    `5. Entrées : ${plan.entryStrategy || "Non définie"}`,
    `6. Risque : ${plan.risk || "Non défini"}`,
    `7. Sorties : ${plan.management || "Non définie"}`,
    `8. Notes : ${plan.notes || "Aucune"}`,
  ].join("\n");
};

/**
 * Affiche le plan de trading actif en lecture seule.
 * Conçu pour être utilisé comme un widget "sticky" sur la page NewEntry.
 */
const TradingPlanWidget = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [planText, setPlanText] = useState("");

  useEffect(() => {
    let cancelled = false;
    const loadPlan = async () => {
      setLoading(true);
      setError("");
      try {
        const { plan: fetchedPlan } = await fetchPlan();
        if (cancelled) return;
        setPlanText(buildPlanDescription(fetchedPlan));
      } catch (err) {
        if (cancelled) return;
        setError(err.message || "Impossible de charger le plan.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadPlan();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Paper
      sx={{
        position: { md: "sticky" }, // Se fixe au scroll sur les écrans moyens et +
        top: { md: 100 }, // Commence après le header (approx)
        p: { xs: 2, md: 3 },
        border: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
        background: (theme) =>
          `linear-gradient(170deg, ${alpha(theme.palette.background.paper, 0.9)}, ${alpha(
            theme.palette.background.default,
            0.9
          )})`,
        backdropFilter: "blur(8px)",
      }}
    >
      <Stack spacing={2}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Typography variant="h6" component="h2">
            Plan Actif
          </Typography>
          <Tooltip title="Modifier le plan dans les réglages">
            <IconButton component={Link} to="/settings" size="small">
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>

        {loading && <CircularProgress size={24} sx={{ alignSelf: "center" }} />}
        {error && <Alert severity="error">{error}</Alert>}

        {!loading && !error && (
          <Box
            component="pre"
            sx={{
              whiteSpace: "pre-wrap",
              wordWrap: "break-word",
              fontFamily: `"JetBrains Mono","Fira Code",monospace`,
              fontSize: "0.8rem",
              lineHeight: 1.7,
              color: "text.secondary",
              bgcolor: (theme) => alpha(theme.palette.common.white, 0.04),
              borderRadius: 2,
              p: 2,
              m: 0,
              maxHeight: "60vh",
              overflowY: "auto",
            }}
          >
            {planText}
          </Box>
        )}
        
        <Button
          variant="outlined"
          component={Link}
          to="/settings" // Point final pour l'édition
        >
          Éditer le Plan
        </Button>
      </Stack>
    </Paper>
  );
};

export default TradingPlanWidget;