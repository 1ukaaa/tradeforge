import { Box, Button, Stack, Typography } from "@mui/material";
import QueryStatsIcon from "@mui/icons-material/QueryStats";
import InsightsIcon from "@mui/icons-material/Insights";
import PercentIcon from "@mui/icons-material/Percent";
import EmptyState from "../components/EmptyState";
import { ForgeCard, MetricBadge, PageHero, SectionHeading } from "../components/ForgeUI";

const metricCards = [
  { label: "Win rate", value: "62%", icon: <PercentIcon color="primary" /> },
  { label: "Risque moyen", value: "1.1R", icon: <QueryStatsIcon color="secondary" /> },
  { label: "RR moyen", value: "2.6R", icon: <InsightsIcon color="primary" /> },
];

const Stats = () => {
  return (
    <Stack spacing={5}>
      <PageHero
        eyebrow="INTELLIGENCE"
        title="Stats & biais à corriger"
        description="Connecte ton broker, synchronise tes journaux et laisse TradeForge isoler les patterns qui font gagner (ou perdre) des points de discipline."
        actions={
          <Button variant="contained" size="large">
            Connecter un broker
          </Button>
        }
        meta={[
          { label: "Sessions suivies", value: "34" },
          { label: "Biais détectés", value: "5" },
          { label: "Dernière sync", value: "il y a 2h" },
        ]}
      />

      <ForgeCard subtitle="KPIS" title="Vue instantanée" helper="Les chiffres ci-dessous se mettent à jour après chaque review.">
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          {metricCards.map(({ label, value, icon }) => (
            <Stack key={label} spacing={1} sx={{ flex: 1 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                {icon}
                <Typography variant="subtitle2">{label}</Typography>
              </Stack>
              <MetricBadge label="VALEUR" value={value} tone="positive" />
            </Stack>
          ))}
        </Stack>
      </ForgeCard>

      <ForgeCard
        subtitle="VUE EN COURS"
        title="Distribution des performances"
        helper="Chargement automatique dès que des données seront reliées."
      >
        <Box
          sx={{
            borderRadius: 4,
            minHeight: 260,
            background: "radial-gradient(circle at 10% 10%, rgba(116,246,214,0.25), transparent 45%), rgba(255,255,255,0.02)",
            border: "1px dashed rgba(255,255,255,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Importe tes trades pour afficher les heatmaps, cohortes et biais temporels.
          </Typography>
        </Box>
      </ForgeCard>

      <EmptyState
        title="Dashboard avancé en préparation"
        description="Connecte ton broker ou importe tes performances pour débloquer les graphiques de suivi."
        actionLabel="Importer un CSV"
        onAction={() => (window.location.href = "/settings")}
      />
    </Stack>
  );
};

export default Stats;
