import { Box, Grid, Stack, Typography } from "@mui/material";
import InputArea from "../components/InputArea"; // Ce sera le NOUVEL InputArea (Fichier 2)

/**
 * VERSION 4: "Le Studio Divisé"
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
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 640 }}>
              Dicte ou colle ton analyse. Ton plan de trading est visible 
              sur la droite pour t'aider à rester aligné.
            </Typography>
          </Box>
          
          {/* L'InputArea (Fichier 2) ne contient plus que la capture
              et l'affichage de la réponse IA. */}
          <InputArea />
        </Stack>
      </Grid>
    </Grid>
  );
};

export default NewEntry;