// frontend/src/pages/Journal.js
// (Version Corrigée)

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { fetchJournalEntries } from "../services/journalClient";

// --- Importation des utilitaires ---
// --- CORRECTION ICI ---
import {
  formatDate,
  getEntryImage,
  getEntryTitle,
  isValidDate,
} from "../utils/journalUtils";

// --- Importation des 4 variantes de Cartes ---
import FocusEntryCard from "../components/FocusEntryCard";
import InspectorEntryCard from "../components/InspectorEntryCard";
import OverlayEntryCard from "../components/OverlayEntryCard";
import PolaroidEntryCard from "../components/PolaroidEntryCard";

import JournalHeroMinimal from "../components/JournalHeroMinimal";

 import FilterBarPopover from "../components/FilterBarPopover";

const Journal = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [detailEntry, setDetailEntry] = useState(null); // Pour le modal

  // État unifié pour tous les filtres
  const [filters, setFilters] = useState({
    searchQuery: "",
    filterType: "all",
    startDate: "",
    endDate: "",
    viewMode: "inspector", // 'inspector', 'polaroid', 'overlay', 'focus'
  });

  useEffect(() => {
    setLoading(true);
    fetchJournalEntries()
      .then(setEntries)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Filtre les entrées en fonction de l'état des filtres
  const filteredEntries = useMemo(() => {
    return entries
      .filter((entry) => {
        // Filtre Type
        if (filters.filterType !== "all" && entry.type !== filters.filterType)
          return false;

        // Filtre Recherche
        if (filters.searchQuery) {
          const query = filters.searchQuery.toLowerCase();
          const title = (entry.metadata?.title || "").toLowerCase();
          const content = (entry.content || "").toLowerCase();
          const symbol = (entry.metadata?.symbol || "").toLowerCase();
          if (
            !title.includes(query) &&
            !content.includes(query) &&
            !symbol.includes(query)
          ) {
            return false;
          }
        }

        // Filtre Date
        const entryDate = new Date(entry.metadata?.date || entry.createdAt);
        if (!isValidDate(entryDate)) return true; // Ne pas filtrer si date invalide

        if (filters.startDate) {
          // new Date() ajuste au fuseau horaire, ce qui peut causer des problèmes.
          // Créer la date en UTC pour être sûr.
          const start = new Date(filters.startDate + 'T00:00:00Z');
          if (entryDate < start) return false;
        }
        if (filters.endDate) {
          const end = new Date(filters.endDate + 'T23:59:59Z');
          if (entryDate > end) return false;
        }

        return true;
      })
      .sort(
        (a, b) =>
          new Date(b.metadata?.date || b.createdAt) -
          new Date(a.metadata?.date || a.createdAt)
      );
  }, [entries, filters]);

  const handleOpenModal = (entry) => setDetailEntry(entry);
  const handleCloseModal = () => setDetailEntry(null);

  // Handler pour le sélecteur de vue
  const handleViewChange = (_, newMode) => {
    if (newMode) setFilters((f) => ({ ...f, viewMode: newMode }));
  };

  // Handler pour la réinitialisation
  const handleResetFilters = () => {
    setFilters((f) => ({
      ...f,
      searchQuery: "",
      filterType: "all",
      startDate: "",
      endDate: "",
    }));
  };

  // Fonction pour afficher la bonne carte en fonction du mode
  const renderEntryCard = (entry) => {
    switch (filters.viewMode) {
      case "polaroid":
        return (
          <Grid item xs={12} sm={6} md={4} lg={3} key={entry.id}>
            <PolaroidEntryCard
              entry={entry}
              onClick={() => handleOpenModal(entry)}
            />
          </Grid>
        );
      case "overlay":
        return (
          <Grid item xs={12} sm={6} md={6} lg={4} key={entry.id}>
            <OverlayEntryCard
              entry={entry}
              onClick={() => handleOpenModal(entry)}
            />
          </Grid>
        );
      case "focus":
        return (
          <Grid item xs={12} sm={12} md={6} key={entry.id}>
            <FocusEntryCard
              entry={entry}
              onClick={() => handleOpenModal(entry)}
            />
          </Grid>
        );
      case "inspector":
      default:
        return (
          <Grid item xs={12} key={entry.id}>
            <InspectorEntryCard
              entry={entry}
              onClick={() => handleOpenModal(entry)}
            />
          </Grid>
        );
    }
  };

  // Détermine si le conteneur doit être une Grille ou un Stack
  const listContainerProps =
    filters.viewMode === "inspector"
      ? { container: false, spacing: 2.5, component: Stack }
      : { container: true, spacing: 2.5, component: Grid };

  return (
    <Stack spacing={4} pb={6}>
      <JournalHeroMinimal />

      <FilterBarPopover
        filters={filters}
        onFilterChange={setFilters}
        onViewChange={handleViewChange}
        onReset={handleResetFilters}
      /> 

      {/* === 3. ZONE DE RENDU (gérée par le sélecteur de vue) === */}
      {loading && <CircularProgress sx={{ alignSelf: "center" }} />}
      {error && <Alert severity="error">{error}</Alert>}

      {!loading && !error && (
        <Box {...listContainerProps}>
          {filteredEntries.length > 0 ? (
            filteredEntries.map(renderEntryCard)
          ) : (
            <Grid item xs={12}>
              <Paper
                variant="outlined"
                sx={{ p: 4, textAlign: "center", width: "100%" }}
              >
                <Typography color="text.secondary">
                  Aucune entrée trouvée pour ces filtres.
                </Typography>
              </Paper>
            </Grid>
          )}
        </Box>
      )}

      {/* === MODAL DE DÉTAIL (utilise getEntryTitle) === */}
      <Dialog
        fullWidth
        maxWidth="md"
        open={Boolean(detailEntry)}
        onClose={handleCloseModal}
      >
        <DialogTitle>
          {getEntryTitle(detailEntry)} 
        </DialogTitle>
        <DialogContent>
          <Typography variant="caption" color="text.secondary">
            {formatDate(detailEntry?.metadata?.date || detailEntry?.createdAt, {
              dateStyle: "full",
              timeStyle: "short",
            })}
          </Typography>

          {getEntryImage(detailEntry) && (
            <Box
              component="img"
              src={getEntryImage(detailEntry)}
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
            {detailEntry?.content}
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
            {JSON.stringify(detailEntry?.metadata, null, 2)}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal}>Fermer</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
};

export default Journal;