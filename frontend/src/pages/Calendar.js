// frontend/src/pages/Calendar.js
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import FullCalendar from "@fullcalendar/react";
import {
  Alert,
  alpha,
  Box,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  FormGroup,
  Grid,
  Paper,
  Stack,
  Typography
} from "@mui/material";
// 1. Importation du pack de langue
import frLocale from "@fullcalendar/core/locales/fr";

import { useEffect, useMemo, useState } from "react";
import JournalEntryModal from "../components/JournalEntryModal";
import { fetchEconomicEvents } from "../services/economicClient";
import { fetchJournalEntries } from "../services/journalClient";
import { resultTone } from "../utils/journalUtils";

// Icônes pour les filtres (la "nouveauté" visuelle)
import AssessmentIcon from "@mui/icons-material/Assessment";
import BeachAccessIcon from "@mui/icons-material/BeachAccess";
import BusinessCenterIcon from "@mui/icons-material/BusinessCenter";
import DoNotDisturbAltIcon from "@mui/icons-material/DoNotDisturbAlt";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";


// MODIFIÉ : Ajout de extendedProps pour le filtrage
const mapTradesToEvents = (entries) => {
  return entries
    .filter((entry) => entry.type === "trade")
    .map((entry) => {
      const meta = entry.metadata || {};
      const title = `${meta.symbol || "Trade"} (${meta.result || "N/A"})`;
      const tone = resultTone(meta.result);

      return {
        id: entry.id,
        title: title,
        date: meta.date || entry.createdAt,
        allDay: true,
        color:
          tone === "success"
            ? "#2e7d32"
            : tone === "error"
            ? "#d32f2f"
            : "#0288d1",
        extendedProps: {
          type: 'trade',
          impact: 'none', // Les trades n'ont pas d'impact éco
        },
      };
    });
};

// --- NOUVEAU : Panneau de contrôle pour les filtres ---
const CalendarFilterControl = ({ typeFilter, onTypeChange, impactFilter, onImpactChange }) => {
  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
      <Grid container spacing={4}>
        <Grid item xs={12} md={4}>
          <Typography variant="overline" color="text.secondary">
            Types d'Événements
          </Typography>
          <FormGroup>
            <FormControlLabel
              control={
                <Checkbox
                  checked={typeFilter.trade}
                  onChange={onTypeChange}
                  name="trade"
                  icon={<BusinessCenterIcon />}
                  checkedIcon={<BusinessCenterIcon />}
                />
              }
              label="Trades Exécutés"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={typeFilter.economic}
                  onChange={onTypeChange}
                  name="economic"
                  icon={<AssessmentIcon />}
                  checkedIcon={<AssessmentIcon />}
                />
              }
              label="Annonces Économiques"
            />
          </FormGroup>
        </Grid>
        <Grid item xs={12} md={8}>
          <Typography variant="overline" color="text.secondary">
            Impact Économique
          </Typography>
          <FormGroup row>
            <FormControlLabel
              control={
                <Checkbox
                  checked={impactFilter.high}
                  onChange={onImpactChange}
                  name="high"
                  color="error"
                  icon={<LocalFireDepartmentIcon />}
                  checkedIcon={<LocalFireDepartmentIcon />}
                />
              }
              label="Fort"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={impactFilter.medium}
                  onChange={onImpactChange}
                  name="medium"
                  color="warning"
                  icon={<NotificationsActiveIcon />}
                  checkedIcon={<NotificationsActiveIcon />}
                />
              }
              label="Moyen"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={impactFilter.low}
                  onChange={onImpactChange}
                  name="low"
                  color="default"
                  icon={<DoNotDisturbAltIcon />}
                  checkedIcon={<DoNotDisturbAltIcon />}
                />
              }
              label="Faible"
            />
             <FormControlLabel
              control={
                <Checkbox
                  checked={impactFilter.holiday}
                  onChange={onImpactChange}
                  name="holiday"
                  color="primary"
                  icon={<BeachAccessIcon />}
                  checkedIcon={<BeachAccessIcon />}
                />
              }
              label="Férié"
            />
          </FormGroup>
        </Grid>
      </Grid>
    </Paper>
  );
};


