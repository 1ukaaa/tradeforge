import { Grid, Paper, Stack, Switch, TextField, Typography } from "@mui/material";
import SettingsSuggestIcon from "@mui/icons-material/SettingsSuggest";

const Settings = () => {
  return (
    <Stack spacing={4}>
      <Stack direction="row" spacing={1} alignItems="center">
        <SettingsSuggestIcon color="primary" fontSize="large" />
        <Typography variant="h3" color="primary">
          Paramètres
        </Typography>
      </Stack>
      <Typography variant="body1" color="text.secondary" maxWidth={580}>
        Configure les préférences IA, la structure des fiches et la synchronisation avec ton journal.
        Les intégrations et exports seront bientôt disponibles.
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 4 }} elevation={0}>
            <Typography variant="h6" mb={2}>
              IA & format
            </Typography>
            <Stack spacing={2}>
              <TextField label="Langue principale" value="Français" InputProps={{ readOnly: true }} />
              <TextField
                label="Style de synthèse"
                value="Plan d’action orienté résultats"
                InputProps={{ readOnly: true }}
              />
            </Stack>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 4 }} elevation={0}>
            <Typography variant="h6" mb={2}>
              Notifications
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <Switch defaultChecked />
              <Typography>Alertes de discipline</Typography>
            </Stack>
            <Stack direction="row" spacing={2} alignItems="center">
              <Switch defaultChecked />
              <Typography>Résumé hebdomadaire</Typography>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Stack>
  );
};

export default Settings;
