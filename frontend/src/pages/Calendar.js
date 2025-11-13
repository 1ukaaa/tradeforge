// frontend/src/pages/Calendar.js
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction"; // requis pour dateClick
import listPlugin from "@fullcalendar/list"; // <-- NOUVEAU : Ajout du plugin de liste
import FullCalendar from "@fullcalendar/react";
// 1. Importation du pack de langue
import frLocale from "@fullcalendar/core/locales/fr";

// Imports MUI
import {
  Alert,
  alpha,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  FormGroup,
  Grid,
  IconButton,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";

// Imports des composants
import { ForgeCard } from "../components/ForgeUI"; // On garde ForgeCard pour le conteneur
import JournalEntryModal from "../components/JournalEntryModal";
import useCalendarEvents from "../hooks/useCalendarEvents";
import useCalendarFilters from "../hooks/useCalendarFilters";
import useCalendarInteractions from "../hooks/useCalendarInteractions";
import { formatDate } from "../utils/journalUtils";
import { mapTradesToEvents } from "../utils/calendarEvents";

// Imports pour les filtres et la modale
import AssessmentIcon from "@mui/icons-material/Assessment";
import BeachAccessIcon from "@mui/icons-material/BeachAccess"; // Ajouté pour le filtre "Férié"
import BusinessCenterIcon from "@mui/icons-material/BusinessCenter";
import CloseIcon from "@mui/icons-material/Close"; // Pour la modale
import DoNotDisturbAltIcon from "@mui/icons-material/DoNotDisturbAlt";
import EventBusyIcon from "@mui/icons-material/EventBusy";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import { JournalImageCard } from "../components/JournalImageCard";

// --- Panneau de contrôle des filtres (Mis à jour) ---
const CalendarFilterControl = ({
  typeFilter,
  onTypeChange,
  impactFilter,
  onImpactChange,
}) => {
  return (
    <ForgeCard subtitle="Filtres d'affichage">
      <Grid container spacing={3} rowSpacing={2}>
        <Grid item xs={12} md={4}>
          <Typography variant="subtitle2" gutterBottom>
            Journal
          </Typography>
          <FormGroup>
            <FormControlLabel
              control={
                <Checkbox
                  checked={typeFilter.trade}
                  onChange={onTypeChange}
                  name="trade"
                  icon={<BusinessCenterIcon />}
                  checkedIcon={<BusinessCenterIcon color="primary" />}
                />
              }
              label="Trades Exécutés"
            />
          </FormGroup>
        </Grid>
        <Grid item xs={12} md={8}>
          <Typography variant="subtitle2" gutterBottom>
            Annonces Économiques
          </Typography>
          <FormGroup row sx={{ flexWrap: "wrap", gap: 0.5 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={typeFilter.economic}
                  onChange={onTypeChange}
                  name="economic"
                  icon={<AssessmentIcon />}
                  checkedIcon={<AssessmentIcon color="primary" />}
                />
              }
              label="Afficher"
              sx={{ mr: 2 }}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={impactFilter.high}
                  onChange={onImpactChange}
                  name="high"
                  disabled={!typeFilter.economic}
                  icon={<LocalFireDepartmentIcon color="error" />}
                  checkedIcon={<LocalFireDepartmentIcon color="error" />}
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
                  disabled={!typeFilter.economic}
                  icon={<NotificationsActiveIcon color="warning" />}
                  checkedIcon={<NotificationsActiveIcon color="warning" />}
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
                  disabled={!typeFilter.economic}
                  icon={<DoNotDisturbAltIcon />}
                  checkedIcon={<DoNotDisturbAltIcon />}
                />
              }
              label="Faible"
            />
            {/* --- NOUVEAU : Checkbox "Férié" ajoutée --- */}
            <FormControlLabel
              control={
                <Checkbox
                  checked={impactFilter.holiday}
                  onChange={onImpactChange}
                  name="holiday"
                  disabled={!typeFilter.economic}
                  icon={<BeachAccessIcon color="info" />}
                  checkedIcon={<BeachAccessIcon color="info" />}
                />
              }
              label="Férié"
            />
          </FormGroup>
        </Grid>
      </Grid>
    </ForgeCard>
  );
};

// --- NOUVEAU : Modale pour le Focus Journalier ---
const FocusDayModal = ({
  open,
  onClose,
  date,
  trades,
  economics,
  onTradeClick,
}) => {
  if (!date) return null;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ pr: 8 }}>
        <Typography variant="overline" color="text.secondary">
          Focus Journalier
        </Typography>
        <Typography variant="h5" fontWeight={600} component="div">
          {formatDate(date, {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </Typography>
        <IconButton
          onClick={onClose}
          sx={{ position: "absolute", right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3}>
          {/* Annonces du jour */}
          <Stack spacing={1.5}>
            <Typography variant="subtitle2">Annonces Éco</Typography>
            {economics.length > 0 ? (
              <Stack direction="row" flexWrap="wrap" gap={1}>
                {economics.map((event) => (
                  <Chip
                    key={event.id}
                    label={event.title}
                    size="small"
                    sx={{
                      bgcolor: alpha(event.color, 0.15),
                      color: event.color,
                      borderColor: event.color,
                      fontWeight: 500,
                    }}
                    variant="outlined"
                  />
                ))}
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Aucune annonce majeure ce jour.
              </Typography>
            )}
          </Stack>

          <Divider />

          {/* Trades du jour */}
          <Stack spacing={2}>
            <Typography variant="subtitle2">Trades Exécutés</Typography>
            {trades.length > 0 ? (
              trades.map((trade) => (
                <JournalImageCard
                  key={trade.id}
                  entry={trade}
                  onClick={() => onTradeClick(trade)}
                />
              ))
            ) : (
              <Stack alignItems="center" py={3} spacing={1}>
                <EventBusyIcon
                  sx={{ fontSize: 40, color: "text.secondary" }}
                />
                <Typography variant="body2" color="text.secondary">
                  Aucun trade enregistré.
                </Typography>
              </Stack>
            )}
          </Stack>
        </Stack>
      </DialogContent>
      <Button onClick={onClose} sx={{ m: 1 }}>
        Fermer
      </Button>
    </Dialog>
  );
};

// --- Composant Principal (Refonte V2) ---
const Calendar = () => {
  const theme = useTheme();
  const {
    events: allEvents,
    setEvents,
    loading,
    error,
  } = useCalendarEvents(theme);
  const {
    typeFilter,
    impactFilter,
    handleTypeChange,
    handleImpactChange,
    filteredEvents,
  } = useCalendarFilters(allEvents);
  const {
    focusInfo,
    selectedEntry,
    handleEventClick,
    handleDateClick,
    handleFocusClose,
    handleModalClose,
    openTradeFromFocus,
    setSelectedEntry,
  } = useCalendarInteractions(allEvents);

  return (
    <Stack spacing={3}>
      {/* --- REVENIR AU HEADER SIMPLE --- */}
      <Box sx={{ pt: 2 }}>
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

      {/* --- SUPPRESSION DE LA GRILLE 8/4 --- */}
      <Stack spacing={3}>
        <CalendarFilterControl
          typeFilter={typeFilter}
          onTypeChange={handleTypeChange}
          impactFilter={impactFilter}
          onImpactChange={handleImpactChange}
        />

        {loading && <CircularProgress sx={{ alignSelf: "center" }} />}
        {error && <Alert severity="error">{error}</Alert>}

        {!loading && !error && (
          <ForgeCard
            sx={{
              p: { xs: 1, sm: 2 },
              // Styles du calendrier
              "--fc-border-color": theme.palette.divider,
              "--fc-daygrid-day-bg": alpha(theme.palette.divider, 0.02),
              "--fc-today-bg-color": alpha(
                theme.palette.secondary.main,
                0.15
              ),
              "--fc-daygrid-day-number-color": theme.palette.text.secondary,
              "--fc-col-header-cell-cushion-color":
                theme.palette.text.primary,
              "--fc-col-header-cell-cushion-font-weight": 600,
              "--fc-theme-standard .fc-popover-header": {
                backgroundColor: theme.palette.background.default,
              },
              "--fc-theme-standard .fc-popover-body": {
                backgroundColor: theme.palette.background.paper,
              },
              // Boutons
              "--fc-button-bg-color": theme.palette.background.default,
              "--fc-button-border-color": theme.palette.divider,
              "--fc-button-color": theme.palette.text.primary,
              "--fc-button-hover-bg-color": theme.palette.action.hover,
              "--fc-button-active-bg-color": alpha(
                theme.palette.primary.main,
                0.1
              ),
              "--fc-button-active-color": theme.palette.primary.main,
              "--fc-button-active-border-color": theme.palette.divider,
              // Evénements
              ".fc-event": {
                borderWidth: "1px",
                borderStyle: "solid",
                fontSize: "0.8rem",
                fontWeight: 600,
              },
              // Styles de la VUE LISTE
              ".fc-list-event-graphic": {
                display: "none", // Cache la puce de couleur
              },
              ".fc-list-event-title": {
                 // S'assure que le style custom (couleur, etc.) est appliqué
                color: 'var(--fc-event-text-color)',
                backgroundColor: 'var(--fc-event-bg-color)',
                borderColor: 'var(--fc-event-border-color)',
                borderWidth: '1px',
                borderStyle: 'solid',
                padding: '4px 8px',
                borderRadius: theme.shape.borderRadius,
                fontWeight: 600,
              },
              ".fc-list-day-text": {
                fontWeight: 700,
                color: theme.palette.text.primary,
              },
              ".fc-list-day-side-text": {
                fontWeight: 500,
                color: theme.palette.text.secondary,
              },
            }}
          >
            <FullCalendar
              locale={frLocale}
              plugins={[dayGridPlugin, interactionPlugin, listPlugin]} // Ajout de listPlugin
              initialView="listWeek" // <-- NOUVELLE VUE
              events={filteredEvents}
              eventClick={handleEventClick} // Ouvre modale de trade
              dateClick={handleDateClick} // Ouvre modale focus
              height="auto"
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,listWeek", // Remplacement de dayGridWeek
              }}
              buttonText={{
                today: "Aujourd'hui",
                month: "Mois",
                week: "Semaine",
                day: "Jour",
                list: "Liste",
              }}
              noEventsText="Aucun événement à afficher"
            />
          </ForgeCard>
        )}
      </Stack>

      {/* --- NOUVEAU : Ajout de la modale "Focus" --- */}
      <FocusDayModal
        open={focusInfo.open}
        onClose={handleFocusClose}
        date={focusInfo.date}
        trades={focusInfo.trades}
        economics={focusInfo.economics}
        onTradeClick={openTradeFromFocus}
      />

      {/* Modale pour voir un trade (inchangée) */}
      <JournalEntryModal
        entry={selectedEntry}
        open={Boolean(selectedEntry)}
        onClose={handleModalClose}
        onUpdate={(updatedEntry) => {
          setEvents((prev) =>
            prev.map((event) => {
              if (event.id !== updatedEntry.id) {
                return event;
              }
              const mapped = mapTradesToEvents([updatedEntry], theme)[0];
              return mapped || event;
            })
          );
          setSelectedEntry(updatedEntry);
        }}
        onDelete={(deletedId) => {
          setEvents((prev) => prev.filter((event) => event.id !== deletedId));
          handleModalClose();
        }}
      />
    </Stack>
  );
};

export default Calendar;
