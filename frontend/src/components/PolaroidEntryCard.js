// frontend/src/components/PolaroidEntryCard.js
import PhotoIcon from "@mui/icons-material/Photo";
import { alpha, Box, Chip, Paper, Stack, Typography, useTheme } from "@mui/material";
import { formatDate, getEntryImage, getEntryTitle, typeLabel } from "../utils/journalUtils";

export const PolaroidEntryCard = ({ entry, onClick }) => {
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
        display: "flex", flexDirection: "column", overflow: "hidden", cursor: "pointer",
        transition: "transform 0.2s, box-shadow 0.2s", height: "100%",
        "&:hover": {
          transform: "translateY(-3px)",
          boxShadow: `0 8px 20px ${alpha(theme.palette.common.black, 0.08)}`,
        },
      }}
    >
      <Box sx={{ width: "100%", flexShrink: 0, aspectRatio: "1/1", position: "relative", background: alpha(theme.palette.divider, 0.05) }}>
        {firstImage ? (
          <img src={firstImage} alt={title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <Stack sx={{ width: "100%", height: "100%", alignItems: "center", justifyContent: "center", color: "text.secondary", opacity: 0.5 }}>
            <PhotoIcon sx={{ fontSize: 60 }} />
          </Stack>
        )}
      </Box>
      <Stack spacing={1} sx={{ p: 2, flex: 1, borderTop: "1px solid", borderColor: "divider" }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
          <Typography variant="caption" color="text.secondary" noWrap>
            {dateLabel}
          </Typography>
          <Chip label={typeInfo.chip} size="small" color={typeInfo.color} variant="outlined" />
        </Stack>
        <Typography variant="h6" fontWeight={600} sx={{ lineHeight: 1.3, flex: 1 }}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.primary" sx={{ fontWeight: 500 }}>
          {meta.symbol || "N/A"}
        </Typography>
      </Stack>
    </Paper>
  );
};
export default PolaroidEntryCard;