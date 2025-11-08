import AutoStoriesIcon from "@mui/icons-material/AutoStories";
import HourglassBottomIcon from "@mui/icons-material/HourglassBottom";
import QueryStatsIcon from "@mui/icons-material/QueryStats";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  LinearProgress,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import EmptyState from "../components/EmptyState";
import { deleteJournalEntry, fetchJournalEntries, updateJournalEntry } from "../services/journalClient";

const typeLabel = {
  trade: { chip: "Trade", color: "error.main" },
  analyse: { chip: "Analyse", color: "success.main" },
};

const formatDate = (iso) => {
  if (!iso) return "Date inconnue";
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
};

const JournalEntryCard = ({ entry, onView }) => {
  const meta = entry.metadata || {};
  const title = meta.title || `${entry.type === "trade" ? "Trade" : "Analyse"} enregistrée`;
  const dateLabel = meta.date || formatDate(entry.createdAt);
  const planSummary = meta.planSummary || entry.plan || "Plan non renseigné.";
  const outcome = meta.outcome || entry.content?.split("\n").slice(0, 2).join(" ") || "Synthèse en cours.";
  const planAdherence = Math.min(100, Math.max(0, meta.planAdherence ?? (entry.type === "trade" ? 80 : 40)));
  const tags = meta.tags && meta.tags.length ? meta.tags : [entry.type === "trade" ? "Trade" : "Analyse", "IA"];
  const result = meta.result || (entry.type === "trade" ? "Trade" : "Analyse");
  const grade = meta.grade || "À valider";
  const timeframe = meta.timeframe || (entry.type === "trade" ? "H4 / H1" : "Daily / H4");
  const symbol = meta.symbol || "Actif non défini";
  const nextSteps = meta.nextSteps || "Relire la fiche plus tard.";
  const risk = meta.risk || "Risque à qualifier";

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 3, md: 4 },
        borderRadius: 3,
        border: "1px solid rgba(39,58,150,0.08)",
        background: "linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(232,239,255,0.85) 100%)",
      }}
    >
      <Stack spacing={2}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems="flex-start">
          <Stack spacing={0.5}>
            <Typography variant="subtitle2" color="text.secondary">
              {dateLabel}
            </Typography>
            <Typography variant="h5" fontWeight={700}>
              {title}
            </Typography>
          </Stack>
          <Chip label={typeLabel[entry.type]?.chip} sx={{ fontWeight: 600, bgcolor: typeLabel[entry.type]?.color, color: "#fff" }} />
        </Stack>

        <Stack direction="row" spacing={2} flexWrap="wrap" alignItems="center">
          <Chip label={symbol} variant="outlined" size="small" />
          <Stack direction="row" spacing={1} alignItems="center">
            <QueryStatsIcon color="primary" fontSize="small" />
            <Typography variant="body2" color="text.secondary">
              {timeframe}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            <HourglassBottomIcon fontSize="small" />
            <Typography variant="body2" color="text.secondary">
              {result}
            </Typography>
          </Stack>
        </Stack>

        <Divider />

        <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
          <Stack spacing={1} flex={1}>
            <Typography variant="subtitle2" color="text.secondary">
              Plan initial
            </Typography>
            <Typography variant="body2">{planSummary}</Typography>
            <LinearProgress
              variant="determinate"
              value={planAdherence}
              sx={{ borderRadius: 999, height: 6, bgcolor: "rgba(39,58,150,0.12)" }}
            />
            <Typography variant="caption" color="text.secondary">
              Adhérence au plan : {planAdherence}%
            </Typography>
          </Stack>
          <Stack spacing={1} flex={1}>
            <Typography variant="subtitle2" color="text.secondary">
              Dissection
            </Typography>
            <Typography variant="body2">{outcome}</Typography>
            <Typography variant="body2" fontWeight={600} color="text.primary">
              {grade}
            </Typography>
          </Stack>
        </Stack>

        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          {tags.map((tag) => (
            <Chip key={tag} label={tag} size="small" />
          ))}
        </Stack>

        <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
          <Box flex={1}>
            <Typography variant="subtitle2" color="text.secondary">
              Prochaines étapes
            </Typography>
            <Typography variant="body2">{nextSteps}</Typography>
          </Box>
          <Box flex={1}>
            <Typography variant="subtitle2" color="text.secondary">
              Risque critique
            </Typography>
            <Typography variant="body2">{risk}</Typography>
          </Box>
        </Stack>

        <Stack direction={{ xs: "column", md: "row" }} spacing={2} justifyContent="space-between" alignItems="center">
          <Button variant="text" onClick={() => onView(entry)}>
            Voir la fiche complète
          </Button>
          <Button variant="outlined" size="small">
            Exporter
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
};

