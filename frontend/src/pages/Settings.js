// frontend/src/pages/Settings.js
import { Box, Stack, Tab, Tabs, Typography } from "@mui/material";
import { useState } from "react";
// Importer les nouveaux composants de panneau
import SettingsAppearance from "./settings/SettingsAppearance";
import SettingsPlan from "./settings/SettingsPlan";
import SettingsPromptVariants from "./settings/SettingsPromptVariants";
import SettingsBrokerAccounts from "./settings/SettingsBrokerAccounts";

// Nouveau composant pour gérer le panneau d'onglet
const TabPanel = ({ children, value, index }) => (
  <Box role="tabpanel" hidden={value !== index} id={`settings-tabpanel-${index}`} sx={{ pt: 3 }}>
    {value === index && children}
  </Box>
);

const Settings = () => {
  // Démarrer sur les brokers, seul panneau relié aux comptes externes
  const [activeTab, setActiveTab] = useState("brokers"); 

  const handleTabChange = (_, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Stack spacing={3}>
      {/* 1. Titre (remplace le PageHero) */}
      <Typography variant="h2" component="h1" fontWeight={700} sx={{ pt: 2 }}>
        Atelier
      </Typography>

      {/* 2. Barre d'onglets (style de l'image, adaptée au thème) */}
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="Sections des paramètres"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Compte" value="brokers" />
          <Tab label="Apparence" value="appearance" />
          <Tab label="Plan de Trading" value="plan" />
          <Tab label="Prompts (Texte)" value="variants" />
          <Tab label="Notifications" value="notifications" disabled />
        </Tabs>
      </Box>

      {/* 3. Contenu des panneaux */}
      <Box>
        <TabPanel value={activeTab} index="brokers">
          <SettingsBrokerAccounts />
        </TabPanel>
        <TabPanel value={activeTab} index="appearance">
          <SettingsAppearance />
        </TabPanel>
        <TabPanel value={activeTab} index="plan">
          <SettingsPlan />
        </TabPanel>
        <TabPanel value={activeTab} index="variants">
          <SettingsPromptVariants />
        </TabPanel>

      </Box>
    </Stack>
  );
};

export default Settings;
