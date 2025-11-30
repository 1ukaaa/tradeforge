import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import DescriptionIcon from "@mui/icons-material/Description";
import NotificationsIcon from "@mui/icons-material/Notifications";
import PaletteIcon from "@mui/icons-material/Palette";
import TerminalIcon from "@mui/icons-material/Terminal";
import {
  Box,
  Container,
  Fade,
  Paper,
  Tab,
  Tabs,
  Typography,
  alpha,
  useTheme
} from "@mui/material";
import { useState } from "react";

// Sub-components
import SettingsAppearance from "./settings/SettingsAppearance";
import SettingsBrokerAccounts from "./settings/SettingsBrokerAccounts";
import SettingsPlan from "./settings/SettingsPlan";
import SettingsPromptVariants from "./settings/SettingsPromptVariants";

const Settings = () => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState("brokers");

  const handleTabChange = (_, newValue) => {
    setActiveTab(newValue);
  };

  const MENU_ITEMS = [
    { value: "brokers", label: "Comptes & Brokers", icon: <AccountBalanceWalletIcon />, component: <SettingsBrokerAccounts /> },
    { value: "appearance", label: "Apparence", icon: <PaletteIcon />, component: <SettingsAppearance /> },
    { value: "plan", label: "Plan de Trading", icon: <DescriptionIcon />, component: <SettingsPlan /> },
    { value: "variants", label: "Prompts IA", icon: <TerminalIcon />, component: <SettingsPromptVariants /> },
    { value: "notifications", label: "Notifications", icon: <NotificationsIcon />, component: <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>Bientôt disponible</Box>, disabled: true },
  ];

  const activeItem = MENU_ITEMS.find(item => item.value === activeTab);

  return (
    <Box sx={{ minHeight: "100%", bgcolor: "background.default" }}>
      {/* HERO HEADER */}
      <Box
        sx={{
          pt: { xs: 4, md: 6 },
          pb: { xs: 8, md: 10 }, // Extra padding at bottom for the overlapping tabs
          px: { xs: 2, md: 4 },
          background: theme.forge?.gradients?.hero || "linear-gradient(180deg, #1E1E24 0%, #0A0A0F 100%)",
          borderBottom: `1px solid ${theme.palette.divider}`,
          position: 'relative',
          zIndex: 1
        }}
      >
        <Container maxWidth="xl">
          <Typography
            variant="h3"
            fontWeight={800}
            gutterBottom
            sx={{
              background: "linear-gradient(90deg, #fff, #ccc)",
              backgroundClip: "text",
              textFillColor: "transparent",
            }}
          >
            Paramètres
          </Typography>
          <Typography variant="h6" color="text.secondary" fontWeight={400} sx={{ maxWidth: 600 }}>
            Gérez vos connexions, personnalisez votre expérience et configurez vos assistants IA.
          </Typography>
        </Container>
      </Box>

      {/* MAIN CONTENT CONTAINER */}
      <Container maxWidth="xl" sx={{ mt: -6, pb: 8, position: 'relative', zIndex: 2 }}>

        {/* HORIZONTAL NAVIGATION */}
        <Paper
          elevation={0}
          sx={{
            mb: 4,
            borderRadius: 3,
            border: `1px solid ${theme.palette.divider}`,
            bgcolor: alpha(theme.palette.background.paper, 0.6),
            backdropFilter: "blur(12px)",
            p: 1
          }}
        >
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{
              minHeight: 60,
              "& .MuiTabs-indicator": {
                height: 4,
                borderRadius: "4px 4px 0 0",
                bgcolor: "primary.main",
              },
            }}
          >
            {MENU_ITEMS.map((item) => (
              <Tab
                key={item.value}
                value={item.value}
                label={item.label}
                icon={item.icon}
                iconPosition="start"
                disabled={item.disabled}
                sx={{
                  minHeight: 60,
                  px: 3,
                  fontWeight: activeTab === item.value ? 700 : 500,
                  color: activeTab === item.value ? "text.primary" : "text.secondary",
                  opacity: item.disabled ? 0.5 : 1,
                  "&.Mui-selected": {
                    color: "primary.main",
                  },
                  transition: "all 0.2s",
                }}
              />
            ))}
          </Tabs>
        </Paper>

        {/* CONTENT AREA */}
        <Fade in={true} key={activeTab} timeout={400}>
          <Box>
            {activeItem?.component}
          </Box>
        </Fade>
      </Container>
    </Box>
  );
};

export default Settings;
