import { Box, Grid, Stack, Typography } from "@mui/material";
import InputArea from "../components/InputArea";
import TradingPlanWidget from "../components/TradingPlanWidget"; // <-- 1. Importer le nouveau widget

/**
 * VERSION 5: "Le Studio Divisé" (Implémenté)
 *
 * Philosophie : La meilleure UX. On sépare l'interface en deux.
 * L'outil de capture à gauche, le plan de trading (fixe) à droite.
 * L'utilisateur n'a plus à basculer entre les onglets.
 */
const NewEntry = () => {
  return (
    <Grid container spacing={4}>
      {/* === COLONNE DE GAUCHE : CAPTURE & ANALYSE === */}
      <Grid item xs={12} md={7} lg={8}>
        <Stack spacing={4}>
          <Box>
            <Typography variant="h2" component="h1" sx={{ fontWeight: 700 }}>
              Nouvelle Entrée
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ maxWidth: 640 }}
            >
              Dicte ou colle ton analyse. Ton plan de trading est visible sur la
              droite pour t'aider à rester aligné.
            </Typography>
          </Box>

          {/* 2. L'InputArea ne contient plus que la capture
               et l'affichage de la réponse IA.
          */}
          <InputArea />
        </Stack>
      </Grid>

      {/* === COLONNE DE DROITE : PLAN DE TRADING (STICKY) === */}
      {/* 3. On ajoute la colonne de droite */}
      <Grid
        item
        xs={12}
        md={5}
        lg={4}
        // S'affiche en bas sur mobile, à droite sur desktop
        sx={{ order: { xs: 1, md: 2 } }}
      >
        <TradingPlanWidget />
      </Grid>
    </Grid>
  );
};

export default NewEntry;