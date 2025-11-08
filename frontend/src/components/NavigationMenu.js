import DashboardCustomizeIcon from "@mui/icons-material/DashboardCustomize";
import InsertChartOutlinedRoundedIcon from "@mui/icons-material/InsertChartOutlinedRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import TaskAltRoundedIcon from "@mui/icons-material/TaskAltRounded";
import { Box, Chip, Paper, Stack, Typography } from "@mui/material";
import { NavLink, useLocation } from "react-router-dom";
import BrandLogo from "./BrandLogo";

const menuItems = [
  {
    to: "/",
    label: "Nouvelle analyse",
    description: "Créer une fiche IA",
    icon: <TaskAltRoundedIcon />,
  },
  {
    to: "/journal",
    label: "Journal",
    description: "Historique validé",
    icon: <DashboardCustomizeIcon />,
  },
  {
    to: "/stats",
    label: "Statistiques",
    description: "Performance & RR",
    icon: <InsertChartOutlinedRoundedIcon />,
    badge: "Bientôt",
  },
  {
    to: "/settings",
    label: "Paramètres",
    description: "Préférences IA",
    icon: <SettingsRoundedIcon />,
  },
];

const NavigationMenu = () => {
  const location = useLocation();

  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <Box
      sx={{
        width: { xs: "100%", lg: 280 },
        flexShrink: 0,
        position: { lg: "sticky" },
        top: { lg: 56 },
        alignSelf: "flex-start",
      }}
    >
      <Paper
        elevation={0}
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 3,
          p: { xs: 2.5, lg: 3 },
          borderRadius: { xs: 3, lg: 4 },
          background: "linear-gradient(182deg, rgba(255,255,255,0.95) 0%, rgba(231,237,255,0.78) 100%)",
          border: "1px solid rgba(39,58,150,0.12)",
          boxShadow: { lg: "0 28px 72px rgba(20,41,88,0.16)" },
          backdropFilter: "blur(12px)",
        }}
      >
        <Stack spacing={0.5}>
          <BrandLogo glyphSize={48} />
          <Typography variant="caption" color="text.secondary">
            Capture, structure et fais évoluer tes analyses avec l’assistance IA TradeForge.
          </Typography>
        </Stack>

        <Stack spacing={2.5}>
          <Typography variant="overline" color="text.secondary" fontWeight={700} letterSpacing="0.12em">
            Navigation
          </Typography>

          <Stack spacing={1.5}>
            {menuItems.map((item) => {
              const active = isActive(item.to);
              return (
                <Box
                  key={item.to}
                  component={NavLink}
                  to={item.to}
                  style={{ textDecoration: "none" }}
                  sx={{
                    display: "block",
                    borderRadius: 3,
                    background: active
                      ? "linear-gradient(136deg, rgba(28,98,209,0.25) 0%, rgba(129,55,206,0.22) 100%)"
                      : "rgba(255,255,255,0.65)",
                    border: active ? "1px solid rgba(129,55,206,0.36)" : "1px solid rgba(28,40,60,0.06)",
                    boxShadow: active ? "0 18px 32px rgba(30,64,120,0.16)" : "0 6px 20px rgba(23,42,88,0.04)",
                    padding: "12px 16px",
                    transition: "all 0.25s ease",
                    color: active ? "primary.main" : "text.secondary",
                    "&:hover": {
                      borderColor: "rgba(129,55,206,0.4)",
                      boxShadow: "0 22px 36px rgba(30,64,120,0.16)",
                      transform: "translateY(-1px)",
                    },
                  }}
                >
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Box
                      sx={{
                        width: 38,
                        height: 38,
                        borderRadius: 2,
                        display: "grid",
                        placeItems: "center",
                        background: active
                          ? "linear-gradient(140deg,#1C62D1 0%,#8137D0 100%)"
                          : "rgba(27,48,85,0.08)",
                        color: active ? "#fff" : "text.secondary",
                        boxShadow: active ? "0 18px 30px rgba(129,55,206,0.32)" : "none",
                      }}
                    >
                      {item.icon}
                    </Box>
                    <Stack spacing={0.5}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="subtitle2" fontWeight={700} color={active ? "primary.main" : "text.primary"}>
                          {item.label}
                        </Typography>
                        {item.badge && (
                          <Chip
                            label={item.badge}
                            size="small"
                            sx={{
                              height: 18,
                              borderRadius: 999,
                              fontSize: 9,
                              fontWeight: 700,
                              bgcolor: "rgba(129,55,206,0.12)",
                              color: "secondary.main",
                            }}
                          />
                        )}
                      </Stack>
                      <Typography variant="caption" sx={{ color: active ? "primary.main" : "text.secondary", fontSize: 11 }}>
                        {item.description}
                      </Typography>
                    </Stack>
                  </Stack>
                </Box>
              );
            })}
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
};

export default NavigationMenu;
