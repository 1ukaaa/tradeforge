import RefreshIcon from "@mui/icons-material/Refresh";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Grid,
  IconButton,
  Paper,
  Snackbar,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  alpha,
  useTheme
} from "@mui/material";
import { useEffect, useRef, useState } from "react";
import {
  createBrokerAccount,
  fetchBrokerAccounts,
  importBrokerCsv,
  syncBrokerAccount,
} from "../../services/brokerClient";
import { fetchIntegrations } from "../../services/integrationsClient";

const SettingsSection = ({ title, subtitle, children, actions }) => {
  const theme = useTheme();
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        mb: 3,
        borderRadius: 3,
        border: `1px solid ${theme.palette.divider}`,
        bgcolor: alpha(theme.palette.background.paper, 0.4),
        backdropFilter: "blur(10px)",
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={3}>
        <Box>
          <Typography variant="overline" fontWeight={700} color="primary" sx={{ letterSpacing: 1.2 }}>
            {subtitle}
          </Typography>
          <Typography variant="h6" fontWeight={700}>
            {title}
          </Typography>
        </Box>
        {actions && <Box>{actions}</Box>}
      </Stack>
      {children}
    </Paper>
  );
};

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
  };
};

const SettingsBrokerAccounts = () => {
  const theme = useTheme();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [formState, setFormState] = useState(getDefaultForm("mt5"));
  const [submitting, setSubmitting] = useState(false);
  const [syncingAccountId, setSyncingAccountId] = useState(null);
  const [syncSuccess, setSyncSuccess] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" });
  const [importingAccountId, setImportingAccountId] = useState(null);
  const [twitterIntegration, setTwitterIntegration] = useState(null);
  const [loadingIntegrations, setLoadingIntegrations] = useState(true);
  const [integrationsError, setIntegrationsError] = useState(null);
  const fileInputRefs = useRef({});

  const loadAccounts = () => {
    setLoading(true);
    setError(null);
    fetchBrokerAccounts()
      .then(setAccounts)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  const loadIntegrations = () => {
    setLoadingIntegrations(true);
    setIntegrationsError(null);
    fetchIntegrations()
      .then((data) => {
        const fallback = {
          provider: "twitter",
          connected: false,
          hasAccessToken: false,
          hasAccessSecret: false,
          hasApiKey: false,
          hasApiSecret: false,
          publishReady: false,
          handle: null,
        };
        setTwitterIntegration(data.twitter || fallback);
      })
      .catch((err) => setIntegrationsError(err.message))
      .finally(() => setLoadingIntegrations(false));
  };

  useEffect(() => {
    loadAccounts();
    loadIntegrations();
  }, []);

  const isManualAccount = (account) =>
    account?.provider === "ftmo" || account?.metadata?.importMode === "csv";

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
      if (formState.type === "hyperliquid" && !formState.address) {
        throw new Error("L'adresse HyperLiquid est requise.");
      }
      await createBrokerAccount(formState);
      const successMessage =
        formState.type === "mt5"
          ? "Compte FTMO ajouté. Importez un CSV pour récupérer les trades."
          : "Compte ajouté. Lancez une synchronisation pour récupérer les trades.";
      setSuccess(successMessage);
      setSnackbar({ open: true, message: successMessage, severity: "success" });
      setFormState(getDefaultForm(formState.type));
      loadAccounts();
    } catch (err) {
      setError(err.message);
      setSnackbar({ open: true, message: err.message, severity: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const triggerCsvImport = (accountId) => {
    const input = fileInputRefs.current[accountId];
    if (input) {
      input.click();
    }
  };

  const handleCsvFileChange = (accountId) => async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImportingAccountId(accountId);
    setError(null);
    setSyncSuccess(null);
    try {
      const result = await importBrokerCsv(accountId, file);
      const inserted = result?.tradesCount ?? 0;
      const retrieved = result?.retrievedCount ?? inserted;
      const message =
        inserted > 0
          ? `${inserted} nouveau(x) trade(s) importé(s).`
          : `Aucun nouveau trade dans ce fichier (${retrieved} lu(s)).`;
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
      setImportingAccountId(null);
      if (event?.target) {
        event.target.value = "";
      }
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
    <Box>
      <SettingsSection
        title="Ajouter un compte"
        subtitle="NOUVELLE CONNEXION"
      >
        <Stack spacing={3}>
          <ToggleButtonGroup
            color="primary"
            exclusive
            value={formState.type}
            onChange={handleTypeChange}
            fullWidth
            sx={{
              mb: 2,
              '& .MuiToggleButton-root': {
                borderRadius: 2,
                border: `1px solid ${theme.palette.divider}`,
                py: 1.5,
                fontWeight: 600
              }
            }}
          >
            <ToggleButton value="mt5">FTMO (Import CSV)</ToggleButton>
            <ToggleButton value="hyperliquid">HyperLiquid (API)</ToggleButton>
          </ToggleButtonGroup>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Nom du compte"
                value={formState.name}
                onChange={handleFormChange("name")}
                fullWidth
                variant="outlined"
                InputProps={{ sx: { borderRadius: 2 } }}
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <TextField
                label="Devise"
                value={formState.currency}
                onChange={handleFormChange("currency")}
                fullWidth
                variant="outlined"
                InputProps={{ sx: { borderRadius: 2 } }}
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <TextField
                label="Solde initial"
                type="number"
                value={formState.initialBalance}
                onChange={handleFormChange("initialBalance")}
                fullWidth
                variant="outlined"
                InputProps={{ sx: { borderRadius: 2 } }}
              />
            </Grid>
            {formState.type === "mt5" ? (
              <Grid item xs={12}>
                <Alert severity="info" variant="outlined" sx={{ borderRadius: 2 }}>
                  Les comptes FTMO utilisent désormais un import manuel. Ajoutez le compte, puis
                  cliquez sur &laquo;&nbsp;Importer un CSV&nbsp;&raquo; dans la section Synchronisation.
                </Alert>
              </Grid>
            ) : (
              <Grid item xs={12}>
                <TextField
                  label="Adresse HyperLiquid"
                  value={formState.address}
                  onChange={handleFormChange("address")}
                  helperText="Entrez l'adresse publique du compte HyperLiquid"
                  fullWidth
                  variant="outlined"
                  InputProps={{ sx: { borderRadius: 2 } }}
                />
              </Grid>
            )}
          </Grid>

          {error && <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ borderRadius: 2 }}>{success}</Alert>}

          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={submitting}
              size="large"
              sx={{ borderRadius: 2, px: 4, fontWeight: 700 }}
            >
              {submitting ? "Ajout en cours..." : "Ajouter le compte"}
            </Button>
          </Box>
        </Stack>
      </SettingsSection>

      <SettingsSection
        title="Comptes connectés"
        subtitle="SYNCHRONISATION"
      >
        {loading ? (
          <Stack alignItems="center" spacing={2} py={4}>
            <CircularProgress size={32} />
            <Typography variant="body2" color="text.secondary">
              Chargement des comptes...
            </Typography>
          </Stack>
        ) : accounts.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
            <Typography variant="body1">Aucun compte connecté pour le moment.</Typography>
          </Box>
        ) : (
          <Stack spacing={2}>
            {accounts.map((account) => (
              <Paper
                key={account.id}
                elevation={0}
                sx={{
                  p: 2.5,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderRadius: 3,
                  border: `1px solid ${theme.palette.divider}`,
                  bgcolor: 'background.paper',
                  transition: 'all 0.2s',
                  '&:hover': { borderColor: 'primary.main', transform: 'translateY(-2px)', boxShadow: theme.shadows[2] }
                }}
              >
                <Box>
                  <Stack direction="row" alignItems="center" spacing={1.5} mb={0.5}>
                    <Typography fontWeight={700} variant="h6">{account.name}</Typography>
                    <Chip
                      label={account.status || "connecté"}
                      color={account.status === "error" ? "error" : "success"}
                      size="small"
                      sx={{ height: 20, fontSize: 11, fontWeight: 700 }}
                    />
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    {account.provider?.toUpperCase()} • {account.currency} • Dernière synchro :
                    {account.lastSyncAt ? ` ${new Date(account.lastSyncAt).toLocaleString("fr-FR")}` : " jamais"}
                  </Typography>
                  {isManualAccount(account) && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                      {account.metadata?.lastImportName
                        ? `Dernier import : ${account.metadata.lastImportName}`
                        : "Aucun import pour le moment."}
                    </Typography>
                  )}
                </Box>
                <Stack direction="row" spacing={1} alignItems="center">
                  {isManualAccount(account) ? (
                    <>
                      <input
                        type="file"
                        accept=".csv,.txt"
                        ref={(node) => {
                          if (node) {
                            fileInputRefs.current[account.id] = node;
                          } else {
                            delete fileInputRefs.current[account.id];
                          }
                        }}
                        style={{ display: "none" }}
                        onChange={handleCsvFileChange(account.id)}
                      />
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => triggerCsvImport(account.id)}
                        disabled={importingAccountId === account.id}
                        startIcon={importingAccountId === account.id ? <CircularProgress size={14} color="inherit" /> : <UploadFileRoundedIcon fontSize="small" />}
                        sx={{ borderRadius: 2, textTransform: 'none' }}
                      >
                        {importingAccountId === account.id ? "Import..." : "Importer CSV"}
                      </Button>
                    </>
                  ) : (
                    <IconButton
                      onClick={() => handleSync(account.id)}
                      disabled={syncingAccountId === account.id}
                      color="primary"
                      sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) } }}
                    >
                      {syncingAccountId === account.id ? <CircularProgress size={20} /> : <RefreshIcon />}
                    </IconButton>
                  )}
                </Stack>
              </Paper>
            ))}
          </Stack>
        )}
      </SettingsSection>

      <SettingsSection
        title="Intégration Twitter"
        subtitle="RÉSEAUX SOCIAUX"
        actions={
          <Button variant="outlined" size="small" onClick={loadIntegrations} disabled={loadingIntegrations} sx={{ borderRadius: 2 }}>
            {loadingIntegrations ? "Chargement..." : "Rafraîchir"}
          </Button>
        }
      >
        {integrationsError && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{integrationsError}</Alert>}

        {loadingIntegrations ? (
          <Stack alignItems="center" spacing={2} py={2}>
            <CircularProgress size={24} />
            <Typography variant="body2" color="text.secondary">Vérification des clés...</Typography>
          </Stack>
        ) : twitterIntegration ? (
          <Stack spacing={2}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip
                label={twitterIntegration.connected ? "Connecté" : "À configurer"}
                color={twitterIntegration.connected ? "success" : "default"}
                size="small"
                sx={{ fontWeight: 600 }}
              />
              <Chip
                label={twitterIntegration.publishReady ? "Prêt à publier" : "Lecture seule"}
                color={twitterIntegration.publishReady ? "info" : "default"}
                size="small"
                sx={{ fontWeight: 600 }}
              />
              {twitterIntegration.handle && (
                <Typography fontWeight={700} color="primary">{twitterIntegration.handle}</Typography>
              )}
            </Stack>

            <Alert severity={twitterIntegration.publishReady ? "success" : "info"} variant="outlined" sx={{ borderRadius: 2 }}>
              {twitterIntegration.publishReady
                ? "Toutes les clés requises sont détectées. Vous pouvez publier directement depuis Twitter Studio."
                : twitterIntegration.connected
                  ? "Clés API manquantes pour la publication automatique. Vérifiez vos variables d'environnement."
                  : "Ajoutez vos clés Twitter dans le fichier .env du backend pour activer l'intégration."}
            </Alert>
          </Stack>
        ) : (
          <Typography variant="body2" color="text.secondary">Impossible de récupérer les informations Twitter.</Typography>
        )}
      </SettingsSection>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: "100%", borderRadius: 2 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SettingsBrokerAccounts;
