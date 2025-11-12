// frontend/src/components/JournalEntryModal.js
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import EditIcon from "@mui/icons-material/Edit";
// --- AJOUTS : Icônes pour la nouvelle vue ---
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import LabelIcon from "@mui/icons-material/Label";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import TimerIcon from "@mui/icons-material/Timer";
// --- FIN AJOUTS ---
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  Paper,
  Stack,
  Switch,
  Typography, // --- AJOUT ---
  alpha, // --- AJOUT ---
} from "@mui/material";
import { useEffect, useState } from "react";
import {
  deleteJournalEntry,
  updateJournalEntry,
} from "../services/journalClient";
import {
  formatDate,
  getEntryImage,
  getEntryTitle,
  resultTone,
  typeLabel,
} from "../utils/journalUtils";
import EditEntryForm from "./EditEntryForm";

// ... (Les fonctions de conversion de timeframe restent inchangées) ...
const timeframesStringToArray = (tfString) => {
  if (!tfString) return [];
  if (Array.isArray(tfString)) return tfString;
  return tfString.split(/[\s,/\\]+/).filter(Boolean);
};
const timeframesArrayToString = (tfArray) => {
  if (!tfArray) return "";
  if (typeof tfArray === "string") return tfArray;
  return tfArray.join(" / ");
};

// --- AJOUT : Composant utilitaire pour la grille de métadonnées ---
const MetaItem = ({ icon, label, children }) => (
  <Grid item xs={12} sm={6}>
    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minHeight: 40 }}>
      <Box sx={{ color: "text.secondary", mt: 0.5, alignSelf: 'flex-start' }}>{icon}</Box>
      <Stack spacing={0}>
        <Typography variant="overline" color="text.secondary" sx={{ lineHeight: 1.3 }}>
          {label}
        </Typography>
        <Box>{children}</Box>
      </Stack>
    </Stack>
  </Grid>
);
// --- FIN AJOUT ---

