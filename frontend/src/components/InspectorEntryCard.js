// frontend/src/components/InspectorEntryCard.js
import PhotoIcon from "@mui/icons-material/Photo";
import { alpha, Box, Chip, Paper, Stack, Typography, useTheme } from "@mui/material";
import { formatDate, getEntryImage, getEntryTitle, resultTone, typeLabel } from "../utils/journalUtils";

export const InspectorEntryCard = ({ entry, onClick }) => {
  const theme = useTheme();
  const meta = entry.metadata || {};
  const firstImage = getEntryImage(entry);
  const title = getEntryTitle(entry);
  const dateLabel = formatDate(meta.date || entry.createdAt);
  const typeInfo = typeLabel[entry.type] || { chip: "Entrée", color: "default" };
  const resultLabel = meta.result || "N/A";
  const symbol = meta.symbol || "N/A";

  return (
    <Paper
      onClick={onClick}
      variant="outlined"
      sx={{
        display: "flex", flexDirection: "row", overflow: "hidden", cursor: "pointer",
        transition: "transform 0.2s, box-shadow 0.2s",
        "&:hover": {
          transform: "translateY(-3px)",
          boxShadow: `0 8px 20px ${alpha(theme.palette.common.black, 0.08)}`,
        },
      }}
    >
      <Box
        sx={{
          width: { xs: 120, sm: 160, md: 200 }, flexShrink: 0, aspectRatio: "16/10",
          position: "relative", background: alpha(theme.palette.divider, 0.05),
          borderRight: "1px solid", borderColor: "divider",
        }}
      >
        {firstImage ? (
          <img src={firstImage} alt={title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <Stack sx={{ width: "100%", height: "100%", alignItems: "center", justifyContent: "center", color: "text.secondary", opacity: 0.5 }}>
            <PhotoIcon sx={{ fontSize: 40 }} />
          </Stack>
        )}
      </Box>
      <Stack spacing={1.5} sx={{ p: { xs: 2, md: 2.5 }, flex: 1, minWidth: 0, justifyContent: "center" }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
          <Chip label={typeInfo.chip} size="small" color={typeInfo.color} variant="outlined" />
          <Typography variant="caption" color="text.secondary" noWrap sx={{ fontFamily: "monospace" }}>
            {dateLabel}
          </Typography>
        </Stack>
        <Typography variant="h6" fontWeight={600} noWrap title={title} sx={{ lineHeight: 1.3 }}>
          {title}
        </Typography>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ borderTop: "1px dashed", borderColor: "divider", pt: 1.5 }}>
          <Typography variant="body2" color="text.primary" sx={{ fontWeight: 500 }}>
            {symbol}
          </Typography>
          <Chip label={resultLabel} size="small" color={resultTone(resultLabel)} />
        </Stack>
      </Stack>
    </Paper>
  );
};
export default InspectorEntryCard;