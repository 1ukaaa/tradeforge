// frontend/src/components/JournalHeroMinimal.js
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import { Box, Stack, Typography } from "@mui/material";

const JournalHeroMinimal = () => {
  return (
    <Box sx={{ p: { xs: 2, md: 3 }, position: "relative", overflow: "hidden", borderRadius: 4 }}>
      <InsightsRoundedIcon
        sx={{
          position: "absolute", top: -50, right: -40, fontSize: 250,
          opacity: 0.04, color: "primary.main",
          transform: "rotate(-20deg)", pointerEvents: "none",
        }}
      />
      <Stack spacing={1}>
        <Typography variant="overline" color="primary.main" letterSpacing="0.2em" fontWeight={600}>
          Journal
        </Typography>
        <Typography variant="h2" component="h1" fontWeight={700}>
          Mon Journal de Trading
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 640 }}>
          Revoyez vos analyses et vos trades pour affiner votre stratégie.
        </Typography>
      </Stack>
    </Box>
  );
};
export default JournalHeroMinimal;