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
  IconButton,
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
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import AddCommentIcon from "@mui/icons-material/AddComment";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import SaveIcon from "@mui/icons-material/Save";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ForgeCard } from "../components/ForgeUI";
import {
  createTwitterDraft,
  deleteTwitterDraft,
  fetchTwitterDrafts,
  generateTwitterFromEntry,
  publishTwitterDraft,
  updateTwitterDraft,
} from "../services/twitterClient";
import { fetchIntegrations } from "../services/integrationsClient";
import { fetchJournalEntries } from "../services/journalClient";

const VARIANT_OPTIONS = [
  { value: "tweet.simple", label: "Tweet Synthèse" },
  { value: "thread.analysis", label: "Thread Analyse" },
  { value: "thread.annonce", label: "Annonce / Lancement" },
];

const STATUS_OPTIONS = [
  { value: "draft", label: "En cours" },
  { value: "ready", label: "Prêt" },
  { value: "published", label: "Publié" },
];

const DEFAULT_TWEET = () => ({
  id: `tweet-${Date.now()}`,
  text: "",
  media: [],
});

const mapEntryImagesToAttachments = (entry) => {
  if (!entry?.metadata?.images) return [];
  return entry.metadata.images
    .filter((image) => image?.src)
    .map((image, index) => ({
      id: image.id || `entry-${entry.id}-${index}-${Date.now()}`,
      src: image.src,
      caption: image.caption || entry.metadata?.title || `Image ${index + 1}`,
    }));
};

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const ensureTweetMedia = (tweet) => ({
  ...tweet,
  media: Array.isArray(tweet.media) ? tweet.media : [],
});

const hydrateDraft = (draft) => {
  if (!draft) return draft;
  const cloned = JSON.parse(JSON.stringify(draft));
  const tweets = Array.isArray(cloned?.payload?.tweets)
    ? cloned.payload.tweets.map(ensureTweetMedia)
    : [DEFAULT_TWEET()];
  const legacyAttachments = Array.isArray(cloned?.payload?.attachments)
    ? cloned.payload.attachments
    : [];
  if (legacyAttachments.length && tweets[0] && !tweets[0].media.length) {
    tweets[0].media = legacyAttachments;
  }
  return {
    ...cloned,
    payload: {
      ...cloned.payload,
      tweets,
      attachments: [],
    },
  };
};

