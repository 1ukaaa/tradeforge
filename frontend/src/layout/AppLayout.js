import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import { Box, Drawer, IconButton, Stack, useMediaQuery, useTheme } from "@mui/material";
import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import BrandLogo from "../components/BrandLogo";
import NavigationMenu from "../components/NavigationMenu";

const AppLayout = () => {
  const location = useLocation();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("lg"));
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // LISTE DES PAGES "IMMERSIVES" (Sans marges, prennent tout l'écran)
  const isFullScreenApp = [
    "/tradeforge-ai",
    "/twitter",
    "/discord"
  ].includes(location.pathname);

  const isDashboardPage = ["/", "/dashboard"].includes(location.pathname);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: (theme) => theme.palette.background.default,
        display: "flex",
        flexDirection: { xs: "column", lg: "row" },
      }}
    >
      {isDesktop ? (
        <NavigationMenu />
      ) : (
        <>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{
              position: "sticky",
              top: 0,
              zIndex: (theme) => theme.zIndex.appBar,
              px: 2,
              py: 1.5,
              backgroundColor: (theme) => theme.palette.background.default,
              borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
              boxShadow: (theme) =>
                theme.palette.mode === "dark"
                  ? "0 6px 20px rgba(0,0,0,0.35)"
                  : "0 6px 20px rgba(15,23,42,0.08)",
            }}
          >
            <BrandLogo glyphSize={32} showText={false} />
            <IconButton
              aria-label="Ouvrir le menu de navigation"
              onClick={() => setMobileNavOpen(true)}
            >
              <MenuRoundedIcon />
            </IconButton>
          </Stack>

          <Drawer
            anchor="left"
            open={mobileNavOpen}
            onClose={() => setMobileNavOpen(false)}
            PaperProps={{
              sx: {
                width: 320,
                maxWidth: "90vw",
                background: (theme) => theme.palette.background.default,
                borderRight: (theme) => `1px solid ${theme.palette.divider}`,
              },
            }}
          >
            <Box sx={{ position: "relative", height: "100%" }}>
              <IconButton
                aria-label="Fermer le menu"
                onClick={() => setMobileNavOpen(false)}
                sx={{ position: "absolute", top: 8, right: 8 }}
              >
                <CloseRoundedIcon />
              </IconButton>
              <NavigationMenu
                onNavigate={() => setMobileNavOpen(false)}
                showBrand={false}
              />
            </Box>
          </Drawer>
        </>
      )}

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
              p: isDashboardPage ? 0 : { xs: 2, sm: 3, md: 4, lg: 6 },
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
