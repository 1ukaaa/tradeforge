// frontend/src/components/JournalImageCard.js

import PhotoIcon from "@mui/icons-material/Photo"; // Pour le placeholder
import {
    alpha,
    Box,
    Chip,
    Paper,
    Stack,
    Typography,
    useTheme,
} from "@mui/material";

// --- Fonctions utilitaires (copiées de Journal.js) ---

const formatDate = (iso) => {
  if (!iso) return "Date inconnue";
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
};

const typeLabel = {
  trade: { chip: "Trade", color: "error" },
  analyse: { chip: "Analyse", color: "success" },
};

const resultTone = (result) => {
  if (!result) return "default";
  const normalized = result.toLowerCase();
  if (/(gain|profit|gagné|positif|win|tp)/i.test(normalized)) return "success";
  if (/(perte|loss|négatif|raté|down|sl)/i.test(normalized)) return "error";
  if (/(be|break even)/i.test(normalized)) return "info";
  return "default";
};

// --- Le Composant Carte ---

export const JournalImageCard = ({ entry, onClick }) => {
  const theme = useTheme();
  const meta = entry.metadata || {};

  // Logique clé : trouver la première image
  const firstImage =
    meta.images && meta.images.length > 0 ? meta.images[0].src : null;

  const title = meta.title || "Entrée sans titre";
  const dateLabel = formatDate(meta.date || entry.createdAt);
  const typeInfo = typeLabel[entry.type] || {
    chip: "Entrée",
    color: "default",
  };
  const resultLabel = meta.result || "N/A";
  const symbol = meta.symbol || "N/A";

  return (
    <Paper
      onClick={onClick}
      variant="outlined"
      sx={{
        display: "flex",
        flexDirection: "row",
        overflow: "hidden", // Important pour les coins arrondis de l'image
        cursor: "pointer",
        transition: "transform 0.2s, box-shadow 0.2s",
        "&:hover": {
          transform: "translateY(-3px)",
          boxShadow: (theme) =>
            theme.palette.mode === "dark"
              ? "0 8px 20px rgba(0,0,0,0.2)"
              : "0 8px 20px rgba(0,0,0,0.08)",
        },
      }}
    >
      {/* 1. Zone Image (Gauche) */}
      <Box
        sx={{
          width: { xs: 100, sm: 140, md: 160 },
          flexShrink: 0,
          position: "relative",
          background: alpha(theme.palette.divider, 0.05),
          borderRight: "1px solid",
          borderColor: "divider",
        }}
      >
        {firstImage ? (
          <img
            src={firstImage}
            alt={title}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover", // Assure que l'image remplit la zone
            }}
          />
        ) : (
          <Stack
            sx={{
              width: "100%",
              height: "100%",
              minHeight: 120, // Hauteur minimale si pas d'image
              alignItems: "center",
              justifyContent: "center",
              color: "text.secondary",
              opacity: 0.5,
            }}
          >
            <PhotoIcon sx={{ fontSize: 40 }} />
          </Stack>
        )}
      </Box>

      {/* 2. Zone Contenu (Droite) */}
      <Stack spacing={1.5} sx={{ p: { xs: 2, md: 2.5 }, flex: 1, minWidth: 0 }}>
        {/* Ligne du haut : Type et Date */}
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          spacing={1}
        >
          <Chip
            label={typeInfo.chip}
            size="small"
            color={typeInfo.color}
            variant="outlined"
          />
          <Typography
            variant="caption"
            color="text.secondary"
            noWrap
            sx={{ fontFamily: "monospace" }}
          >
            {dateLabel}
          </Typography>
        </Stack>

        {/* Titre principal */}
        <Typography
          variant="h6"
          fontWeight={600}
          noWrap
          title={title}
          sx={{ lineHeight: 1.3 }}
        >
          {title}
        </Typography>

        {/* Ligne du bas : Symbole et Résultat */}
        <Stack
          direction="row"
          spacing={1.5}
          alignItems="center"
          flexWrap="wrap" // Permet de passer à la ligne sur petit écran
        >
          <Typography
            variant="body2"
            color="text.primary"
            sx={{ fontWeight: 500 }}
          >
            {symbol}
          </Typography>
          <Chip
            label={resultLabel}
            size="small"
            color={resultTone(resultLabel)}
          />
        </Stack>
      </Stack>
    </Paper>
  );
};

export default JournalImageCard;