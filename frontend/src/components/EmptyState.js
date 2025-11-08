import { Box, Button, Paper, Stack, Typography } from "@mui/material";

const EmptyState = ({ title, description, actionLabel, onAction }) => {
  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 4, md: 6 },
        textAlign: "center",
        background: "linear-gradient(180deg,rgba(255,255,255,0.9) 0%,rgba(239,243,255,0.6) 100%)",
        border: "1px solid rgba(39,58,150,0.08)",
        boxShadow: "0 26px 60px rgba(24, 39, 76, 0.12)",
      }}
    >
      <Stack spacing={3} alignItems="center">
        <Box
          sx={{
            px: 3,
            py: 0.5,
            borderRadius: 99,
            bgcolor: "rgba(39,58,150,0.08)",
            color: "primary.main",
            fontWeight: 600,
          }}
        >
          À venir
        </Box>
        <Typography variant="h4">{title}</Typography>
        <Typography variant="body1" color="text.secondary" maxWidth={420}>
          {description}
        </Typography>
        {actionLabel && (
          <Button variant="contained" color="primary" onClick={onAction}>
            {actionLabel}
          </Button>
        )}
      </Stack>
    </Paper>
  );
};

export default EmptyState;
