// frontend/src/components/FocusEntryCard.js
import PhotoIcon from "@mui/icons-material/Photo";
import { alpha, Box, CardActionArea, Chip, Paper, Stack, Typography, useTheme } from "@mui/material";
import { formatDate, getEntryImage, getEntryTitle, resultTone, typeLabel } from "../utils/journalUtils";

export const FocusEntryCard = ({ entry, onClick }) => {
  const theme = useTheme();
  const meta = entry.metadata || {};
  const firstImage = getEntryImage(entry);
  const title = getEntryTitle(entry);
  const dateLabel = formatDate(meta.date || entry.createdAt);
  const typeInfo = typeLabel[entry.type] || { chip: "Entrée", color: "default" };
  const resultLabel = meta.result || "N/A";
  const symbol = meta.symbol || "N/A";

  const borderColor = theme.palette[typeInfo.color]?.main || theme.palette.divider;

  return (
    <Paper
      onClick={onClick}
      variant="outlined"
      sx={{
        display: "flex", flexDirection: "column", overflow: "hidden", cursor: "pointer",
        borderLeft: "4px solid", borderColor: borderColor,
        transition: "transform 0.2s, box-shadow 0.2s",
        "&:hover": {
          transform: "translateY(-3px)",
          boxShadow: `0 8px 20px ${alpha(theme.palette.common.black, 0.08)}`,
        },
      }}
    >
      <CardActionArea component="div" tabIndex={-1} disableRipple>
        <Box
          sx={{
            width: "100%", flexShrink: 0, aspectRatio: "21/9", position: "relative",
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
        <Stack spacing={1.5} sx={{ p: { xs: 2, md: 2.5 }, flex: 1 }}>
          <Typography variant="h5" fontWeight={600} sx={{ lineHeight: 1.3 }}>
            {title}
          </Typography>
          <Stack
            direction="row" justifyContent="space-between" alignItems="center"
            spacing={2} flexWrap="wrap"
            sx={{ borderTop: "1px dashed", borderColor: "divider", pt: 1.5 }}
          >
            <Typography variant="body2" color="text.primary" sx={{ fontWeight: 500 }}>
              {symbol}
            </Typography>
            <Chip label={resultLabel} size="small" color={resultTone(resultLabel)} />
            <Typography variant="caption" color="text.secondary" noWrap sx={{ fontFamily: "monospace" }}>
              {dateLabel}
            </Typography>
          </Stack>
        </Stack>
      </CardActionArea>
    </Paper>
  );
};
export default FocusEntryCard;