const Calendar = () => {
  const [allEvents, setAllEvents] = useState([]); // Contient TOUS les événements
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedEntry, setSelectedEntry] = useState(null);

  // --- NOUVEAU : États pour les filtres ---
  const [typeFilter, setTypeFilter] = useState({
    trade: true,
    economic: true,
  });
  const [impactFilter, setImpactFilter] = useState({
    high: true,
    medium: true,
    low: false, // Faible impact masqué par défaut
    holiday: false, // Fériés masqués par défaut
  });

  // --- NOUVEAU : Handlers pour les filtres ---
  const handleTypeChange = (event) => {
    setTypeFilter({
      ...typeFilter,
      [event.target.name]: event.target.checked,
    });
  };

  const handleImpactChange = (event) => {
    setImpactFilter({
      ...impactFilter,
      [event.target.name]: event.target.checked,
    });
  };

  // Récupération des données (inchangée)
  useEffect(() => {
    setLoading(true);
    Promise.all([fetchJournalEntries(), fetchEconomicEvents()])
      .then(([journalEntries, economicEvents]) => {
        const tradeEvents = mapTradesToEvents(journalEntries);
        setAllEvents([...tradeEvents, ...economicEvents]);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // --- NOUVEAU : Logique de filtrage ---
  // useMemo évite de re-filtrer à chaque re-rendu, c'est crucial pour la performance.
  const filteredEvents = useMemo(() => {
    return allEvents.filter((event) => {
      const props = event.extendedProps || {};
      
      if (props.type === 'trade') {
        return typeFilter.trade;
      }
      
      if (props.type === 'economic') {
        if (!typeFilter.economic) return false;
        // props.impact peut être 'high', 'medium', 'low', 'holiday'
        // On renvoie 'true' si le filtre correspondant est coché
        return impactFilter[props.impact] === true; 
      }
      
      return false; // Événement inconnu, on le cache
    });
  }, [allEvents, typeFilter, impactFilter]);


  const handleEventClick = (clickInfo) => {
    if (clickInfo.event.extendedProps.journalEntry) {
      setSelectedEntry(clickInfo.event.extendedProps.journalEntry);
    }
  };

  const handleModalClose = () => {
    setSelectedEntry(null);
  };
  
  return (
    <Stack spacing={3} sx={{ p: { xs: 2, md: 4, lg: 6 } }}>
      <Box>
        <Typography variant="overline" color="text.secondary">
          Analyse
        </Typography>
        <Typography variant="h2" component="h1" fontWeight={700}>
          Calendrier de Trading
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 640 }}>
          Corrèlez vos trades exécutés avec les annonces économiques.
        </Typography>
      </Box>

      {/* --- NOUVEAU : Ajout du Panneau de Contrôle --- */}
      <CalendarFilterControl 
        typeFilter={typeFilter}
        onTypeChange={handleTypeChange}
        impactFilter={impactFilter}
        onImpactChange={handleImpactChange}
      />

      {loading && <CircularProgress sx={{ alignSelf: "center" }} />}
      {error && <Alert severity="error">{error}</Alert>}

      {!loading && !error && (
        <Paper
          variant="outlined"
          sx={{
            p: { xs: 1, sm: 3 },
            bgcolor: "background.paper",
            // Style pour FullCalendar
            "--fc-border-color": (theme) => theme.palette.divider,
            "--fc-today-bg-color": (theme) =>
              alpha(theme.palette.primary.main, 0.05),
            "--fc-button-bg-color": (theme) => theme.palette.primary.main,
            "--fc-button-border-color": (theme) => theme.palette.primary.main,
            "--fc-button-hover-bg-color": (theme) =>
              theme.palette.primary.dark,
            "--fc-button-hover-border-color": (theme) =>
              theme.palette.primary.dark,
            "--fc-button-active-bg-color": (theme) =>
              theme.palette.primary.dark,
            "--fc-button-active-border-color": (theme) =>
              theme.palette.primary.dark,
            ".fc-daygrid-day-number": {
              color: "text.secondary",
              fontWeight: 500,
            },
            ".fc-col-header-cell-cushion": {
              color: "text.primary",
              fontWeight: 600,
              textDecoration: "none",
            },
            ".fc-event-title": {
              fontWeight: 600,
              fontSize: "0.8rem"
            }
          }}
        >
          <FullCalendar
            // --- NOUVEAU : Props mises à jour ---
            locale={frLocale} // 2. Passage en Français
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            events={filteredEvents} // 3. Utilisation des événements filtrés
            eventClick={handleEventClick}
            height="auto"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,dayGridWeek",
            }}
          />
        </Paper>
      )}

      {/* Modale (inchangée) */}
      <JournalEntryModal
        entry={selectedEntry}
        open={Boolean(selectedEntry)}
        onClose={handleModalClose}
        onUpdate={() => {}}
        onDelete={() => {}}
      />
    </Stack>
  );
};

export default Calendar;