const TwitterStudio = () => {
  const [drafts, setDrafts] = useState([]);
  const [activeDraftId, setActiveDraftId] = useState(null);
  const [editorDraft, setEditorDraft] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState(null);
  const [integrationInfo, setIntegrationInfo] = useState(null);
  const [integrationError, setIntegrationError] = useState(null);
  const [journalEntries, setJournalEntries] = useState([]);
  const [entriesLoading, setEntriesLoading] = useState(false);
  const [entriesError, setEntriesError] = useState(null);
  const [isEntryDialogOpen, setEntryDialogOpen] = useState(false);
  const [entrySearch, setEntrySearch] = useState("");
  const [generating, setGenerating] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: "", severity: "info" });
  const [draggingMedia, setDraggingMedia] = useState(null);
  const [pendingTweetIndex, setPendingTweetIndex] = useState(null);
  const fileInputRef = useRef(null);

  const updateTweetMedia = (tweetIndex, updater) => {
    setEditorDraft((prev) => {
      if (!prev) return prev;
      const tweets = prev.payload?.tweets ? [...prev.payload.tweets] : [];
      if (!tweets[tweetIndex]) return prev;
      const currentMedia = Array.isArray(tweets[tweetIndex].media) ? [...tweets[tweetIndex].media] : [];
      const nextMedia = updater(currentMedia);
      tweets[tweetIndex] = { ...tweets[tweetIndex], media: nextMedia };
      return {
        ...prev,
        payload: {
          ...prev.payload,
          tweets,
        },
      };
    });
    setIsDirty(true);
  };

  const moveMediaItem = (sourceTweetIndex, mediaId, targetTweetIndex, targetMediaId = null) => {
    setEditorDraft((prev) => {
      if (!prev) return prev;
      const tweets = prev.payload?.tweets ? [...prev.payload.tweets] : [];
      const sourceTweet = tweets[sourceTweetIndex];
      const targetTweet = tweets[targetTweetIndex];
      if (!sourceTweet || !targetTweet) return prev;
      const sourceMedia = Array.isArray(sourceTweet.media) ? [...sourceTweet.media] : [];
      const sourceIndex = sourceMedia.findIndex((item) => item.id === mediaId);
      if (sourceIndex === -1) return prev;
      const [mediaItem] = sourceMedia.splice(sourceIndex, 1);
      const targetMedia =
        sourceTweetIndex === targetTweetIndex ? sourceMedia : Array.isArray(targetTweet.media) ? [...targetTweet.media] : [];
      let insertIndex =
        targetMediaId !== null ? targetMedia.findIndex((item) => item.id === targetMediaId) : targetMedia.length;
      if (insertIndex < 0 || insertIndex > targetMedia.length) {
        insertIndex = targetMedia.length;
      }
      if (sourceTweetIndex === targetTweetIndex && insertIndex >= sourceIndex) {
        insertIndex = Math.min(insertIndex, targetMedia.length);
      }
      targetMedia.splice(insertIndex, 0, mediaItem);
      tweets[sourceTweetIndex] = { ...sourceTweet, media: sourceMedia };
      tweets[targetTweetIndex] = { ...targetTweet, media: targetMedia };
      return {
        ...prev,
        payload: {
          ...prev.payload,
          tweets,
        },
      };
    });
    setIsDirty(true);
  };

  const loadDrafts = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchTwitterDrafts()
      .then((items) => {
        const hydrated = items.map(hydrateDraft);
        setDrafts(hydrated);
        setActiveDraftId((prev) => {
          if (prev) return prev;
          if (hydrated.length) return hydrated[0].id;
          return null;
        });
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const loadIntegrations = () => {
    setIntegrationError(null);
    fetchIntegrations()
      .then((data) => setIntegrationInfo(data.twitter || null))
      .catch((err) => setIntegrationError(err.message));
  };

  const loadJournalEntries = useCallback(() => {
    setEntriesLoading(true);
    setEntriesError(null);
    fetchJournalEntries()
      .then((items) => setJournalEntries(items))
      .catch((err) => setEntriesError(err.message))
      .finally(() => setEntriesLoading(false));
  }, []);

  const pushNotification = (message, severity = "info") => {
    if (!message) return;
    setNotification({ open: true, message, severity });
  };

  useEffect(() => {
    loadDrafts();
    loadIntegrations();
  }, [loadDrafts]);

  useEffect(() => {
    if (!activeDraftId) {
      setEditorDraft(null);
      setIsDirty(false);
      return;
    }
    const selected = drafts.find((draft) => draft.id === activeDraftId);
    setEditorDraft(selected ? hydrateDraft(selected) : null);
    setIsDirty(false);
  }, [activeDraftId, drafts]);

  const handleCreateDraft = async () => {
    try {
      setCreating(true);
      const draft = await createTwitterDraft({
        title: "Nouveau brouillon",
        status: "draft",
        payload: { tweets: [DEFAULT_TWEET()] },
      });
      const hydrated = hydrateDraft(draft);
      setDrafts((prev) => [hydrated, ...prev]);
      setActiveDraftId(hydrated.id);
      pushNotification("Brouillon créé.", "success");
    } catch (err) {
      setError(err.message);
      pushNotification(err.message, "error");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteDraft = async (id) => {
    if (!id) return;
    const confirmed = window.confirm("Supprimer définitivement ce brouillon ?");
    if (!confirmed) return;
    try {
      await deleteTwitterDraft(id);
      setDrafts((prev) => prev.filter((draft) => draft.id !== id));
      if (activeDraftId === id) {
        setActiveDraftId(null);
      }
      pushNotification("Brouillon supprimé.", "info");
    } catch (err) {
      setError(err.message);
      pushNotification(err.message, "error");
    }
  };

  const updateEditorField = (field, value) => {
    setEditorDraft((prev) => (prev ? { ...prev, [field]: value } : prev));
    setIsDirty(true);
  };

  const updateTweet = (index, updates) => {
    setEditorDraft((prev) => {
      if (!prev) return prev;
      const tweets = prev.payload?.tweets ? [...prev.payload.tweets] : [];
      tweets[index] = { ...tweets[index], ...updates };
      return {
        ...prev,
        payload: {
          ...prev.payload,
          tweets,
        },
      };
    });
    setIsDirty(true);
  };

  const addTweetBlock = () => {
    setEditorDraft((prev) => {
      if (!prev) return prev;
      const tweets = prev.payload?.tweets ? [...prev.payload.tweets] : [];
      tweets.push(DEFAULT_TWEET());
      return {
        ...prev,
        payload: { ...prev.payload, tweets },
      };
    });
    setIsDirty(true);
  };

  const removeTweetBlock = (index) => {
    setEditorDraft((prev) => {
      if (!prev) return prev;
      const tweets = prev.payload?.tweets ? [...prev.payload.tweets] : [];
      if (tweets.length <= 1) return prev;
      tweets.splice(index, 1);
      return {
        ...prev,
        payload: { ...prev.payload, tweets },
      };
    });
    setIsDirty(true);
  };

  const handleOpenEntryDialog = () => {
    if (!journalEntries.length && !entriesLoading) {
      loadJournalEntries();
    }
    setEntryDialogOpen(true);
  };

  const handleAttachEntry = (entry) => {
    if (!entry) return;
    const attachments = mapEntryImagesToAttachments(entry);
    setEditorDraft((prev) => {
      if (!prev) return prev;
      const tweets = prev.payload?.tweets ? [...prev.payload.tweets] : [];
      if (attachments.length && tweets[0]) {
        tweets[0] = { ...tweets[0], media: attachments };
      }
      return {
        ...prev,
        sourceEntryId: entry.id,
        metadata: {
          ...prev.metadata,
          sourceTitle: entry.metadata?.title || entry.content?.slice(0, 60) || `Entrée #${entry.id}`,
          sourceType: entry.type,
          sourceDate: entry.metadata?.date || entry.createdAt,
          sourceSymbol: entry.metadata?.symbol || "",
        },
        payload: {
          ...prev.payload,
          tweets,
        },
      };
    });
    setIsDirty(true);
    setEntryDialogOpen(false);
  };

  const handleDetachEntry = () => {
    setEditorDraft((prev) => {
      if (!prev) return prev;
      const { metadata = {} } = prev;
      const { sourceTitle, sourceType, sourceDate, sourceSymbol, ...restMetadata } = metadata;
      const tweets = (prev.payload?.tweets || []).map((tweet) => ({
        ...tweet,
        media: [],
      }));
      return {
        ...prev,
        sourceEntryId: null,
        metadata: restMetadata,
        payload: {
          ...prev.payload,
          tweets,
        },
      };
    });
    setIsDirty(true);
  };

  const handleRemoveAttachment = (tweetIndex, attachmentId) => {
    if (!attachmentId) return;
    updateTweetMedia(tweetIndex, (media) => media.filter((attachment) => attachment.id !== attachmentId));
  };

  const handleReorderAttachment = (tweetIndex, attachmentId, direction) => {
    if (!attachmentId || !direction) return;
    setEditorDraft((prev) => {
      if (!prev) return prev;
      const tweets = prev.payload?.tweets ? [...prev.payload.tweets] : [];
      const targetTweet = tweets[tweetIndex];
      if (!targetTweet) return prev;
      const attachments = Array.isArray(targetTweet.media) ? [...targetTweet.media] : [];
      const index = attachments.findIndex((item) => item.id === attachmentId);
      if (index === -1) return prev;
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= attachments.length) return prev;
      const [moved] = attachments.splice(index, 1);
      attachments.splice(targetIndex, 0, moved);
      tweets[tweetIndex] = { ...targetTweet, media: attachments };
      return {
        ...prev,
        payload: {
          ...prev.payload,
          tweets,
        },
      };
    });
    setIsDirty(true);
  };

  const handleAddAttachmentFromSrc = (tweetIndex, src, name = "") => {
    if (!src) return;
    updateTweetMedia(tweetIndex, (media) => [
      ...media,
      {
        id: `attachment-${Date.now()}`,
        src,
        caption: name || `Image ${media.length + 1}`,
      },
    ]);
  };

  const handleAttachmentFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await fileToDataUrl(file);
      const targetIndex = pendingTweetIndex ?? 0;
      handleAddAttachmentFromSrc(targetIndex, dataUrl, file.name);
      setPendingTweetIndex(null);
      pushNotification("Image ajoutée au brouillon.", "success");
    } catch (err) {
      console.error("Erreur lecture image :", err);
      pushNotification("Impossible de lire cette image.", "error");
    } finally {
      if (event?.target) {
        event.target.value = "";
      }
    }
  };

  const handleAddAttachmentClick = (tweetIndex) => () => {
    setPendingTweetIndex(tweetIndex);
    fileInputRef.current?.click();
  };

  const handleMediaDragStart = (tweetIndex, mediaId) => () => {
    setDraggingMedia({ tweetIndex, mediaId });
  };

  const handleMediaDragEnd = () => setDraggingMedia(null);

  const handleMediaDrop = (tweetIndex, targetMediaId = null) => (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (draggingMedia) {
      moveMediaItem(draggingMedia.tweetIndex, draggingMedia.mediaId, tweetIndex, targetMediaId);
    }
    setDraggingMedia(null);
  };

  const handleGenerateWithGemini = async () => {
    if (!editorDraft) return;
    if (!editorDraft.sourceEntryId) {
      setError("Sélectionne une analyse ou un trade du journal avant de générer.");
      return;
    }
    try {
      setGenerating(true);
      const variantValue = editorDraft.variant || "tweet.simple";
      const data = await generateTwitterFromEntry({
        entryId: editorDraft.sourceEntryId,
        variant: variantValue,
      });
      const existingMedia = Array.isArray(editorDraft.payload?.tweets)
        ? editorDraft.payload.tweets.map((tweet) => tweet.media || [])
        : [];
      const generatedTweets = (data?.tweets || []).map((tweet, index) => ({
        id: tweet.id || `tweet-${Date.now()}-${index}`,
        text: tweet.text || "",
        media: existingMedia[index] ? [...existingMedia[index]] : [],
      }));
      if (!generatedTweets.length) {
        throw new Error("Gemini n'a pas renvoyé de tweets.");
      }
      setEditorDraft((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          payload: {
            ...prev.payload,
            tweets: generatedTweets,
          },
        };
      });
      setIsDirty(true);
      pushNotification("Contenu généré avec Gemini.", "success");
    } catch (err) {
      setError(err.message || "Impossible de générer le thread.");
      pushNotification(err.message || "Génération impossible.", "error");
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!editorDraft) return;
    try {
      setSaving(true);
      setError(null);
      const payload = {
        title: editorDraft.title,
        variant: editorDraft.variant,
        status: editorDraft.status,
        payload: editorDraft.payload,
        sourceEntryId: editorDraft.sourceEntryId,
        metadata: editorDraft.metadata,
      };
      const updated = await updateTwitterDraft(editorDraft.id, payload);
      const hydrated = hydrateDraft(updated);
      setDrafts((prev) => prev.map((draft) => (draft.id === hydrated.id ? hydrated : draft)));
      setIsDirty(false);
      pushNotification("Brouillon enregistré.", "success");
    } catch (err) {
      setError(err.message);
      pushNotification(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handlePublishDraft = async () => {
    if (!editorDraft) return;
    if (editorDraft.payload?.tweets?.some((tweet) => !tweet.text.trim())) {
      setError("Chaque tweet doit contenir du texte avant publication.");
      return;
    }
    try {
      setPublishing(true);
      setError(null);
      if (isDirty) {
        await handleSaveDraft();
      }
      const { draft } = await publishTwitterDraft(editorDraft.id);
      const hydrated = hydrateDraft(draft);
      setDrafts((prev) => prev.map((item) => (item.id === hydrated.id ? hydrated : item)));
      setActiveDraftId(hydrated.id);
      loadIntegrations();
      pushNotification("Thread publié sur Twitter.", "success");
    } catch (err) {
      setError(err.message);
      pushNotification(err.message, "error");
    } finally {
      setPublishing(false);
    }
  };

  const activeStatusProps = useMemo(() => {
    if (!editorDraft) return {};
    switch (editorDraft.status) {
      case "ready":
        return { color: "info", label: "Prêt" };
      case "published":
        return { color: "success", label: "Publié" };
      default:
        return { color: "default", label: "En cours" };
    }
  }, [editorDraft]);

  const filteredEntries = useMemo(() => {
    const search = entrySearch.trim().toLowerCase();
    return journalEntries
      .filter((entry) => entry.type === "trade" || entry.type === "analyse")
      .filter((entry) => {
        if (!search) return true;
        const haystack = [
          entry.metadata?.title,
          entry.metadata?.symbol,
          Array.isArray(entry.metadata?.tags) ? entry.metadata.tags.join(" ") : "",
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(search);
      });
  }, [journalEntries, entrySearch]);

  const renderTweetEditor = (tweet, index) => {
    const charCount = tweet.text?.length || 0;
    const exceeds = charCount > 280;
    return (
      <Box key={tweet.id} sx={{ borderRadius: 2, border: (theme) => `1px solid ${theme.palette.divider}`, p: 2 }}>
        <Stack spacing={1}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="subtitle2">Tweet #{index + 1}</Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="caption" color={exceeds ? "error.main" : "text.secondary"}>
                {charCount} / 280
              </Typography>
              {editorDraft?.payload?.tweets?.length > 1 && (
                <IconButton size="small" onClick={() => removeTweetBlock(index)}>
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              )}
            </Stack>
          </Stack>
          <TextField
            multiline
            minRows={3}
            value={tweet.text}
            placeholder="Texte du tweet..."
            onChange={(event) => updateTweet(index, { text: event.target.value })}
            fullWidth
          />
        </Stack>
      </Box>
    );
  };

  const renderDraftList = () => {
    if (loading) {
      return (
        <Stack alignItems="center" spacing={1} py={3}>
          <CircularProgress size={24} />
          <Typography variant="body2" color="text.secondary">
            Chargement des brouillons...
          </Typography>
        </Stack>
      );
    }

    if (!drafts.length) {
      return (
        <Stack spacing={2} alignItems="center" py={4}>
          <Typography variant="body2" color="text.secondary" textAlign="center">
            Aucun brouillon pour le moment. Crée ton premier tweet pour préparer tes publications.
          </Typography>
          <Button variant="contained" startIcon={<AddCommentIcon />} onClick={handleCreateDraft} disabled={creating}>
            {creating ? "Création..." : "Nouveau brouillon"}
          </Button>
        </Stack>
      );
    }

    return (
      <Stack spacing={1.5}>
        {drafts.map((draft) => (
          <Box
            key={draft.id}
            onClick={() => setActiveDraftId(draft.id)}
            sx={{
              p: 2,
              borderRadius: 2,
              border: (theme) =>
                `1px solid ${
                  draft.id === activeDraftId ? theme.palette.primary.main : theme.palette.divider
                }`,
              backgroundColor: (theme) =>
                draft.id === activeDraftId ? theme.palette.action.selected : theme.palette.background.paper,
              cursor: "pointer",
            }}
          >
            <Stack spacing={0.5}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography fontWeight={600}>{draft.title || "Sans titre"}</Typography>
                <Chip
                  size="small"
                  label={draft.status === "published" ? "Publié" : draft.status === "ready" ? "Prêt" : "Brouillon"}
                  color={
                    draft.status === "published" ? "success" : draft.status === "ready" ? "info" : "default"
                  }
                />
              </Stack>
              <Typography variant="caption" color="text.secondary">
                {draft.variant}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Mis à jour le {new Date(draft.updatedAt).toLocaleString("fr-FR")}
              </Typography>
            </Stack>
          </Box>
        ))}
      </Stack>
    );
  };

  const previewTweets = editorDraft?.payload?.tweets || [];
  const previewCount = Math.max(previewTweets.length, 1);
  const sourceInfo = editorDraft?.sourceEntryId
    ? {
        title: editorDraft.metadata?.sourceTitle || `Entrée #${editorDraft.sourceEntryId}`,
        type: editorDraft.metadata?.sourceType || "journal",
        date: editorDraft.metadata?.sourceDate || "",
        symbol: editorDraft.metadata?.sourceSymbol || "",
      }
    : null;

  return (
    <Stack spacing={4}>
      <Box>
        <Typography variant="h2" fontWeight={700}>
          Twitter Studio
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Prépare et révise tes posts Twitter avant publication. Tous les brouillons sont conservés côté TradeForge.
        </Typography>
      </Box>

      {integrationError && <Alert severity="error">{integrationError}</Alert>}
      {integrationInfo && !integrationInfo.connected && (
        <Alert severity="info">
          Ajoute `TWITTER_ACCESS_TOKEN` et `TWITTER_ACCESS_SECRET` dans backend/.env (section Compte) pour connecter ton
          profil Twitter.
        </Alert>
      )}
      {integrationInfo && integrationInfo.connected && !integrationInfo.publishReady && (
        <Alert severity="warning">
          Les Access Token sont détectés mais pas les clés `TWITTER_API_KEY` / `TWITTER_API_SECRET`. Ajoute-les dans
          backend/.env pour autoriser la publication automatique.
        </Alert>
      )}

      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <ForgeCard
            title="Brouillons"
            subtitle="LISTE"
            actions={
              drafts.length > 0 && (
                <Button variant="text" size="small" onClick={handleCreateDraft} disabled={creating}>
                  {creating ? "Création..." : "Nouveau"}
                </Button>
              )
            }
          >
            {renderDraftList()}
          </ForgeCard>
        </Grid>

        <Grid item xs={12} md={8}>
          {editorDraft ? (
            <Stack spacing={3}>
              <ForgeCard
                title={editorDraft.title || "Sans titre"}
                subtitle="EDITEUR"
                helper="Rédige ton thread, vérifie la limite de caractères et décide quand publier."
                actions={
                  editorDraft.status !== "published" && (
                    <Button
                      color="error"
                      variant="text"
                      size="small"
                      onClick={() => handleDeleteDraft(editorDraft.id)}
                    >
                      Supprimer
                    </Button>
                  )
                }
              >
                <Stack spacing={3}>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                    <TextField
                      label="Titre interne"
                      value={editorDraft.title}
                      onChange={(event) => updateEditorField("title", event.target.value)}
                      fullWidth
                    />
                    <TextField
                      select
                      SelectProps={{ native: true }}
                      label="Format"
                      value={editorDraft.variant || "tweet.simple"}
                      onChange={(event) => updateEditorField("variant", event.target.value)}
                      fullWidth
                    >
                      {VARIANT_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </TextField>
                  </Stack>

                  <Stack direction="row" spacing={2} alignItems="center">
                    <Typography variant="subtitle2">Statut :</Typography>
                    <ToggleButtonGroup
                      size="small"
                      value={editorDraft.status}
                      exclusive
                      onChange={(_, value) => value && updateEditorField("status", value)}
                    >
                      {STATUS_OPTIONS.map((option) => (
                        <ToggleButton key={option.value} value={option.value}>
                          {option.label}
                        </ToggleButton>
                      ))}
                    </ToggleButtonGroup>
                    <Chip size="small" {...activeStatusProps} />
                  </Stack>

                  <Stack spacing={1}>
                    <Typography variant="subtitle2">Source journal</Typography>
                    {sourceInfo ? (
                      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                        <Typography fontWeight={600}>{sourceInfo.title}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {(sourceInfo.type === "trade" ? "Trade" : "Analyse").toUpperCase()}
                          {sourceInfo.symbol ? ` • ${sourceInfo.symbol}` : ""}
                        </Typography>
                        {sourceInfo.date && (
                          <Typography variant="caption" color="text.secondary">
                            {sourceInfo.date}
                          </Typography>
                        )}
                      </Paper>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Sélectionne une analyse ou un trade pour alimenter Gemini et récupérer les images associées.
                      </Typography>
                    )}
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={handleOpenEntryDialog}
                        disabled={entriesLoading}
                      >
                        {entriesLoading ? "Chargement..." : "Choisir dans le journal"}
                      </Button>
                      {sourceInfo && (
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

                  <Stack spacing={2}>
                    <Typography variant="subtitle2">Thread</Typography>
                    <Stack spacing={2}>
                      {previewTweets.map((tweet, index) => renderTweetEditor(tweet, index))}
                    </Stack>
                    <Button
                      variant="outlined"
                      startIcon={<AddCommentIcon />}
                      onClick={addTweetBlock}
                      sx={{ alignSelf: "flex-start" }}
                    >
                      Ajouter un tweet
                    </Button>
                  </Stack>

                  <Divider />

                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                    <Button
                      variant="contained"
                      startIcon={<SaveIcon />}
                      disabled={saving || !isDirty}
                      onClick={handleSaveDraft}
                    >
                      {saving ? "Enregistrement..." : "Enregistrer"}
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<AutoAwesomeIcon />}
                      onClick={handleGenerateWithGemini}
                      disabled={generating || !sourceInfo}
                      sx={{ flexShrink: 0 }}
                    >
                      {generating ? "Génération..." : "Générer avec Gemini"}
                    </Button>
                    <Box flexGrow={1} />
                    <Button
                      variant="contained"
                      color="secondary"
                      startIcon={<RocketLaunchIcon />}
                      disabled={publishing || editorDraft.status === "published"}
                      onClick={handlePublishDraft}
                    >
                      {publishing ? "Publication..." : editorDraft.status === "published" ? "Publié" : "Publier"}
                    </Button>
                  </Stack>
                </Stack>
              </ForgeCard>

              <ForgeCard title="Prévisualisation" subtitle="APERÇU LIVE">
                <Stack spacing={2}>
                  {previewTweets.map((tweet, index) => {
                    const tweetMedia = Array.isArray(tweet.media) ? tweet.media : [];
                    return (
                      <Box
                        key={tweet.id}
                        sx={{
                          p: 2,
                          borderRadius: 3,
                          border: (theme) => `1px solid ${theme.palette.divider}`,
                          background: (theme) =>
                            theme.palette.mode === "dark"
                              ? "linear-gradient(180deg, rgba(15,23,42,0.6), rgba(15,23,42,0.2))"
                              : "linear-gradient(180deg, rgba(255,255,255,0.9), rgba(248,250,252,0.9))",
                        }}
                        onDragOver={(event) => {
                          if (draggingMedia) {
                            event.preventDefault();
                          }
                        }}
                        onDrop={handleMediaDrop(index, null)}
                      >
                        <Stack spacing={1}>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Box
                              sx={{
                                width: 32,
                                height: 32,
                                borderRadius: "50%",
                                background: (theme) => theme.palette.primary.main,
                                opacity: 0.6,
                              }}
                            />
                            <Stack>
                              <Typography fontWeight={600}>{integrationInfo?.handle || "TradeForge"}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {integrationInfo?.handle || "@tradeforge"}
                              </Typography>
                            </Stack>
                          </Stack>
                          {tweet.text ? (
                            <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
                              {tweet.text}
                            </Typography>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              (Commence à écrire pour visualiser le rendu)
                            </Typography>
                          )}
                          {tweetMedia.length > 0 && (
                            <Grid
                              container
                              spacing={1}
                              onDragOver={(event) => event.preventDefault()}
                              onDrop={handleMediaDrop(index, null)}
                            >
                              {tweetMedia.map((attachment, attachIndex) => (
                                <Grid item xs={tweetMedia.length > 1 ? 6 : 12} key={attachment.id}>
                                  <Box
                                    sx={{
                                      position: "relative",
                                      borderRadius: 2,
                                      overflow: "hidden",
                                      outline:
                                        draggingMedia?.mediaId === attachment.id &&
                                        draggingMedia?.tweetIndex === index
                                          ? (theme) => `1px dashed ${theme.palette.primary.main}`
                                          : "none",
                                    }}
                                    draggable
                                    onDragStart={handleMediaDragStart(index, attachment.id)}
                                    onDragEnd={handleMediaDragEnd}
                                    onDragOver={(event) => event.preventDefault()}
                                    onDrop={handleMediaDrop(index, attachment.id)}
                                  >
                                    <Box
                                      component="img"
                                      src={attachment.src}
                                      alt={attachment.caption || "Image"}
                                      sx={{
                                        width: "100%",
                                        height: 180,
                                        objectFit: "cover",
                                        display: "block",
                                      }}
                                    />
                                    <Stack
                                      direction="row"
                                      spacing={0.5}
                                      sx={{ position: "absolute", top: 8, right: 8 }}
                                    >
                                      <IconButton
                                        size="small"
                                        onClick={() => handleReorderAttachment(index, attachment.id, -1)}
                                        disabled={attachIndex === 0}
                                        sx={{
                                          color: "#111",
                                          backgroundColor: "rgba(255,255,255,0.85)",
                                        }}
                                      >
                                        <ChevronLeftIcon fontSize="small" />
                                      </IconButton>
                                      <IconButton
                                        size="small"
                                        onClick={() => handleReorderAttachment(index, attachment.id, 1)}
                                        disabled={attachIndex === tweetMedia.length - 1}
                                        sx={{
                                          color: "#111",
                                          backgroundColor: "rgba(255,255,255,0.85)",
                                        }}
                                      >
                                        <ChevronRightIcon fontSize="small" />
                                      </IconButton>
                                      <IconButton
                                        size="small"
                                        onClick={() => handleRemoveAttachment(index, attachment.id)}
                                        sx={{
                                          color: "#111",
                                          backgroundColor: "rgba(255,255,255,0.85)",
                                        }}
                                      >
                                        <DeleteOutlineIcon fontSize="small" />
                                      </IconButton>
                                    </Stack>
                                  </Box>
                                </Grid>
                              ))}
                            </Grid>
                          )}
                          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems="center" mt={1}>
                            <Button
                              variant="outlined"
                              startIcon={<AddPhotoAlternateIcon />}
                              onClick={handleAddAttachmentClick(index)}
                            >
                              Ajouter une image
                            </Button>
                            <Typography variant="caption" color="text.secondary">
                              Formats supportés : fichiers images ou captures copiées depuis le journal.
                            </Typography>
                          </Stack>
                          <Typography variant="caption" color="text.secondary">
                            {index + 1} / {previewCount}
                          </Typography>
                        </Stack>
                      </Box>
                    );
                  })}
                </Stack>
              </ForgeCard>
            </Stack>
          ) : (
            <ForgeCard title="Sélectionne un brouillon">
              <Typography variant="body2" color="text.secondary">
                Choisis un brouillon dans la liste ou crée-en un nouveau pour démarrer.
              </Typography>
            </ForgeCard>
          )}
        </Grid>
      </Grid>
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={handleAttachmentFileChange}
      />
      <Dialog open={isEntryDialogOpen} onClose={() => setEntryDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Sélectionner une entrée du journal</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <TextField
              value={entrySearch}
              onChange={(event) => setEntrySearch(event.target.value)}
              placeholder="Rechercher par titre ou symbole..."
              size="small"
              fullWidth
            />
            {entriesLoading ? (
              <Stack alignItems="center" py={4}>
                <CircularProgress size={24} />
              </Stack>
            ) : filteredEntries.length ? (
              <List dense disablePadding>
                {filteredEntries.map((entry) => (
                  <ListItemButton
                    key={entry.id}
                    onClick={() => handleAttachEntry(entry)}
                    alignItems="flex-start"
                  >
                    <ListItemAvatar>
                      <Avatar
                        variant="rounded"
                        src={entry.metadata?.images?.[0]?.src || undefined}
                        alt={entry.metadata?.symbol || ""}
                      >
                        {(entry.metadata?.symbol || entry.type || "J")[0]}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={entry.metadata?.title || `Entrée #${entry.id}`}
                      secondary={
                        <>
                          <Typography variant="caption" component="span" color="text.secondary">
                            {(entry.type === "trade" ? "Trade" : "Analyse").toUpperCase()}
                            {entry.metadata?.symbol ? ` • ${entry.metadata.symbol}` : ""}
                          </Typography>
                          {entry.metadata?.date && (
                            <Typography
                              variant="caption"
                              component="div"
                              color="text.secondary"
                              sx={{ mt: 0.5 }}
                            >
                              {entry.metadata.date}
                            </Typography>
                          )}
                        </>
                      }
                    />
                  </ListItemButton>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary">
                {entriesError || "Aucune entrée disponible."}
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
        autoHideDuration={5000}
        onClose={() => setNotification((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          severity={notification.severity}
          sx={{ width: "100%" }}
          onClose={() => setNotification((prev) => ({ ...prev, open: false }))}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Stack>
  );
};

export default TwitterStudio;
