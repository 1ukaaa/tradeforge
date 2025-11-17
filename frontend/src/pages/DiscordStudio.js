import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  List,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Paper,
  Snackbar,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ForgeCard } from "../components/ForgeUI";
import { fetchJournalEntries } from "../services/journalClient";
import { generateDiscordPostFromEntry, publishToDiscord, fetchDiscordStatus } from "../services/discordClient";

const VARIANT_OPTIONS = [
  {
    value: "trade.simple",
    label: "Trade terminé",
    helper: "Récap rapide d'un trade avec setup, niveaux et enseignements.",
  },
  {
    value: "analysis.deep",
    label: "Analyse marché",
    helper: "Plan d'action détaillé avec biais, catalyseurs et zones clés.",
  },
];

const formatEntrySubtitle = (entry) => {
  if (!entry) return "";
  const parts = [];
  if (entry.metadata?.symbol) {
    parts.push(entry.metadata.symbol);
  }
  if (entry.metadata?.timeframe) {
    parts.push(entry.metadata.timeframe);
  }
  if (entry.metadata?.date) {
    parts.push(entry.metadata.date);
  }
  return parts.join(" • ");
};

const DiscordPreview = ({ payload, loading }) => {
  if (loading) {
    return (
      <Stack alignItems="center" spacing={1} py={4}>
        <CircularProgress size={32} />
        <Typography variant="body2" color="text.secondary">
          Génération en cours...
        </Typography>
      </Stack>
    );
  }

  if (!payload?.embeds?.length) {
    return (
      <Paper
        variant="outlined"
        sx={{
          borderRadius: 3,
          p: 3,
          borderStyle: "dashed",
        }}
      >
        <Typography color="text.secondary">
          Sélectionne un format, choisis une entrée du journal puis génère avec Gemini pour afficher l'aperçu Discord.
        </Typography>
      </Paper>
    );
  }

  const embed = payload.embeds[0];

  return (
    <Paper
      sx={{
        borderRadius: 3,
        p: 2,
        backgroundColor: (theme) =>
          theme.palette.mode === "dark" ? "rgba(32,34,37,0.85)" : theme.palette.background.paper,
        border: (theme) => `1px solid ${theme.palette.divider}`,
      }}
    >
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
        tradeforge-bot
      </Typography>

      {payload.content && (
        <Typography variant="body2" sx={{ mb: 2, whiteSpace: "pre-line" }}>
          {payload.content}
        </Typography>
      )}

      <Box
        sx={{
          borderLeft: (theme) => `4px solid ${theme.palette.primary.main}`,
          backgroundColor: (theme) =>
            theme.palette.mode === "dark" ? "rgba(88,101,242,0.08)" : "rgba(88,101,242,0.05)",
          borderRadius: 2,
          p: 2,
        }}
      >
        {embed.title && (
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
            {embed.title}
          </Typography>
        )}
        {embed.description && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, whiteSpace: "pre-line" }}>
            {embed.description}
          </Typography>
        )}
        <Stack spacing={1.5}>
          {embed.fields?.map((field) => (
            <Box key={field.name} sx={{ backgroundColor: "rgba(255,255,255,0.02)", borderRadius: 2, p: 1.5 }}>
              <Typography
                variant="caption"
                sx={{ textTransform: "uppercase", letterSpacing: "0.15em", color: "text.secondary" }}
              >
                {field.name}
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>
                {field.value}
              </Typography>
            </Box>
          ))}
        </Stack>
        {embed.footer?.text && (
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 2 }}>
            {embed.footer.text}
          </Typography>
        )}
      </Box>
    </Paper>
  );
};

