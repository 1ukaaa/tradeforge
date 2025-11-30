import { Box, Chip, Stack, Typography, alpha } from "@mui/material";
// Importer 'keyframes' de MUI
import { keyframes } from "@mui/material/styles";
import BrandLogo from "./BrandLogo";

// Suggestions de prompts pour guider l'utilisateur
const suggestions = [
  "Analyse mon dernier trade sur EUR/USD",
  "Vérifie si j'ai respecté mon plan aujourd'hui",
  "Analyse ma psychologie sur cette session",
];

// Définir l'animation de flottement
const floatAnimation = keyframes`
  0% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
  100% {
    transform: translateY(0px);
  }
`;

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
      {/* Appliquer l'animation via la prop 'sx' */}
      <BrandLogo
        glyphSize={60}
        showText={false}
        sx={{
          animation: `${floatAnimation} 3.5s ease-in-out infinite`,

          // BONUS: Respecte l'accessibilité si l'utilisateur préfère
          // ne pas avoir de mouvement.
          '@media (prefers-reduced-motion: reduce)': {
            animation: 'none',
          },
        }}
      />

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
        Assistant TradeForge
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 500 }}>
        Je suis prêt à structurer vos analyses et vérifier votre conformité au plan.
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