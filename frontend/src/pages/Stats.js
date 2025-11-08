import { Grid, Paper, Stack, Typography } from "@mui/material";
import QueryStatsIcon from "@mui/icons-material/QueryStats";
import InsightsIcon from "@mui/icons-material/Insights";
import PercentIcon from "@mui/icons-material/Percent";
import EmptyState from "../components/EmptyState";

const metricCards = [
  { label: "Taux de win", value: "—", icon: <PercentIcon color="primary" /> },
  { label: "Risque moyen", value: "—", icon: <QueryStatsIcon color="secondary" /> },
  { label: "RR moyen", value: "—", icon: <InsightsIcon color="primary" /> },
];

const Stats = () => {
  return (
    <Stack spacing={4}>
      <Stack direction="row" spacing={1} alignItems="center">
        <QueryStatsIcon color="primary" fontSize="large" />
        <Typography variant="h3" color="primary">
          Statistiques
        </Typography>
      </Stack>
      <Typography variant="body1" color="text.secondary" maxWidth={580}>
        Visualise tes performances, repère les biais et mesure l’impact des plans IA sur tes prises
        de décision. Les dashboards personnalisés seront disponibles très prochainement.
      </Typography>

      <Grid container spacing={3}>
        {metricCards.map(({ label, value, icon }) => (
          <Grid item xs={12} sm={6} md={4} key={label}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                display: "flex",
                alignItems: "center",
                gap: 2,
                background: "rgba(39,58,150,0.05)",
              }}
            >
              {icon}
              <Stack spacing={0.5}>
                <Typography variant="overline" color="text.secondary">
                  {label}
                </Typography>
                <Typography variant="h5" fontWeight={700}>
                  {value}
                </Typography>
              </Stack>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <EmptyState
        title="Dashboard avancé en préparation"
        description="Connecte ton broker ou importe tes performances pour débloquer les graphiques de suivi."
      />
    </Stack>
  );
};

export default Stats;
