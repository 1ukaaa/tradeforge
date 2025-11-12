// frontend/src/pages/Journal.js
// (Version OPTIMISÉE, utilise JournalEntryModal)

import {
  Alert,
  Box,
  CircularProgress,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { fetchJournalEntries } from "../services/journalClient";

import { isValidDate } from "../utils/journalUtils";

import FocusEntryCard from "../components/FocusEntryCard";
import InspectorEntryCard from "../components/InspectorEntryCard";
import OverlayEntryCard from "../components/OverlayEntryCard";
import PolaroidEntryCard from "../components/PolaroidEntryCard";

import FilterBarPopover from "../components/FilterBarPopover";
import JournalHeroMinimal from "../components/JournalHeroMinimal";

// --- AJOUT : Import de la nouvelle modale ---
import JournalEntryModal from "../components/JournalEntryModal";

const Journal = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [detailEntry, setDetailEntry] = useState(null); // Gère l'ouverture de la modale

  const [filters, setFilters] = useState({
    searchQuery: "",
    filterType: "all",
    startDate: "",
    endDate: "",
    viewMode: "inspector",
  });

  useEffect(() => {
    setLoading(true);
    fetchJournalEntries()
      .then(setEntries)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filteredEntries = useMemo(() => {
    return entries
      .filter((entry) => {
        if (filters.filterType !== "all" && entry.type !== filters.filterType)
          return false;
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
        const entryDate = new Date(entry.metadata?.date || entry.createdAt);
        if (!isValidDate(entryDate)) return true;
        if (filters.startDate) {
          const start = new Date(filters.startDate + "T00:00:00Z");
          if (entryDate < start) return false;
        }
        if (filters.endDate) {
          const end = new Date(filters.endDate + "T23:59:59Z");
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

  const handleViewChange = (_, newMode) => {
    if (newMode) setFilters((f) => ({ ...f, viewMode: newMode }));
  };

  const handleResetFilters = () => {
    setFilters((f) => ({
      ...f,
      searchQuery: "",
      filterType: "all",
      startDate: "",
      endDate: "",
    }));
  };
  
  // --- AJOUT : Logique de mise à jour/suppression (remontée de la modale) ---
  const handleUpdateInList = (updatedEntry) => {
     setEntries((prevEntries) =>
        prevEntries.map((e) => (e.id === updatedEntry.id ? updatedEntry : e))
      );
     // Met aussi à jour l'entrée dans la modale
     setDetailEntry(updatedEntry);
  };
  
  const handleDeleteFromList = (deletedId) => {
    setEntries((prevEntries) =>
        prevEntries.filter((e) => e.id !== deletedId)
      );
  };
  // --- FIN AJOUT ---

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

      {/* --- MODIFIÉ : Appel de la modale externe --- */}
      <JournalEntryModal
        entry={detailEntry}
        open={Boolean(detailEntry)}
        onClose={handleCloseModal}
        onUpdate={handleUpdateInList}
        onDelete={handleDeleteFromList}
      />
    </Stack>
  );
};

export default Journal;