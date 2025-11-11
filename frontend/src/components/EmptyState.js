import { Box, Button, Stack, Typography } from "@mui/material";
import { ForgeCard } from "./ForgeUI";

const EmptyState = ({ title, description, actionLabel, onAction }) => {
  return (
    <ForgeCard
      subtitle="EN VEILLE"
      title={title}
      helper="TradeForge n’a pas encore forgé cette zone."
      glow
      sx={{ textAlign: "center", alignItems: "center" }}
    >
      <Stack spacing={3} alignItems="center">
        <Box
          sx={{
            px: 3.5,
            py: 0.5,
            borderRadius: 999,
            bgcolor: "rgba(116,246,214,0.12)",
            color: "primary.main",
            fontWeight: 600,
            letterSpacing: "0.25em",
          }}
        >
          À VENIR
        </Box>
        <Typography variant="body1" color="text.secondary" maxWidth={420}>
          {description}
        </Typography>
        {actionLabel && (
          <Button variant="contained" color="primary" onClick={onAction}>
            {actionLabel}
          </Button>
        )}
      </Stack>
    </ForgeCard>
  );
};

export default EmptyState;
