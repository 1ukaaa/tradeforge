import { Box } from "@mui/material";
import { Outlet, useLocation } from "react-router-dom";
import NavigationMenu from "../components/NavigationMenu";

const AppLayout = () => {
  const location = useLocation();
  
  // LISTE DES PAGES "IMMERSIVES" (Sans marges, prennent tout l'écran)
  const isFullScreenApp = [
    "/", 
    "/twitter", 
    "/discord"
  ].includes(location.pathname);

  const isDashboardPage = location.pathname === "/dashboard";

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: (theme) => theme.palette.background.default,
        display: "flex",
        flexDirection: { xs: "column", lg: "row" },
      }}
    >
      <NavigationMenu />
      
      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flex: 1,
          // Force la hauteur écran sur Desktop pour les apps immersives
          height: isFullScreenApp ? { lg: "100vh" } : "auto", 
          maxHeight: { lg: "100vh" },
          
          // Si c'est une App (Twitter, Chat), on coupe le scroll global 
          // pour laisser le composant gérer ses propres zones de scroll
          overflowY: isFullScreenApp ? "hidden" : "auto", 
          
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {isFullScreenApp ? (
          // VUE "APP" : On rend le composant direct (0 contrainte de largeur/padding)
          <Outlet /> 
        ) : (
          // VUE "DOCUMENT" : On garde le conteneur centré avec padding pour le reste
          <Box
            sx={{
              width: "100%",
              maxWidth: isDashboardPage ? "none" : { lg: 980, xl: 1080 },
              mx: isDashboardPage ? 0 : "auto",
              p: isDashboardPage ? { xs: 1, md: 2 } : { xs: 2, md: 4, lg: 6 }, 
              pb: { xs: 4, md: 6 },
            }}
          >
            <Outlet />
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default AppLayout;