// frontend/src/components/JournalEntryModal.js
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import EditIcon from "@mui/icons-material/Edit";
import LabelIcon from "@mui/icons-material/Label";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import TimerIcon from "@mui/icons-material/Timer";
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
  Typography,
  alpha,
} from "@mui/material";
import { useEffect, useState } from "react";
import {
  deleteJournalEntry,
  updateJournalEntry,
} from "../services/journalClient";
import {
  formatDate, // Récupère la 1ère image (qui sera l'image principale)
  getEntryTitle,
  isValidDate,
  resultTone,
  typeLabel
} from "../utils/journalUtils";
import EditEntryForm from "./EditEntryForm";

// --- Fonctions Utilitaires ---

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

const toInputDateTime = (dateString) => {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    if (!isValidDate(date)) {
      console.warn("Date invalide dans les métadonnées:", dateString);
      return "";
    }
    const offset = date.getTimezoneOffset() * 60000;
    const localISOTime = new Date(date.getTime() - offset).toISOString().slice(0, 16);
    return localISOTime;
    
  } catch (e) {
    return "";
  }
};

// --- Composant Principal ---

const JournalEntryModal = ({ entry, open, onClose, onUpdate, onDelete }) => {
  const [isMinimalView, setIsMinimalView] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedEntry, setEditedEntry] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [mutationState, setMutationState] = useState({
    loading: false,
    error: "",
  });

  const [previewImageSrc, setPreviewImageSrc] = useState(null);

  useEffect(() => {
    if (entry) {
      const safeMetadata = entry.metadata || {};
      const displayDate = safeMetadata.date || entry.createdAt;

      setEditedEntry({
        ...JSON.parse(JSON.stringify(entry)),
        metadata: {
          ...safeMetadata,
          timeframe: timeframesStringToArray(safeMetadata.timeframe),
          date: toInputDateTime(displayDate)
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
    if (!editedEntry) return;
    setMutationState({ loading: true, error: "" });

    const localDate = new Date(editedEntry.metadata.date);
    const isoDate = isValidDate(localDate) ? localDate.toISOString() : new Date().toISOString();

    const entryToSave = {
      ...editedEntry,
      metadata: {
        ...editedEntry.metadata,
        timeframe: timeframesArrayToString(editedEntry.metadata.timeframe),
        date: isoDate,
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

  const handleImageDelete = (indexToDelete) => {
    setEditedEntry(prev => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        images: (prev.metadata.images || []).filter((_, index) => index !== indexToDelete)
      }
    }));
  };
  
  // Handler pour définir une image comme principale (en la déplaçant à l'index 0)
  const handleSetMainImage = (indexToMakeMain) => {
    setEditedEntry(prev => {
      const images = [...(prev.metadata.images || [])];
      if (indexToMakeMain < 0 || indexToMakeMain >= images.length) {
        return prev; // Index invalide
      }
      // 1. Retire l'image de sa position actuelle
      const [imageToMove] = images.splice(indexToMakeMain, 1);
      // 2. Insère l'image au début
      images.unshift(imageToMove);
      return {
        ...prev,
        metadata: {
          ...prev.metadata,
          images: images
        }
      };
    });
  };


  const handlePaste = (event) => {
    if (!isEditing) return;

    const items = event.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile();
        if (!file) continue;

        setMutationState({ loading: true, error: "Traitement de l'image..." });

        const reader = new FileReader();
        reader.onload = (e) => {
          const src = e.target.result;
          setEditedEntry(prev => ({
            ...prev,
            metadata: {
              ...prev.metadata,
              images: [...(prev.metadata.images || []), { src }]
            }
          }));
          setMutationState({ loading: false, error: "" });
        };
        reader.onerror = () => {
           setMutationState({ loading: false, error: "Impossible de lire l'image." });
        };
        reader.readAsDataURL(file);
        
        event.preventDefault();
        break; 
      }
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
  
  const displayEntry = isEditing ? editedEntry : entry;
  const displayImages = displayEntry.metadata?.images || [];
  const mainImage = displayImages[0]?.src || null;

  return (
    <>
      <Dialog 
        fullWidth 
        maxWidth="md" 
        open={open} 
        onClose={handleClose}
        onPaste={handlePaste}
      >
        <DialogTitle sx={{ pr: { xs: 8, md: 8 } }}>
          {isEditing ? "Modifier l'analyse" : getEntryTitle(displayEntry)}
        </DialogTitle>

        <DialogContent dividers sx={{ p: { xs: 2, md: 3 } }}>
          {mutationState.error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {mutationState.error}
            </Alert>
          )}
          {mutationState.loading && mutationState.error === "Traitement de l'image..." && (
             <Alert severity="info" sx={{ mb: 2 }}>Traitement de l'image...</Alert>
          )}

          {isEditing ? (
            // --- VUE ÉDITION ---
            <EditEntryForm
              entry={editedEntry}
              onDataChange={setEditedEntry}
              onImageDelete={handleImageDelete}
              onImageClick={(src) => setPreviewImageSrc(src)}
              onSetMainImage={handleSetMainImage}
            />
          ) : (
            // --- VUE LECTURE ---
            <>
              {isMinimalView ? (
                <Stack spacing={3}>
                   {(displayEntry.metadata?.grade ||
                    (displayEntry.type === "trade" && displayEntry.metadata?.result)) && (
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
                            {displayEntry.metadata?.grade || displayEntry.metadata?.result}
                          </Typography>
                        </Stack>
                      </Stack>
                    </Paper>
                  )}
                  
                  <Grid container spacing={3}>
                    {displayImages.length > 0 && (
                      <Grid item xs={12} md={6}>
                        <Stack spacing={1.5}>
                          {/* 1. Image Principale (1ère image) */}
                          <Box
                            component="img"
                            src={mainImage}
                            alt="Capture d'écran principale"
                            onClick={() => setPreviewImageSrc(mainImage)}
                            sx={{
                              width: "100%",
                              maxHeight: 250, // Hauteur réduite
                              objectFit: "contain",
                              borderRadius: 2,
                              border: "1px solid",
                              borderColor: "divider",
                              cursor: 'zoom-in',
                              bgcolor: 'rgba(0,0,0,0.02)'
                            }}
                          />
                          
                          {/* 2. Autres images en vignettes horizontales */}
                          {displayImages.length > 1 && (
                            <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', pb: 0.5 }}>
                              {displayImages.slice(1).map((image, index) => (
                                <Paper
                                  key={index}
                                  variant="outlined"
                                  onClick={() => setPreviewImageSrc(image.src)}
                                  sx={{
                                    flexShrink: 0,
                                    cursor: 'zoom-in',
                                    overflow: 'hidden',
                                    width: 80, // Largeur fixe
                                    height: 60, // Hauteur fixe
                                    bgcolor: 'action.hover'
                                  }}
                                >
                                  <Box
                                    component="img"
                                    src={image.src}
                                    alt={`Aperçu ${index + 2}`}
                                    sx={{
                                      width: "100%",
                                      height: "100%",
                                      objectFit: "cover",
                                    }}
                                  />
                                </Paper>
                              ))}
                            </Stack>
                          )}
                        </Stack>
                      </Grid>
                    )}
                    <Grid
                      item
                      xs={12}
                      md={displayImages.length > 0 ? 6 : 12}
                    >
                      <Grid container spacing={2}>
                        <MetaItem
                          icon={<LabelIcon fontSize="small" />}
                          label="Type"
                        >
                          <Chip
                            label={
                              typeLabel[displayEntry.type]?.chip || displayEntry.type
                            }
                            size="small"
                            color={
                              typeLabel[displayEntry.type]?.color || "default"
                            }
                            variant="outlined"
                            sx={{ fontWeight: 600 }}
                          />
                        </MetaItem>
                        {displayEntry.type === "trade" && (
                          <MetaItem
                            icon={<CheckCircleOutlineIcon fontSize="small" />}
                            label="Résultat"
                          >
                            <Chip
                              label={displayEntry.metadata?.result || "N/A"}
                              size="small"
                              color={resultTone(displayEntry.metadata?.result)}
                              sx={{ fontWeight: 600 }}
                            />
                          </MetaItem>
                        )}
                        <MetaItem
                          icon={<ShowChartIcon fontSize="small" />}
                          label="Symbole(s)"
                        >
                          <Typography variant="body1" fontWeight={600}>
                            {displayEntry.metadata?.symbol || "N/A"}
                          </Typography>
                        </MetaItem>
                        <MetaItem
                          icon={<TimerIcon fontSize="small" />}
                          label="Timeframe(s)"
                        >
                          <Typography variant="body1" fontWeight={600}>
                            {displayEntry.metadata?.timeframe || "N/A"}
                          </Typography>
                        </MetaItem>
                        <MetaItem
                          icon={<CalendarTodayIcon fontSize="small" />}
                          label="Date"
                        >
                          <Typography variant="body1" fontWeight={600}>
                            {formatDate(
                              displayEntry.metadata?.date || displayEntry.createdAt,
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
                      displayEntry.metadata?.date || displayEntry.createdAt,
                      { dateStyle: "full", timeStyle: "short" }
                    )}
                  </Typography>
                  
                  <Stack direction="row" spacing={1} sx={{mt: 2, flexWrap: 'wrap'}}>
                  {displayImages.map((img, idx) => (
                    <Box
                      key={idx}
                      component="img"
                      src={img.src}
                      alt={`Capture ${idx + 1}`}
                      onClick={() => setPreviewImageSrc(img.src)}
                      sx={{
                        height: 100,
                        width: 'auto',
                        borderRadius: 1,
                        border: "1px solid",
                        borderColor: "divider",
                        cursor: 'zoom-in'
                      }}
                    />
                  ))}
                  </Stack>
                  
                  <Typography
                    variant="body1"
                    sx={{
                      whiteSpace: "pre-wrap",
                      mt: 2,
                      fontFamily: "monospace",
                      fontSize: "0.9rem",
                    }}
                  >
                    {displayEntry?.content}
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
                    {JSON.stringify(displayEntry?.metadata, null, 2)}
                  </Box>
                </>
              )}
            </>
          )}
        </DialogContent>

        <DialogActions
          sx={{
            justifyContent: "space-between",
            p: { xs: 1, md: 2 },
            pt: { xs: 1, md: 1.5 },
          }}
        >
          {isEditing ? (
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

      <Dialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        maxWidth="xs"
      >
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

      <Dialog
        open={Boolean(previewImageSrc)}
        onClose={() => setPreviewImageSrc(null)}
        maxWidth="lg"
        PaperProps={{
          sx: {
            bgcolor: 'transparent',
            boxShadow: 'none',
            overflow: 'hidden'
          }
        }}
      >
        <Box
          component="img"
          src={previewImageSrc || ""}
          alt="Aperçu"
          onClick={() => setPreviewImageSrc(null)}
          sx={{
            width: '100%',
            height: 'auto',
            maxHeight: '90vh',
            objectFit: 'contain',
            cursor: 'zoom-out'
          }}
        />
      </Dialog>
    </>
  );
};

export default JournalEntryModal;