const Journal = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [detailEntry, setDetailEntry] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState("");
  const [editedPlan, setEditedPlan] = useState("");
  const [operationLoading, setOperationLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editError, setEditError] = useState("");
  const [editSuccess, setEditSuccess] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFetchError("");
    fetchJournalEntries()
      .then((data) => {
        if (cancelled) return;
        setEntries(data);
      })
      .catch((err) => {
        if (cancelled) return;
        setFetchError(err.message || "Erreur lors du chargement du journal.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredEntries = useMemo(
    () => (activeTab === "all" ? entries : entries.filter((entry) => entry.type === activeTab)),
    [entries, activeTab]
  );

  const open = Boolean(detailEntry);
  const onCloseDetail = () => setDetailEntry(null);

  useEffect(() => {
    if (!detailEntry) {
      setEditedContent("");
      setEditedPlan("");
      setIsEditing(false);
      setEditError("");
      setEditSuccess("");
      return;
    }
    setEditedContent(detailEntry.content || "");
    setEditedPlan(detailEntry.plan || detailEntry.metadata?.planSummary || "");
    setIsEditing(false);
    setEditError("");
    setEditSuccess("");
  }, [detailEntry]);

  const handleSaveDetail = async () => {
    if (!detailEntry) return;
    setOperationLoading(true);
    setEditError("");
    setEditSuccess("");
    try {
      const metadata = {
        ...detailEntry.metadata,
        planSummary: editedPlan.split("\n")[0]?.trim() || detailEntry.metadata?.planSummary,
        outcome: editedContent.split("\n").slice(0, 2).join(" ").trim() || detailEntry.metadata?.outcome,
      };
      const updated = await updateJournalEntry({
        id: detailEntry.id,
        type: detailEntry.type,
        content: editedContent,
        plan: editedPlan,
        transcript: detailEntry.transcript,
        metadata,
      });
      setEntries((prev) => prev.map((entry) => (entry.id === updated.id ? updated : entry)));
      setDetailEntry(updated);
      setEditSuccess("Fiche mise à jour.");
      setIsEditing(false);
    } catch (err) {
      setEditError(err.message || "Impossible de mettre à jour la fiche.");
    } finally {
      setOperationLoading(false);
    }
  };

  const handleDeleteDetail = async () => {
    if (!detailEntry) return;
    const confirmed = window.confirm("Supprimer cette entrée du journal ?");
    if (!confirmed) return;
    setDeleteLoading(true);
    setEditError("");
    try {
      await deleteJournalEntry(detailEntry.id);
      setEntries((prev) => prev.filter((entry) => entry.id !== detailEntry.id));
      setDetailEntry(null);
    } catch (err) {
      setEditError(err.message || "Impossible de supprimer la fiche.");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <Stack spacing={4}>
      <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
        <Stack direction="row" spacing={1} alignItems="center">
          <AutoStoriesIcon color="primary" fontSize="large" />
          <Stack>
            <Typography variant="h3" color="primary">
              Journal
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Trades exécutés et analyses stratégiques journalisés pour suivre l’évolution de ta discipline.
            </Typography>
          </Stack>
        </Stack>
        <Button component={Link} to="/" variant="contained" color="primary">
          Ajouter une entrée
        </Button>
      </Stack>

      <Tabs value={activeTab} onChange={(_, value) => value && setActiveTab(value)} sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tab value="all" label="Tout" />
        <Tab value="trade" label="Trades" />
        <Tab value="analyse" label="Analyses" />
      </Tabs>

      {loading && <LinearProgress sx={{ height: 4, borderRadius: 999 }} />}
      {fetchError && <Alert severity="error">{fetchError}</Alert>}

      {!loading && filteredEntries.length === 0 ? (
        <EmptyState
          title="Aucune entrée journalisée pour le moment"
          description="Enregistre une analyse ou un trade depuis l’assistant pour voir la fiche s’ajouter ici."
          actionLabel="Créer une entrée"
          onAction={() => (window.location.href = "/")}
        />
      ) : (
        <Stack spacing={3} sx={{ pb: 4 }}>
          {filteredEntries.map((entry) => (
            <JournalEntryCard key={entry.id} entry={entry} onView={setDetailEntry} />
          ))}
        </Stack>
      )}

      <Dialog fullWidth maxWidth="md" open={open} onClose={onCloseDetail}>
        <DialogTitle sx={{ fontWeight: 700 }}>{detailEntry?.metadata?.title || detailEntry?.content}</DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <Typography variant="subtitle2" color="text.secondary">
              {detailEntry?.metadata?.date || formatDate(detailEntry?.createdAt)} · {detailEntry?.metadata?.symbol || "Actif"}
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              Plan initial
            </Typography>
            {isEditing ? (
              <TextField
                value={editedPlan}
                onChange={(event) => setEditedPlan(event.target.value)}
                multiline
                minRows={3}
                fullWidth
                variant="outlined"
              />
            ) : (
              <Typography variant="body2" color="text.secondary">
                {detailEntry?.metadata?.planSummary || detailEntry?.plan || "Plan non défini."}
              </Typography>
            )}
            <Typography variant="body1" fontWeight={600}>
              Résultat : {detailEntry?.metadata?.result || detailEntry?.type}
            </Typography>
            {isEditing ? (
              <TextField
                value={editedContent}
                onChange={(event) => setEditedContent(event.target.value)}
                multiline
                minRows={10}
                fullWidth
                label="Contenu"
                variant="outlined"
              />
            ) : (
              <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                {detailEntry?.metadata?.outcome || detailEntry?.content}
              </Typography>
            )}
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {(detailEntry?.metadata?.tags || []).map((tag) => (
                <Chip key={tag} label={tag} size="small" />
              ))}
            </Stack>
            <Divider />
            <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
              <Box flex={1}>
                <Typography variant="subtitle2" color="text.secondary">
                  Prochaines étapes
                </Typography>
                <Typography variant="body2">
                  {detailEntry?.metadata?.nextSteps || "À approfondir."}
                </Typography>
              </Box>
              <Box flex={1}>
                <Typography variant="subtitle2" color="text.secondary">
                  Risque critique
                </Typography>
                <Typography variant="body2">{detailEntry?.metadata?.risk || "Aucune remarque."}</Typography>
              </Box>
            </Stack>
            {editError && (
              <Alert severity="error" sx={{ borderRadius: 3 }}>
                {editError}
              </Alert>
            )}
            {editSuccess && (
              <Alert severity="success" sx={{ borderRadius: 3 }}>
                {editSuccess}
              </Alert>
            )}
            {!isEditing && (
              <Box component="pre" sx={{ whiteSpace: "pre-wrap", fontFamily: `'JetBrains Mono','Fira Code',monospace`, bgcolor: "rgba(15,27,61,0.05)", borderRadius: 2, p: 2 }}>
                {detailEntry?.content}
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button variant="text" onClick={onCloseDetail} disabled={operationLoading || deleteLoading}>
            Fermer
          </Button>
          <Button variant="outlined" color="error" onClick={handleDeleteDetail} disabled={deleteLoading || operationLoading}>
            {deleteLoading ? "Suppression…" : "Supprimer"}
          </Button>
          {isEditing ? (
            <>
              <Button
                variant="text"
                onClick={() => {
                  setIsEditing(false);
                  setEditedContent(detailEntry?.content || "");
                  setEditedPlan(detailEntry?.plan || detailEntry?.metadata?.planSummary || "");
                  setEditError("");
                }}
                disabled={operationLoading}
              >
                Annuler
              </Button>
              <Button variant="contained" onClick={handleSaveDetail} disabled={operationLoading}>
                {operationLoading ? "Enregistrement…" : "Enregistrer"}
              </Button>
            </>
          ) : (
            <Button variant="contained" onClick={() => setIsEditing(true)}>
              Modifier
            </Button>
          )}
          <Button variant="contained">Partager</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
};

export default Journal;
