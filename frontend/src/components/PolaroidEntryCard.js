// frontend/src/components/PolaroidEntryCard.js
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import PhotoIcon from "@mui/icons-material/Photo";
import { alpha, Box, Chip, Paper, Stack, Typography, useTheme } from "@mui/material";
import { formatDate, getEntryImage, getEntryTitle, resultTone, typeLabel } from "../utils/journalUtils";

export const PolaroidEntryCard = ({ entry, onClick }) => {
  const theme = useTheme();
  const meta = entry.metadata || {};
  const firstImage = getEntryImage(entry);
  const title = getEntryTitle(entry);
  
  // Design propre des puces (Chips)
  const typeInfo = typeLabel[entry.type] || { chip: "Note", color: "default" };
  const isTrade = entry.type === "trade";
  const resultColor = isTrade ? resultTone(meta.result) : "default";

  return (
    <Paper
      onClick={onClick}
      elevation={0}
      sx={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        cursor: "pointer",
        borderRadius: 3,
        height: "100%",
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        bgcolor: "background.paper",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: `0 12px 24px -4px ${alpha(theme.palette.common.black, 0.12)}`,
          borderColor: alpha(theme.palette.primary.main, 0.3),
          "& .card-overlay": {
             opacity: 1
          }
        },
      }}
    >
      {/* SECTION IMAGE AVEC RATIO 4:3 */}
      <Box 
        sx={{ 
          width: "100%", 
          aspectRatio: "4/3", 
          position: "relative", 
          bgcolor: alpha(theme.palette.action.hover, 0.1) 
        }}
      >
        {firstImage ? (
          <img 
            src={firstImage} 
            alt={title} 
            style={{ 
              width: "100%", 
              height: "100%", 
              objectFit: "cover",
              transition: "transform 0.5s ease",
            }} 
          />
        ) : (
          <Stack 
            sx={{ 
              width: "100%", 
              height: "100%", 
              alignItems: "center", 
              justifyContent: "center", 
              color: "text.secondary", 
              opacity: 0.3 
            }}
          >
            <PhotoIcon sx={{ fontSize: 48 }} />
          </Stack>
        )}

        {/* BADGE DE RÉSULTAT FLOTTANT */}
        {isTrade && meta.result && (
          <Chip
            label={meta.result}
            size="small"
            sx={{
              position: "absolute",
              top: 12,
              right: 12,
              backdropFilter: "blur(8px)",
              bgcolor: alpha(
                resultColor === "success" ? theme.palette.success.main : 
                resultColor === "error" ? theme.palette.error.main : theme.palette.grey[700], 
                0.9
              ),
              color: "#fff",
              fontWeight: 700,
              border: "none",
              boxShadow: "0 2px 8px rgba(0,0,0,0.2)"
            }}
          />
        )}

        {/* OVERLAY AU HOVER */}
        <Box 
          className="card-overlay"
          sx={{
            position: "absolute",
            inset: 0,
            bgcolor: alpha(theme.palette.common.black, 0.05),
            opacity: 0,
            transition: "opacity 0.2s",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        />
      </Box>

      {/* SECTION CONTENU */}
      <Stack spacing={1.5} sx={{ p: 2.5, flex: 1 }}>
        {/* META HEADER */}
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography 
            variant="caption" 
            fontWeight={600} 
            sx={{ color: alpha(theme.palette.text.secondary, 0.8), textTransform: "uppercase", letterSpacing: "0.05em" }}
          >
            {formatDate(meta.date || entry.createdAt, { month: 'short', day: 'numeric' })}
          </Typography>
          <Box 
            sx={{ 
              width: 6, 
              height: 6, 
              borderRadius: "50%", 
              bgcolor: typeInfo.color === "primary" ? theme.palette.primary.main : theme.palette.text.disabled 
            }} 
          />
        </Stack>

        {/* TITRE */}
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.2, fontSize: "1rem", mb: 0.5 }}>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary" noWrap>
            {meta.symbol} {meta.timeframe ? `• ${meta.timeframe}` : ""}
          </Typography>
        </Box>

        {/* TAGS INFERIEURS */}
        <Stack direction="row" spacing={1} alignItems="center" sx={{ pt: 1 }}>
           {meta.planAdherence !== undefined && (
             <Chip 
                label={`${meta.planAdherence}% Plan`}
                size="small"
                variant="outlined"
                sx={{ 
                  height: 24, 
                  fontSize: "0.7rem", 
                  borderColor: alpha(theme.palette.divider, 0.5),
                  color: meta.planAdherence >= 80 ? "success.main" : meta.planAdherence < 50 ? "error.main" : "warning.main"
                }}
             />
           )}
           {/* Bouton discret pour indiquer qu'il y a plus d'infos */}
           <Box sx={{ flexGrow: 1 }} />
           <MoreHorizIcon sx={{ fontSize: 20, color: "text.disabled" }} />
        </Stack>
      </Stack>
    </Paper>
  );
};
export default PolaroidEntryCard;