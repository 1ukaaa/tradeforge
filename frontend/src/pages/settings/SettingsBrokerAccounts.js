import { Alert, Box, Button, Chip, CircularProgress, Grid, IconButton, Paper, Snackbar, Stack, TextField, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import { useEffect, useState } from "react";
import { ForgeCard } from "../../components/ForgeUI";
import {
  createBrokerAccount,
  fetchBrokerAccounts,
  syncBrokerAccount,
} from "../../services/brokerClient";

const getDefaultForm = (type) => {
  if (type === "hyperliquid") {
    return {
      type,
      name: "",
      currency: "USDT",
      color: "#8b5cf6",
      initialBalance: 5000,
      address: "",
    };
  }
  return {
    type: "mt5",
    name: "",
    currency: "EUR",
    color: "#6366f1",
    initialBalance: 100000,
    login: "",
    password: "",
    server: "",
  };
};

const SettingsBrokerAccounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [formState, setFormState] = useState(getDefaultForm("mt5"));
  const [submitting, setSubmitting] = useState(false);
  const [syncingAccountId, setSyncingAccountId] = useState(null);
  const [syncSuccess, setSyncSuccess] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" });

  const loadAccounts = () => {
    setLoading(true);
    setError(null);
    fetchBrokerAccounts()
      .then(setAccounts)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const handleFormChange = (field) => (event) => {
    setFormState((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleTypeChange = (_, newType) => {
    if (!newType) return;
    setFormState(getDefaultForm(newType));
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      if (formState.type === "mt5" && (!formState.login || !formState.password || !formState.server)) {
        throw new Error("Login, mot de passe et serveur MT5 sont requis.");
      }
      if (formState.type === "hyperliquid" && !formState.address) {
        throw new Error("L'adresse HyperLiquid est requise.");
      }
      await createBrokerAccount(formState);
      setSuccess("Compte ajouté. Lancez une synchronisation pour récupérer les trades.");
      setSnackbar({ open: true, message: "Compte ajouté avec succès.", severity: "success" });
      setFormState(getDefaultForm(formState.type));
      loadAccounts();
    } catch (err) {
      setError(err.message);
      setSnackbar({ open: true, message: err.message, severity: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSync = async (accountId) => {
    setSyncingAccountId(accountId);
    setError(null);
    setSyncSuccess(null);
    try {
      const result = await syncBrokerAccount(accountId);
      const inserted = result?.tradesCount ?? 0;
      const retrieved = result?.retrievedCount ?? inserted;
      const message = inserted > 0
        ? `${inserted} nouveau(x) trade(s) importé(s).`
        : `Aucun nouveau trade (${retrieved} récupéré(s) depuis l'API).`;
      setSyncSuccess(message);
      setSnackbar({
        open: true,
        message,
        severity: inserted > 0 ? "success" : "info",
      });
      loadAccounts();
    } catch (err) {
      setError(err.message);
      setSnackbar({ open: true, message: err.message, severity: "error" });
    } finally {
      setSyncingAccountId(null);
    }
  };

  const handleCloseSnackbar = (_, reason) => {
    if (reason === "clickaway") return;
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  return (
    <Stack spacing={3}>
      <ForgeCard
        title="Ajouter un compte"
        subtitle="CONNEXIONS BROKER"
        helper="Choisissez votre type de compte (HyperLiquid ou MT5) et configurez ses identifiants."
      >
        <Stack spacing={2}>
          <ToggleButtonGroup
            color="primary"
            exclusive
            value={formState.type}
            onChange={handleTypeChange}
            size="small"
          >
            <ToggleButton value="mt5">MT5 / FTMO</ToggleButton>
            <ToggleButton value="hyperliquid">HyperLiquid</ToggleButton>
          </ToggleButtonGroup>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Nom du compte"
                value={formState.name}
                onChange={handleFormChange("name")}
                fullWidth
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <TextField
                label="Devise"
                value={formState.currency}
                onChange={handleFormChange("currency")}
                fullWidth
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <TextField
                label="Solde initial"
                type="number"
                value={formState.initialBalance}
                onChange={handleFormChange("initialBalance")}
                fullWidth
              />
            </Grid>
            {formState.type === "mt5" ? (
              <>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Login MT5"
                    value={formState.login}
                    onChange={handleFormChange("login")}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Mot de passe (lecture seule)"
                    type="password"
                    value={formState.password}
                    onChange={handleFormChange("password")}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Serveur"
                    placeholder="FTMO-Demo1"
                    value={formState.server}
                    onChange={handleFormChange("server")}
                    fullWidth
                  />
                </Grid>
              </>
            ) : (
              <Grid item xs={12}>
                <TextField
                  label="Adresse HyperLiquid"
                  value={formState.address}
                  onChange={handleFormChange("address")}
                  helperText="Entrez l'adresse publique du compte HyperLiquid"
                  fullWidth
                />
              </Grid>
            )}
          </Grid>

          {error && (
            <Typography color="error" variant="body2">
              {error}
            </Typography>
          )}
          {success && (
            <Typography color="success.main" variant="body2">
              {success}
            </Typography>
          )}
          {syncSuccess && (
            <Typography color="success.main" variant="body2">
              {syncSuccess}
            </Typography>
          )}

          <Box>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? "Ajout en cours..." : "Ajouter le compte"}
            </Button>
          </Box>
        </Stack>
      </ForgeCard>

      <ForgeCard
        title="Synchronisation"
        subtitle="ETAT DES COMPTES"
        helper="Chaque synchronisation importe le solde actuel et les trades fermés."
      >
        {loading ? (
          <Stack alignItems="center" spacing={1}>
            <CircularProgress size={28} />
            <Typography variant="body2" color="text.secondary">
              Chargement des comptes...
            </Typography>
          </Stack>
        ) : accounts.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Aucun compte connecté pour le moment.
          </Typography>
        ) : (
          <Stack spacing={2}>
            {accounts.map((account) => (
              <Paper
                key={account.id}
                variant="outlined"
                sx={{ p: 2, display: "flex", alignItems: "center", justifyContent: "space-between" }}
              >
                <Box>
                  <Typography fontWeight={600}>{account.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {account.provider?.toUpperCase()} • {account.currency} • Dernière synchro :
                    {account.lastSyncAt ? ` ${new Date(account.lastSyncAt).toLocaleString("fr-FR")}` : " jamais"}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip
                    label={account.status || "connecté"}
                    color={account.status === "error" ? "error" : "success"}
                    size="small"
                  />
                  <IconButton
                    onClick={() => handleSync(account.id)}
                    disabled={syncingAccountId === account.id}
                  >
                    {syncingAccountId === account.id ? <CircularProgress size={20} /> : <RefreshIcon />}
                  </IconButton>
                </Stack>
              </Paper>
            ))}
          </Stack>
        )}
      </ForgeCard>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Stack>
  );
};

export default SettingsBrokerAccounts;
