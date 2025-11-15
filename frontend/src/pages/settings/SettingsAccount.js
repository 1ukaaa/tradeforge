// frontend/src/pages/settings/SettingsAccount.js
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  MenuItem,
  Stack,
  TextField
} from "@mui/material";
import { useEffect, useState } from "react";
import { ForgeCard } from "../../components/ForgeUI";
import { fetchSettings, saveSettings } from "../../services/settingsClient";

// Helper pour les symboles
const currencySymbols = {
  USD: "$",
  EUR: "€",
  JPY: "¥",
  GBP: "£",
};

const SettingsAccount = () => {
  const [name, setName] = useState("Luka");
  const [forex, setForex] = useState(0);
  const [crypto, setCrypto] = useState(0);
  
  // Remplacement de l'état unique 'currency' par two états
  const [forexCurrency, setForexCurrency] = useState("EUR"); // NOUVEL ÉTAT
  const [cryptoCurrency, setCryptoCurrency] = useState("USD"); // NOUVEL ÉTAT

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Charger les données au montage
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const settings = await fetchSettings();
        setName(settings.accountName);
        setForex(settings.capitalForex);
        setCrypto(settings.capitalCrypto);
        // Mettre à jour les deux états de devises
        setForexCurrency(settings.capitalForexCurrency); // NOUVEAU
        setCryptoCurrency(settings.capitalCryptoCurrency); // NOUVEAU
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Gérer la sauvegarde
  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const capitalForexNum = parseFloat(forex) || 0;
      const capitalCryptoNum = parseFloat(crypto) || 0;

      await saveSettings({
        accountName: name,
        capitalForex: capitalForexNum,
        capitalCrypto: capitalCryptoNum,
        capitalForexCurrency: forexCurrency, // NOUVEAU
        capitalCryptoCurrency: cryptoCurrency, // NOUVEAU
      });

      setForex(capitalForexNum);
      setCrypto(capitalCryptoNum);
      setSuccess("Paramètres du compte enregistrés.");

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !success && !error) {
    return (
      <ForgeCard title="Compte" subtitle="GESTION DU COMPTE">
        <CircularProgress />
      </ForgeCard>
    );
  }

  // Helper pour générer les options de devise
  const renderCurrencyOptions = (currentCurrency) => {
    const options = Object.entries(currencySymbols).map(([code, symbol]) => (
      <MenuItem key={code} value={code}>
        {code} ({symbol})
      </MenuItem>
    ));
    
    // Assurer que la devise chargée (si non standard) est visible
    if (!currencySymbols[currentCurrency]) {
      options.push(
         <MenuItem key={currentCurrency} value={currentCurrency}>
           {currentCurrency}
         </MenuItem>
      );
    }
    return options;
  };

  return (
    <ForgeCard
      title="Compte"
      subtitle="GESTION DU COMPTE"
      helper="Définissez le nom du compte et les capitaux initiaux pour le suivi du dashboard."
    >
      <Stack spacing={3} sx={{ maxWidth: 600 }}>
        <TextField
          label="Nom du Compte"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={loading}
          fullWidth
        />
        
        {/* --- Section Forex --- */}
        <Stack direction="row" spacing={2}>
          <TextField
            label="Capital de base (Forex)"
            type="number"
            value={forex}
            onChange={(e) => setForex(e.target.value)}
            helperText="Montant initial pour le marché Forex."
            disabled={loading}
            fullWidth
            InputProps={{
              startAdornment: (
                <Box sx={{ pr: 1, opacity: 0.6 }}>
                  {currencySymbols[forexCurrency] || forexCurrency}
                </Box>
              ),
            }}
          />
          <TextField
            select
            label="Devise"
            value={forexCurrency}
            onChange={(e) => setForexCurrency(e.target.value)}
            disabled={loading}
            sx={{ minWidth: 120 }}
          >
            {renderCurrencyOptions(forexCurrency)}
          </TextField>
        </Stack>

        {/* --- Section Crypto --- */}
        <Stack direction="row" spacing={2}>
          <TextField
            label="Capital de base (Crypto-monnaie)"
            type="number"
            value={crypto}
            onChange={(e) => setCrypto(e.target.value)}
            helperText="Montant initial pour le marché des crypto-monnaies."
            disabled={loading}
            fullWidth
            InputProps={{
              startAdornment: (
                <Box sx={{ pr: 1, opacity: 0.6 }}>
                  {currencySymbols[cryptoCurrency] || cryptoCurrency}
                </Box>
              ),
            }}
          />
          <TextField
            select
            label="Devise"
            value={cryptoCurrency}
            onChange={(e) => setCryptoCurrency(e.target.value)}
            disabled={loading}
            sx={{ minWidth: 120 }}
          >
            {renderCurrencyOptions(cryptoCurrency)}
          </TextField>
        </Stack>


        {error && <Alert severity="error">{error}</Alert>}
        {success && <Alert severity="success">{success}</Alert>}

        <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
          <Button 
            variant="contained" 
            onClick={handleSubmit} 
            disabled={loading}
          >
            {loading ? "Enregistrement..." : "Enregistrer les modifications"}
          </Button>
        </Box>
      </Stack>
    </ForgeCard>
  );
};

export default SettingsAccount;