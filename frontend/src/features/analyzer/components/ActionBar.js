import CircularProgress from "@mui/material/CircularProgress";
import { Alert, Button, Stack } from "@mui/material";
import QueryStatsIcon from "@mui/icons-material/QueryStats";

const ActionBar = ({ disabled, loading, onSubmit, error }) => {
  return (
    <Stack spacing={2}>
      <Button
        variant="contained"
        size="large"
        onClick={onSubmit}
        disabled={disabled || loading}
        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <QueryStatsIcon />}
        sx={{
          alignSelf: { xs: "stretch", md: "flex-end" },
          px: 6,
          py: 2.2,
          borderRadius: 4,
          background: "linear-gradient(120deg,#1C62D1 0%,#8037CE 100%)",
          boxShadow: "0 28px 60px rgba(128,55,206,0.22)",
        }}
      >
        {loading ? "Analyse en cours…" : "Analyser avec Gemini"}
      </Button>
      {error && (
        <Alert severity="error" sx={{ borderRadius: 3 }}>
          {error}
        </Alert>
      )}
    </Stack>
  );
};

export default ActionBar;
