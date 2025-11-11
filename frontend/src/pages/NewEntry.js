import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import InsightsIcon from "@mui/icons-material/Insights";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import { Box, Button, Chip, Stack, Typography } from "@mui/material";
import InputArea from "../components/InputArea";
import { ForgeCard, MetricBadge, PageHero } from "../components/ForgeUI";

const badges = [
  { icon: <AutoAwesomeIcon fontSize="small" />, label: "Analyse IA instantanée" },
  { icon: <InsightsIcon fontSize="small" />, label: "Structuration pro" },
  { icon: <RocketLaunchIcon fontSize="small" />, label: "Focus performance" },
];

const NewEntry = () => {
  return (
    <Stack spacing={5}>
      <PageHero
        eyebrow="MODE CRÉATION"
        title="Forge ta prochaine analyse"
        description="Déverse tes notes brutes, valide le contexte et laisse TradeForge composer une fiche exploitable pour ton journal."
        actions={
          <Button variant="contained" size="large">
            Démarrer une session
          </Button>
        }
        meta={[
          { label: "IA ACTIVE", value: "Prompt Forge v3" },
          { label: "Temps moyen", value: "2 min 40s" },
          { label: "Sessions cette semaine", value: "12" },
        ]}
      />

      <ForgeCard
        subtitle="SIGNATURE"
        title="Ce que l’assistant prend en charge"
        helper="Chaque brief déclenche une structuration automatique en 3 temps."
      >
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          {badges.map(({ icon, label }) => (
            <Chip
              key={label}
              icon={icon}
              label={label}
              sx={{ flex: 1, bgcolor: "rgba(116,246,214,0.12)", fontWeight: 600 }}
            />
          ))}
        </Stack>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          sx={{ mt: 3 }}
        >
          <MetricBadge label="Structuration" value="Plan IA validé" tone="positive" />
          <MetricBadge label="Risque moyen" value="1.2R" />
          <MetricBadge label="Discipline" value="82%" />
        </Stack>
      </ForgeCard>

      <ForgeCard
        subtitle="ASSISTANT"
        title="Brief & capture"
        helper="Colle tes notes, charge des captures ou dicte ton plan : l’assistant détecte automatiquement s’il s’agit d’un trade ou d’une analyse."
      >
        <InputArea />
      </ForgeCard>
    </Stack>
  );
};

export default NewEntry;
