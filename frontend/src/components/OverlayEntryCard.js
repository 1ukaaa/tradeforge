// frontend/src/components/OverlayEntryCard.js
import PhotoIcon from "@mui/icons-material/Photo";
import { alpha, Box, Chip, Paper, Stack, Typography, useTheme } from "@mui/material";
import { formatDate, getEntryImage, getEntryTitle, typeLabel } from "../utils/journalUtils";

export const OverlayEntryCard = ({ entry, onClick }) => {
  const theme = useTheme();
  const meta = entry.metadata || {};
  const firstImage = getEntryImage(entry);
  const title = getEntryTitle(entry);
  const dateLabel = formatDate(meta.date || entry.createdAt);
  const typeInfo = typeLabel[entry.type] || { chip: "Entrée", color: "default" };

  return (
    <Paper
      onClick={onClick}
      variant="outlined"
      sx={{
        position: "relative", aspectRatio: "16/9", overflow: "hidden", cursor: "pointer",
        display: "flex", flexDirection: "column", justifyContent: "flex-end",
        transition: "transform 0.2s, box-shadow 0.2s",
        "&:hover": {
          transform: "translateY(-3px)",
          boxShadow: `0 8px 20px ${alpha(theme.palette.common.black, 0.08)}`,
          "& .overlay-image": { transform: "scale(1.05)" },
        },
      }}
    >
      <Box
        className="overlay-image"
        sx={{
          position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
          transition: "transform 0.3s ease-out",
          background: alpha(theme.palette.divider, 0.05),
        }}
      >
        {firstImage ? (
          <img src={firstImage} alt={title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <Stack sx={{ width: "100%", height: "100%", alignItems: "center", justifyContent: "center", color: "text.secondary", opacity: 0.5 }}>
            <PhotoIcon sx={{ fontSize: 60 }} />
          </Stack>
        )}
      </Box>
      <Box
        sx={{
          position: "absolute", bottom: 0, left: 0, width: "100%", height: "80%",
          background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.6) 40%, rgba(0,0,0,0) 100%)",
          opacity: theme.palette.mode === 'dark' ? 0.8 : 1,
        }}
      />
      <Stack spacing={1} sx={{ p: { xs: 2, md: 2.5 }, position: "relative", zIndex: 2, color: "#FFFFFF" }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
          <Chip
            label={typeInfo.chip} size="small" color={typeInfo.color} variant="filled"
            sx={{ backgroundColor: alpha(theme.palette[typeInfo.color].main, 0.8), color: "#FFF" }}
          />
          <Typography variant="caption" noWrap sx={{ fontFamily: "monospace", color: alpha("#FFF", 0.8) }}>
            {dateLabel}
          </Typography>
        </Stack>
        <Typography variant="h6" fontWeight={600} title={title} sx={{ lineHeight: 1.3, color: "#FFFFFF" }}>
          {title}
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 500, color: alpha("#FFF", 0.9) }}>
          {meta.symbol || "N/A"}
        </Typography>
      </Stack>
    </Paper>
  );
};
export default OverlayEntryCard;