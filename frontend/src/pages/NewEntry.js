import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import InsightsIcon from "@mui/icons-material/Insights";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import { Box, Chip, Stack, Typography } from "@mui/material";
import InputArea from "../components/InputArea";

const badges = [
  { icon: <AutoAwesomeIcon fontSize="small" />, label: "Analyse IA instantanée" },
  { icon: <InsightsIcon fontSize="small" />, label: "Structuration pro" },
  { icon: <RocketLaunchIcon fontSize="small" />, label: "Focus performance" },
];

const NewEntry = () => {
  return (
    <Stack spacing={6} alignItems="stretch">
      <Stack
        spacing={3}
        sx={{
          flex: 1,
          maxWidth: { lg: 780 },
        }}
      >
        <Box>
          <Typography variant="h3" color="primary">
            Nouvelle analyse / Trade
          </Typography>
          <Typography variant="body1" color="text.secondary" maxWidth={640} sx={{ mt: 2 }}>
            Capture ta réflexion, structure ton plan et laisse TradeForge générer une fiche claire pour ton journal.
            L’assistant détecte le type de contenu, hiérarchise les informations clés et prépare ta revue post-trade.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
          {badges.map(({ icon, label }) => (
            <Chip
              key={label}
              icon={icon}
              label={label}
              sx={{ bgcolor: "rgba(39, 58, 150, 0.08)", fontWeight: 600 }}
            />
          ))}
        </Stack>
      </Stack>

      <InputArea />
    </Stack>
  );
};

export default NewEntry;
