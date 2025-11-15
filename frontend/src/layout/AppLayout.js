import { Box } from "@mui/material";
import { Outlet, useLocation } from "react-router-dom";
import NavigationMenu from "../components/NavigationMenu";

const AppLayout = () => {
  const location = useLocation();
  // La page NewEntry ("/") aura une mise en page spéciale
  const isChatPage = location.pathname === "/";
  const isDashboardPage = location.pathname === "/dashboard";

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: (theme) => theme.palette.background.default, // Utiliser le fond par défaut
        display: "flex",
        flexDirection: { xs: "column", lg: "row" },
      }}
    >
      <NavigationMenu />
      
      {/* Le conteneur de contenu principal */}
      <Box
        component="main"
        sx={{
          flex: 1,
          maxHeight: { lg: "100vh" },
          // Si c'est la page de chat, on la laisse gérer son propre layout flex
          overflowY: isChatPage ? "hidden" : "auto", // Scroll pour les autres pages
          minWidth: 0, // Correction pour flexbox
          display: "flex", // Permet à la page de chat de s'étendre
          flexDirection: "column",
        }}
      >
        {/*
          Si c'est la page de chat, on lui donne une structure flex
          pour le "sticky footer".
          Sinon, on utilise un conteneur centré standard.
        */}
        {isChatPage ? (
          <Outlet /> // NewEntry.js gérera sa propre structure
        ) : (
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