const JournalEntryModal = ({ entry, open, onClose, onUpdate, onDelete }) => {
  const [isMinimalView, setIsMinimalView] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedEntry, setEditedEntry] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [mutationState, setMutationState] = useState({
    loading: false,
    error: "",
  });

  useEffect(() => {
    if (entry) {
      const safeMetadata = entry.metadata || {};
      setEditedEntry({
        ...JSON.parse(JSON.stringify(entry)),
        metadata: {
          ...safeMetadata,
          timeframe: timeframesStringToArray(safeMetadata.timeframe),
        },
      });
    } else {
      setEditedEntry(null);
    }
  }, [entry]);

  const handleClose = () => {
    setIsEditing(false);
    setIsMinimalView(true);
    setMutationState({ loading: false, error: "" });
    onClose();
  };

  const handleUpdate = async () => {
    // ... (Logique de handleUpdate inchangée) ...
    if (!editedEntry) return;
    setMutationState({ loading: true, error: "" });
    const entryToSave = {
      ...editedEntry,
      metadata: {
        ...editedEntry.metadata,
        timeframe: timeframesArrayToString(editedEntry.metadata.timeframe),
      },
    };
    try {
      const updated = await updateJournalEntry(entryToSave);
      onUpdate(updated);
      setIsEditing(false);
      setMutationState({ loading: false, error: "" });
    } catch (err) {
      setMutationState({ loading: false, error: err.message });
    }
  };

  const handleDelete = async () => {
    // ... (Logique de handleDelete inchangée) ...
    if (!entry) return;
    setMutationState({ loading: true, error: "" });
    try {
      await deleteJournalEntry(entry.id);
      onDelete(entry.id);
      setShowDeleteConfirm(false);
      handleClose();
    } catch (err)
      {
      setMutationState({ loading: false, error: err.message });
    }
  };

  if (!entry) return null;
  if (isEditing && !editedEntry) {
    return (
      <Dialog fullWidth maxWidth="md" open={open} onClose={handleClose}>
        <DialogContent sx={{ p: 4, textAlign: "center" }}>
          <CircularProgress />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog fullWidth maxWidth="md" open={open} onClose={handleClose}>
        <DialogTitle sx={{ pr: { xs: 8, md: 8 } }}>
          {isEditing ? "Modifier l'analyse" : getEntryTitle(entry)}
        </DialogTitle>

        <DialogContent dividers sx={{ p: { xs: 2, md: 3 } }}>
          {mutationState.error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {mutationState.error}
            </Alert>
          )}

          {isEditing ? (
            // --- VUE ÉDITION ---
            <EditEntryForm
              entry={editedEntry}
              onDataChange={setEditedEntry}
            />
          ) : (
            // --- VUE LECTURE ---
            <>
              {/* ============================================== */}
              {/* === NOUVEAU DESIGN "SCORECARD" MINIMAL === */}
              {/* ============================================== */}
              {isMinimalView ? (
                <Stack spacing={3}>
                  {/* 1. Le Verdict / Note (mis en avant) */}
                  {(entry.metadata?.grade ||
                    (entry.type === "trade" && entry.metadata?.result)) && (
                    <Paper
                      variant="outlined"
                      sx={(theme) => ({
                        p: 2.5,
                        bgcolor:
                          theme.palette.mode === "dark"
                            ? alpha(theme.palette.primary.main, 0.05)
                            : alpha(theme.palette.primary.main, 0.08),
                        borderColor:
                          theme.palette.mode === "dark"
                            ? alpha(theme.palette.primary.main, 0.3)
                            : alpha(theme.palette.primary.main, 0.2),
                      })}
                    >
                      <Stack
                        direction="row"
                        spacing={1.5}
                        alignItems="flex-start"
                      >
                        <StarBorderIcon
                          sx={{ color: "primary.main", mt: 0.5 }}
                        />
                        <Stack>
                          <Typography variant="overline" color="primary.main">
                            Note / Verdict
                          </Typography>
                          <Typography
                            variant="h6"
                            fontWeight={600}
                            sx={{ lineHeight: 1.4 }}
                          >
                            {entry.metadata?.grade || entry.metadata?.result}
                          </Typography>
                        </Stack>
                      </Stack>
                    </Paper>
                  )}

                  {/* 2. L'image et les Méta-données */}
                  <Grid container spacing={3}>
                    {/* L'image (si elle existe) */}
                    {getEntryImage(entry) && (
                      <Grid item xs={12} md={6}>
                        <Box
                          component="img"
                          src={getEntryImage(entry)}
                          alt="Capture d'écran"
                          sx={{
                            width: "100%",
                            borderRadius: 2,
                            border: "1px solid",
                            borderColor: "divider",
                          }}
                        />
                      </Grid>
                    )}

                    {/* Les Méta-données */}
                    <Grid
                      item
                      xs={12}
                      md={getEntryImage(entry) ? 6 : 12}
                    >
                      <Grid container spacing={2}>
                        <MetaItem
                          icon={<LabelIcon fontSize="small" />}
                          label="Type"
                        >
                          <Chip
                            label={
                              typeLabel[entry.type]?.chip || entry.type
                            }
                            size="small"
                            color={
                              typeLabel[entry.type]?.color || "default"
                            }
                            variant="outlined"
                            sx={{ fontWeight: 600 }}
                          />
                        </MetaItem>

                        {entry.type === "trade" && (
                          <MetaItem
                            icon={<CheckCircleOutlineIcon fontSize="small" />}
                            label="Résultat"
                          >
                            <Chip
                              label={entry.metadata?.result || "N/A"}
                              size="small"
                              color={resultTone(entry.metadata?.result)}
                              sx={{ fontWeight: 600 }}
                            />
                          </MetaItem>
                        )}

                        <MetaItem
                          icon={<ShowChartIcon fontSize="small" />}
                          label="Symbole(s)"
                        >
                          <Typography variant="body1" fontWeight={600}>
                            {entry.metadata?.symbol || "N/A"}
                          </Typography>
                        </MetaItem>

                        <MetaItem
                          icon={<TimerIcon fontSize="small" />}
                          label="Timeframe(s)"
                        >
                          <Typography variant="body1" fontWeight={600}>
                            {entry.metadata?.timeframe || "N/A"}
                          </Typography>
                        </MetaItem>

                        <MetaItem
                          icon={<CalendarTodayIcon fontSize="small" />}
                          label="Date"
                        >
                          <Typography variant="body1" fontWeight={600}>
                            {formatDate(
                              entry.metadata?.date || entry.createdAt,
                              { dateStyle: "long", timeStyle: "short" }
                            )}
                          </Typography>
                        </MetaItem>
                      </Grid>
                    </Grid>
                  </Grid>
                </Stack>
              ) : (
                // --- VUE COMPLÈTE (JSON) ---
                <>
                  <Typography variant="caption" color="text.secondary">
                    {formatDate(
                      entry.metadata?.date || entry.createdAt,
                      { dateStyle: "full", timeStyle: "short" }
                    )}
                  </Typography>
                  {getEntryImage(entry) && (
                    <Box
                      component="img"
                      src={getEntryImage(entry)}
                      alt="Capture d'écran"
                      sx={{
                        width: "100%",
                        borderRadius: 2,
                        mt: 2,
                        border: "1px solid",
                        borderColor: "divider",
                      }}
                    />
                  )}
                  <Typography
                    variant="body1"
                    sx={{
                      whiteSpace: "pre-wrap",
                      mt: 2,
                      fontFamily: "monospace",
                      fontSize: "0.9rem",
                    }}
                  >
                    {entry?.content}
                  </Typography>
                  <Box
                    component="pre"
                    sx={{
                      fontSize: "0.8rem",
                      opacity: 0.7,
                      maxHeight: 200,
                      overflowY: "auto",
                      bgcolor: "action.hover",
                      p: 1,
                      borderRadius: 1,
                      mt: 2,
                    }}
                  >
                    {JSON.stringify(entry?.metadata, null, 2)}
                  </Box>
                </>
              )}
            </>
          )}
        </DialogContent>

        {/* --- ACTIONS DE LA MODALE --- */}
        <DialogActions
          sx={{
            justifyContent: "space-between",
            p: { xs: 1, md: 2 },
            pt: { xs: 1, md: 1.5 },
          }}
        >
          {isEditing ? (
            // ... (Actions d'édition inchangées) ...
            <Stack direction="row" spacing={1} justifyContent="space-between" width="100%">
              <Button
                variant="outlined"
                color="secondary"
                onClick={() => setIsEditing(false)}
                disabled={mutationState.loading}
              >
                Annuler
              </Button>
              <Button
                variant="contained"
                onClick={handleUpdate}
                disabled={mutationState.loading}
                startIcon={mutationState.loading ? <CircularProgress size={16} color="inherit" /> : null}
              >
                {mutationState.loading ? "Sauvegarde..." : "Sauvegarder"}
              </Button>
            </Stack>
          ) : (
            // ... (Actions de lecture inchangées) ...
            <>
              <Stack direction="row" spacing={1} alignItems="center">
                <FormControlLabel
                  control={
                    <Switch
                      checked={!isMinimalView}
                      onChange={() => setIsMinimalView((prev) => !prev)}
                    />
                  }
                  label="Vue JSON"
                  sx={{ color: "text.secondary", mr: 1 }}
                />
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  onClick={() => setShowDeleteConfirm(true)}
                  startIcon={<DeleteForeverIcon />}
                >
                  Supprimer
                </Button>
              </Stack>
              <Stack direction="row" spacing={1}>
                <Button onClick={handleClose}>Fermer</Button>
                <Button
                  variant="contained"
                  onClick={() => setIsEditing(true)}
                  startIcon={<EditIcon />}
                >
                  Modifier
                </Button>
              </Stack>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* --- MODALE DE CONFIRMATION SUPPRESSION --- */}
      <Dialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        maxWidth="xs"
      >
        {/* ... (Contenu modale suppression inchangé) ... */}
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography>
            Voulez-vous vraiment supprimer cette entrée ? Cette action est
            irréversible.
          </Typography>
          {mutationState.error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {mutationState.error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setShowDeleteConfirm(false)}
            disabled={mutationState.loading}
          >
            Annuler
          </Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
            disabled={mutationState.loading}
            startIcon={mutationState.loading ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {mutationState.loading ? "Suppression..." : "Supprimer"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default JournalEntryModal;