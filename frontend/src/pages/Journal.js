// frontend/src/pages/Journal.js

import {
  Alert,
  alpha,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Fade,
  InputAdornment,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
  useTheme
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { fetchJournalEntries } from "../services/journalClient";
import { formatDate, getEntryImage, getEntryTitle, isValidDate, resultTone, typeLabel } from "../utils/journalUtils";

// Icons
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import BookIcon from "@mui/icons-material/Book";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import FilterListIcon from "@mui/icons-material/FilterList";
import PhotoIcon from "@mui/icons-material/Photo";
import SearchIcon from "@mui/icons-material/Search";

// Components
import JournalEntryModal from "../components/JournalEntryModal";

// --- SUB-COMPONENT: Journal List Item ---
const JournalListItem = ({ entry, onClick }) => {
  const theme = useTheme();
  const meta = entry.metadata || {};
  const firstImage = getEntryImage(entry);
  const title = getEntryTitle(entry);
  const dateLabel = formatDate(meta.date || entry.createdAt);
  const typeInfo = typeLabel[entry.type] || { chip: "Entrée", color: "default" };
  const isTrade = entry.type === 'trade';
  const tone = resultTone(meta.result);

  return (
    <Paper
      elevation={0}
      onClick={onClick}
      sx={{
        p: 2,
        borderRadius: 3,
        border: `1px solid ${theme.palette.divider}`,
        transition: "all 0.2s ease",
        cursor: "pointer",
        "&:hover": {
          bgcolor: alpha(theme.palette.action.hover, 0.1),
          borderColor: theme.palette.primary.main,
          transform: "translateY(-2px)",
          boxShadow: theme.shadows[2],
        },
        display: 'flex',
        alignItems: 'center',
        gap: 3
      }}
    >
      {/* 1. Date Box */}
      <Box sx={{ minWidth: 80, textAlign: 'center' }}>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ textTransform: 'uppercase', fontWeight: 700 }}>
          {new Date(meta.date || entry.createdAt).toLocaleDateString('fr-FR', { month: 'short' })}
        </Typography>
        <Typography variant="h5" fontWeight={700} sx={{ lineHeight: 1 }}>
          {new Date(meta.date || entry.createdAt).getDate()}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {new Date(meta.date || entry.createdAt).getFullYear()}
        </Typography>
      </Box>

      {/* 2. Thumbnail */}
      <Box
        sx={{
          width: 80,
          height: 60,
          borderRadius: 2,
          overflow: 'hidden',
          bgcolor: alpha(theme.palette.divider, 0.1),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}
      >
        {firstImage ? (
          <img src={firstImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <PhotoIcon sx={{ color: 'text.disabled' }} />
        )}
      </Box>

      {/* 3. Main Content */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
          <Chip
            label={typeInfo.chip}
            size="small"
            color={typeInfo.color}
            variant="outlined"
            sx={{ height: 20, fontSize: 10, fontWeight: 700, borderRadius: 1 }}
          />
          {meta.symbol && (
            <Typography variant="caption" fontWeight={700} color="text.secondary">
              {meta.symbol}
            </Typography>
          )}
        </Stack>
        <Typography variant="subtitle1" fontWeight={600} noWrap>
          {title}
        </Typography>
      </Box>

      {/* 4. Result / Status */}
      {isTrade && (
        <Box sx={{ textAlign: 'right', minWidth: 100 }}>
          <Chip
            label={meta.result || "EN COURS"}
            color={tone}
            size="small"
            sx={{ fontWeight: 700, minWidth: 80 }}
          />
        </Box>
      )}

      {/* 5. Arrow */}
      <ArrowForwardIosIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
    </Paper>
  );
};

// --- MAIN PAGE ---
const Journal = () => {
  const theme = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [detailEntry, setDetailEntry] = useState(null);
  const pendingEntryId = searchParams.get("entryId");

  // Filters State
  const [filters, setFilters] = useState({
    searchQuery: "",
    filterType: "all",
    startDate: "",
    endDate: "",
  });

  // Fetch Data
  useEffect(() => {
    setLoading(true);
    fetchJournalEntries()
      .then(setEntries)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Handle URL Entry ID
  useEffect(() => {
    if (!pendingEntryId || !entries.length) return;
    const match = entries.find((entry) => String(entry.id) === String(pendingEntryId));
    if (match) {
      setDetailEntry(match);
    } else if (!loading) {
      const next = new URLSearchParams(searchParams);
      next.delete("entryId");
      setSearchParams(next, { replace: true });
    }
  }, [pendingEntryId, entries, loading, searchParams, setSearchParams]);

  // Filter Logic
  const filteredEntries = useMemo(() => {
    return entries
      .filter((entry) => {
        if (filters.filterType !== "all" && entry.type !== filters.filterType) return false;

        if (filters.searchQuery) {
          const query = filters.searchQuery.toLowerCase();
          const title = (entry.metadata?.title || "").toLowerCase();
          const content = (entry.content || "").toLowerCase();
          const symbol = (entry.metadata?.symbol || "").toLowerCase();
          if (!title.includes(query) && !content.includes(query) && !symbol.includes(query)) {
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
      .sort((a, b) => new Date(b.metadata?.date || b.createdAt) - new Date(a.metadata?.date || a.createdAt));
  }, [entries, filters]);

  // Handlers
  const handleOpenModal = (entry) => {
    if (!entry) return;
    const next = new URLSearchParams(searchParams);
    next.set("entryId", String(entry.id));
    setSearchParams(next, { replace: true });
    setDetailEntry(entry);
  };

  const handleCloseModal = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("entryId");
    setSearchParams(next, { replace: true });
    setDetailEntry(null);
  };

  const handleUpdateInList = (updatedEntry) => {
    setEntries((prev) => prev.map((e) => (e.id === updatedEntry.id ? updatedEntry : e)));
    setDetailEntry(updatedEntry);
  };

  const handleDeleteFromList = (deletedId) => {
    setEntries((prev) => prev.filter((e) => e.id !== deletedId));
  };

  return (
    <Box sx={{ minHeight: "100%", bgcolor: "background.default" }}>

      {/* HERO HEADER */}
      <Box
        sx={{
          py: { xs: 4, md: 5 },
          px: { xs: 2, md: 4 },
          background: theme.forge?.gradients?.hero || "linear-gradient(180deg, #1E1E24 0%, #0A0A0F 100%)",
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Container maxWidth="xl">
          <Stack direction="row" alignItems="center" spacing={2} mb={1}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
              <BookIcon />
            </Avatar>
            <Typography
              variant="h3"
              fontWeight={800}
              sx={{
                background: "linear-gradient(90deg, #fff, #ccc)",
                backgroundClip: "text",
                textFillColor: "transparent",
              }}
            >
              Journal de Trading
            </Typography>
          </Stack>
          <Typography variant="h6" color="text.secondary" fontWeight={400} sx={{ maxWidth: 600, ml: 7 }}>
            Historique complet de vos trades, analyses et sessions.
          </Typography>
        </Container>
      </Box>

      {/* MAIN CONTENT */}
      <Container maxWidth="xl" sx={{ py: 4 }}>

        {/* FILTER BAR */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 4,
            borderRadius: 3,
            border: `1px solid ${theme.palette.divider}`,
            bgcolor: alpha(theme.palette.background.paper, 0.6),
            backdropFilter: "blur(12px)",
            display: 'flex',
            flexWrap: 'wrap',
            gap: 2,
            alignItems: 'center'
          }}
        >
          <TextField
            placeholder="Rechercher..."
            size="small"
            value={filters.searchQuery}
            onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment>,
            }}
            sx={{ flex: 1, minWidth: 200 }}
          />

          <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }} />

          <Select
            size="small"
            value={filters.filterType}
            onChange={(e) => setFilters({ ...filters, filterType: e.target.value })}
            displayEmpty
            startAdornment={<InputAdornment position="start"><FilterListIcon fontSize="small" /></InputAdornment>}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="all">Tout voir</MenuItem>
            <MenuItem value="trade">Trades</MenuItem>
            <MenuItem value="session">Sessions</MenuItem>
            <MenuItem value="note">Notes</MenuItem>
          </Select>

          <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }} />

          <Stack direction="row" spacing={1} alignItems="center">
            <CalendarMonthIcon color="action" fontSize="small" />
            <TextField
              type="date"
              size="small"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              sx={{ width: 140 }}
            />
            <Typography variant="body2" color="text.secondary">à</Typography>
            <TextField
              type="date"
              size="small"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              sx={{ width: 140 }}
            />
          </Stack>

          <Button
            variant="text"
            color="inherit"
            onClick={() => setFilters({ searchQuery: "", filterType: "all", startDate: "", endDate: "" })}
            sx={{ ml: 'auto' }}
          >
            Réinitialiser
          </Button>
        </Paper>

        {/* ENTRIES LIST */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : filteredEntries.length > 0 ? (
          <Stack spacing={2}>
            {filteredEntries.map((entry) => (
              <Fade in={true} key={entry.id}>
                <Box>
                  <JournalListItem entry={entry} onClick={() => handleOpenModal(entry)} />
                </Box>
              </Fade>
            ))}
          </Stack>
        ) : (
          <Paper variant="outlined" sx={{ p: 6, textAlign: "center", borderStyle: 'dashed' }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Aucune entrée trouvée
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Essayez de modifier vos filtres de recherche.
            </Typography>
          </Paper>
        )}

      </Container>

      {/* DETAIL MODAL */}
      <JournalEntryModal
        entry={detailEntry}
        open={Boolean(detailEntry)}
        onClose={handleCloseModal}
        onUpdate={handleUpdateInList}
        onDelete={handleDeleteFromList}
      />
    </Box>
  );
};

export default Journal;