const DiscordStudio = () => {
  const [variant, setVariant] = useState(VARIANT_OPTIONS[0].value);
  const [journalEntries, setJournalEntries] = useState([]);
  const [entriesLoading, setEntriesLoading] = useState(false);
  const [entriesError, setEntriesError] = useState(null);
  const [entrySearch, setEntrySearch] = useState("");
  const [isEntryDialogOpen, setEntryDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);

  const [generatedPost, setGeneratedPost] = useState(null);
  const [callToAction, setCallToAction] = useState("");
  const [notes, setNotes] = useState("");

  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: "", severity: "success" });
  const [error, setError] = useState(null);

  const [webhookConfigured, setWebhookConfigured] = useState(true);
  const [webhookStatusLoading, setWebhookStatusLoading] = useState(true);
  const [publishInfo, setPublishInfo] = useState(null);

  const loadJournalEntries = useCallback(async () => {
    setEntriesLoading(true);
    setEntriesError(null);
    try {
      const entries = await fetchJournalEntries();
      setJournalEntries(entries);
    } catch (err) {
      setEntriesError(err.message);
    } finally {
      setEntriesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadJournalEntries();
    const checkStatus = async () => {
      try {
        setWebhookStatusLoading(true);
        const data = await fetchDiscordStatus();
        setWebhookConfigured(Boolean(data?.configured));
      } catch {
        setWebhookConfigured(false);
      } finally {
        setWebhookStatusLoading(false);
      }
    };
    checkStatus();
  }, [loadJournalEntries]);

  const filteredEntries = useMemo(() => {
    const query = entrySearch.trim().toLowerCase();
    return journalEntries.filter((entry) => {
      if (!(entry.type === "trade" || entry.type === "analyse")) return false;
      if (!query) return true;
      const haystack = [
        entry.metadata?.title,
        entry.metadata?.symbol,
        entry.metadata?.tags?.join(" "),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [journalEntries, entrySearch]);

  const openEntryDialog = () => {
    if (!journalEntries.length && !entriesLoading) {
      loadJournalEntries();
    }
    setEntryDialogOpen(true);
  };

  const handleSelectEntry = (entry) => {
    setSelectedEntry(entry);
    setGeneratedPost(null);
    setCallToAction("");
    setNotes("");
    setEntryDialogOpen(false);
    setPublishInfo(null);
  };

  const handleDetachEntry = () => {
    setSelectedEntry(null);
    setGeneratedPost(null);
    setCallToAction("");
    setNotes("");
    setPublishInfo(null);
  };

  const handleGenerate = async () => {
    if (!selectedEntry) {
      setError("Sélectionne d'abord une analyse ou un trade dans le journal.");
      return;
    }
    try {
      setGenerating(true);
      setError(null);
      setPublishInfo(null);
      const data = await generateDiscordPostFromEntry({
        entryId: selectedEntry.id,
        variant,
      });
      if (!data?.post) {
        throw new Error("Le serveur n'a pas renvoyé de post Discord.");
      }
      setGeneratedPost(data.post);
      setCallToAction(data.post.content || "");
      setNotes("");
      setNotification({ open: true, message: "Post généré avec Gemini.", severity: "success" });
    } catch (err) {
      setError(err.message || "Impossible de générer le post.");
      setNotification({ open: true, message: err.message || "Génération impossible.", severity: "error" });
    } finally {
      setGenerating(false);
    }
  };

  const previewPayload = useMemo(() => {
    if (!generatedPost?.embeds?.length) return null;
    const embed = { ...generatedPost.embeds[0] };
    if (notes.trim()) {
      embed.description = embed.description
        ? `${embed.description.trim()}\n\n${notes.trim()}`
        : notes.trim();
    }
    return {
      content: callToAction || "",
      embeds: [embed],
    };
  }, [generatedPost, callToAction, notes]);

  const handleSend = async () => {
    if (!previewPayload) {
      setError("Génère un post avant de publier.");
      return;
    }
    try {
      setSending(true);
      const result = await publishToDiscord(previewPayload);
      setPublishInfo({
        messageId: result?.messageId || null,
        channelId: result?.channelId || null,
        timestamp: result?.timestamp || null,
      });
      const infoMessage = result?.channelId
        ? `Post envoyé sur Discord (channel ${result.channelId}).`
        : "Post envoyé sur Discord.";
      setNotification({ open: true, message: infoMessage, severity: "success" });
    } catch (err) {
      setPublishInfo(null);
      setNotification({ open: true, message: err.message || "Impossible d'envoyer.", severity: "error" });
    } finally {
      setSending(false);
    }
  };

  const handleCopyPayload = () => {
    if (!previewPayload) return;
    navigator.clipboard.writeText(JSON.stringify(previewPayload, null, 2));
    setNotification({ open: true, message: "Payload copié.", severity: "info" });
  };

  const closeNotification = () => setNotification((prev) => ({ ...prev, open: false }));

  return (
    <Stack spacing={4}>
      <Box>
        <Typography variant="h2" fontWeight={700}>
          Discord Studio
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Compose des posts Discord à partir de ton journal, boostés avec Gemini puis publiés en un clic via le webhook.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <ForgeCard
            title="Composer un post"
            subtitle="DISCORD STUDIO"
            helper="Choisis ton format, connecte une entrée du journal et laisse Gemini préparer la structure."
          >
            <Stack spacing={3}>
              <Box>
                <Typography variant="overline" color="text.secondary">
                  Format
                </Typography>
                <ToggleButtonGroup
                  value={variant}
                  exclusive
                  onChange={(_, value) => value && setVariant(value)}
                >
                  {VARIANT_OPTIONS.map((option) => (
                    <ToggleButton key={option.value} value={option.value} sx={{ textAlign: "left" }}>
                      <Box>
                        <Typography variant="subtitle2">{option.label}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {option.helper}
                        </Typography>
                      </Box>
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
              </Box>

              <Divider />

              <Stack spacing={1}>
                <Typography variant="subtitle2">Source journal</Typography>
                {selectedEntry ? (
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <Stack spacing={0.5}>
                      <Typography fontWeight={600}>{selectedEntry.metadata?.title || `Entrée #${selectedEntry.id}`}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {(selectedEntry.type === "trade" ? "TRADE" : "ANALYSE") +
                          (selectedEntry.metadata?.symbol ? ` • ${selectedEntry.metadata.symbol}` : "")}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatEntrySubtitle(selectedEntry)}
                      </Typography>
                    </Stack>
                  </Paper>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Connecte une entrée pour alimenter Gemini (images et contexte inclus).
                  </Typography>
                )}
                <Stack direction="row" spacing={1}>
                  <Button variant="outlined" size="small" onClick={openEntryDialog} disabled={entriesLoading}>
                    {entriesLoading ? "Chargement..." : "Choisir dans le journal"}
                  </Button>
                  {selectedEntry && (
                    <Button variant="text" size="small" onClick={handleDetachEntry}>
                      Retirer
                    </Button>
                  )}
                </Stack>
                {entriesError && (
                  <Typography variant="caption" color="error.main">
                    {entriesError}
                  </Typography>
                )}
              </Stack>

              <Divider />

              <Stack spacing={2}>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <Button
                    variant="outlined"
                    startIcon={<AutoAwesomeIcon />}
                    onClick={handleGenerate}
                    disabled={generating || !selectedEntry}
                  >
                    {generating ? "Génération..." : "Générer avec Gemini"}
                  </Button>
                  <Button
                    variant="contained"
                    color="secondary"
                    startIcon={<RocketLaunchIcon />}
                    disabled={sending || !previewPayload || !webhookConfigured || webhookStatusLoading}
                    onClick={handleSend}
                  >
                    {sending ? "Envoi..." : "Poster sur Discord"}
                  </Button>
                </Stack>

                <TextField
                  label="Call-to-action"
                  placeholder="Tag un rôle, pose une question..."
                  value={callToAction}
                  onChange={(event) => setCallToAction(event.target.value)}
                  disabled={!generatedPost}
                />
                <TextField
                  label="Note additionnelle"
                  placeholder="Ajoute une note personnelle (optionnel)"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  multiline
                  minRows={2}
                  disabled={!generatedPost}
                />

                <Stack direction={{ xs: "column", sm: "row" }} spacing={1} justifyContent="flex-end">
                  <Button
                    variant="text"
                    startIcon={<ContentCopyIcon />}
                    onClick={handleCopyPayload}
                    disabled={!previewPayload}
                  >
                    Copier le payload
                  </Button>
                </Stack>
                {publishInfo && (
                  <Alert severity="success" variant="outlined">
                    Dernier envoi — message {publishInfo.messageId || "?"}
                    {publishInfo.channelId ? ` sur canal ${publishInfo.channelId}` : ""}{" "}
                    {publishInfo.timestamp ? `(${new Date(publishInfo.timestamp).toLocaleString()})` : ""}
                  </Alert>
                )}
              </Stack>
            </Stack>
          </ForgeCard>

          {!webhookConfigured && !webhookStatusLoading && (
            <ForgeCard variant="alert" title="Webhook Discord" helper="Ajoute ton webhook dans le fichier backend/.env.">
              <Alert severity="warning" sx={{ mb: 2 }}>
                Aucun webhook détecté. Ajoute DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/..." puis redémarre le backend.
              </Alert>
              <Stack spacing={1}>
                <Typography variant="body2" color="text.secondary">
                  1. Dans <code>backend/.env</code> ajoute :
                </Typography>
                <Paper
                  variant="outlined"
                  sx={{ borderRadius: 2, p: 2, fontFamily: "monospace", fontSize: 14 }}
                >
                  DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/..."
                </Paper>
                <Typography variant="body2" color="text.secondary">
                  2. Redémarre le serveur backend (<code>npm run dev</code>).
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  3. Recharge l'interface et envoie l'aperçu.
                </Typography>
              </Stack>
            </ForgeCard>
          )}
        </Grid>

        <Grid item xs={12} md={5}>
          <ForgeCard
            title="Prévisualisation"
            subtitle="APERÇU LIVE"
            helper="Image fidèle de l'embed généré."
            actions={
              <Chip
                size="small"
                label={webhookStatusLoading ? "Vérification..." : webhookConfigured ? "Webhook prêt" : "Webhook manquant"}
                color={webhookStatusLoading ? "default" : webhookConfigured ? "success" : "warning"}
              />
            }
          >
            <DiscordPreview payload={previewPayload} loading={generating} />
          </ForgeCard>
        </Grid>
      </Grid>

      <Dialog
        open={isEntryDialogOpen}
        onClose={() => setEntryDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Sélectionner une entrée du journal</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <TextField
              autoFocus
              placeholder="Rechercher par titre, symbole..."
              value={entrySearch}
              onChange={(event) => setEntrySearch(event.target.value)}
            />
            {entriesLoading ? (
              <Stack alignItems="center" spacing={1} py={2}>
                <CircularProgress size={24} />
                <Typography variant="body2" color="text.secondary">
                  Chargement...
                </Typography>
              </Stack>
            ) : filteredEntries.length ? (
              <List sx={{ maxHeight: 360, overflowY: "auto" }}>
                {filteredEntries.map((entry) => (
                  <ListItemButton key={entry.id} onClick={() => handleSelectEntry(entry)}>
                    <ListItemAvatar>
                      <Avatar>
                        {entry.type === "trade" ? "T" : "A"}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={entry.metadata?.title || `Entrée #${entry.id}`}
                      secondary={
                        entry.metadata?.symbol
                          ? `${entry.metadata.symbol} • ${entry.metadata?.timeframe || ""}`
                          : entry.metadata?.timeframe || ""
                      }
                    />
                  </ListItemButton>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Aucun trade ni analyse disponible pour le moment.
              </Typography>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEntryDialogOpen(false)}>Fermer</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={closeNotification}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={closeNotification} severity={notification.severity} sx={{ width: "100%" }}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Stack>
  );
};

export default DiscordStudio;
