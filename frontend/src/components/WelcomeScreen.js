import { Box, Chip, Stack, Typography, alpha } from "@mui/material";
import BrandLogo from "./BrandLogo";

// Suggestions de prompts pour guider l'utilisateur
const suggestions = [
  "Analyser mon trade sur EUR/USD...",
  "Revue de ma session de Londres...",
  "Quels étaient mes biais sur le NAS100 ce matin ?",
];

/**
 * Affiche l'état vide de la page de chat, inspiré de l'image de "Prodify AI".
 */
const WelcomeScreen = ({ onSuggestionClick }) => {
  return (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        p: 3,
        height: "100%",
      }}
    >
      <BrandLogo glyphSize={60} showText={false} />
      <Typography
        variant="h4"
        sx={{
          fontWeight: 700,
          mt: 2,
          mb: 1,
          background: (theme) =>
            `linear-gradient(135deg, ${theme.palette.text.primary} 0%, ${theme.palette.text.secondary} 100%)`,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        Bonjour. Que souhaitez-vous analyser ?
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Commencez par dicter, coller, ou taper votre analyse de trade.
      </Typography>

      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        mt={6}
        justifyContent="center"
      >
        {suggestions.map((text) => (
          <Chip
            key={text}
            label={text}
            onClick={() => onSuggestionClick(text)}
            sx={{
              p: 2,
              fontSize: "0.9rem",
              fontWeight: 500,
              bgcolor: (theme) => alpha(theme.palette.divider, 0.05),
              border: (theme) => `1px solid ${theme.palette.divider}`,
              transition: "all 0.2s ease",
              "&:hover": {
                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                borderColor: (theme) => alpha(theme.palette.primary.main, 0.3),
                transform: "translateY(-2px)",
              },
            }}
          />
        ))}
      </Stack>
    </Box>
  );
};

export default WelcomeScreen;