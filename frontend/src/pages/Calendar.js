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
  Paper,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";

// Imports des composants
import { ForgeCard } from "../components/ForgeUI"; // On garde ForgeCard pour le conteneur
import useCalendarEvents from "../hooks/useCalendarEvents";
import useCalendarFilters from "../hooks/useCalendarFilters";
import useCalendarInteractions from "../hooks/useCalendarInteractions";
import { formatDate } from "../utils/journalUtils";
import { formatCurrencyValue as formatCurrencyDashboard } from "../utils/dashboardUtils";
import { Link as RouterLink } from "react-router-dom";

// Imports pour les filtres et la modale
import AssessmentIcon from "@mui/icons-material/Assessment";
import BeachAccessIcon from "@mui/icons-material/BeachAccess"; // Ajouté pour le filtre "Férié"
import BusinessCenterIcon from "@mui/icons-material/BusinessCenter";
import CloseIcon from "@mui/icons-material/Close"; // Pour la modale
import DoNotDisturbAltIcon from "@mui/icons-material/DoNotDisturbAlt";
import EventBusyIcon from "@mui/icons-material/EventBusy";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import LaunchRoundedIcon from "@mui/icons-material/LaunchRounded";
import QueryStatsRoundedIcon from "@mui/icons-material/QueryStatsRounded";

const formatDateTime = (value, withTime = true) => {
  if (!value) return "Date inconnue";
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      ...(withTime
        ? {
            hour: "2-digit",
            minute: "2-digit",
          }
        : {}),
    }).format(new Date(value));
  } catch {
    return value;
  }
};

const formatSignedAmount = (value, currency) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return "N/A";
  const formatted = formatCurrencyDashboard(Math.abs(num), currency || "EUR");
  return num >= 0 ? `+${formatted}` : `-${formatted}`;
};

const formatPrice = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return "—";
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 5,
  }).format(num);
};

const TradeSummaryCard = ({ trade, onClick }) => {
  const isProfit = Number(trade.pnl) >= 0;
  const tone = isProfit ? "success.main" : "error.main";
  return (
    <Paper
      variant="outlined"
      onClick={onClick}
      sx={{
        p: 2,
        borderRadius: 2,
        cursor: "pointer",
        transition: "border-color 0.2s, box-shadow 0.2s",
        "&:hover": {
          borderColor: tone,
          boxShadow: (theme) =>
            theme.palette.mode === "dark"
              ? "0 8px 20px rgba(0,0,0,0.35)"
              : "0 8px 20px rgba(15,23,42,0.12)",
        },
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="subtitle2" fontWeight={700}>
            {trade.symbol || "Instrument"}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {trade.accountName || "Compte inconnu"}
          </Typography>
        </Box>
        <Chip
          label={trade.direction === "short" || trade.direction === "SELL" ? "Vente" : "Achat"}
          size="small"
          color={isProfit ? "success" : "warning"}
        />
      </Stack>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mt={1.5}>
        <Typography variant="body2" color="text.secondary">
          {formatDateTime(trade.closedAt || trade.openedAt)}
        </Typography>
        <Typography variant="subtitle1" fontWeight={700} color={tone}>
          {formatSignedAmount(trade.pnl, trade.currency)}
        </Typography>
      </Stack>
    </Paper>
  );
};

const TradeDetailModal = ({ open, trade, onClose }) => {
  if (!trade) return null;
  const isProfit = Number(trade.pnl) >= 0;
  const directionLabel = trade.direction === "short" || trade.direction === "SELL" ? "Vente" : "Achat";
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        <Stack spacing={0.5}>
          <Typography variant="overline" color="text.secondary">
            Trade importé
          </Typography>
          <Typography variant="h5" fontWeight={700}>
            {trade.symbol || "Instrument"} • {directionLabel}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {trade.accountName || "Compte inconnu"}
          </Typography>
        </Stack>
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">
              Date d'ouverture
            </Typography>
            <Typography variant="body1">{formatDateTime(trade.openedAt)}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">
              Date de clôture
            </Typography>
            <Typography variant="body1">{formatDateTime(trade.closedAt)}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">
              Volume
            </Typography>
            <Typography variant="body1">
              {trade.volume ? `${trade.volume} lot(s)` : "—"}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">
              PnL
            </Typography>
            <Typography
              variant="body1"
              fontWeight={700}
              color={isProfit ? "success.main" : "error.main"}
            >
              {formatSignedAmount(trade.pnl, trade.currency)}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">
              Prix d'entrée
            </Typography>
            <Typography variant="body1">{formatPrice(trade.entryPrice)}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">
              Prix de sortie
            </Typography>
            <Typography variant="body1">{formatPrice(trade.exitPrice)}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">
              Identifiant externe
            </Typography>
            <Typography variant="body1">{trade.externalTradeId || "—"}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">
              Statut
            </Typography>
            <Typography variant="body1" textTransform="capitalize">
              {trade.status || "Clôturé"}
            </Typography>
          </Grid>
        </Grid>
      </DialogContent>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ px: 3, py: 2 }}
      >
        {trade.journalEntryId ? (
          <Button
            component={RouterLink}
            to={`/journal?entryId=${trade.journalEntryId}`}
            startIcon={<LaunchRoundedIcon />}
            onClick={onClose}
          >
            Voir dans le journal
          </Button>
        ) : (
          <Stack direction="row" spacing={1} alignItems="center" color="text.secondary">
            <QueryStatsRoundedIcon fontSize="small" />
            <Typography variant="body2">
              Non lié à une entrée de journal
            </Typography>
          </Stack>
        )}
        <Button onClick={onClose}>Fermer</Button>
      </Stack>
    </Dialog>
  );
};

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
            Trades importés
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
              label="Trades importés"
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
            <Typography variant="subtitle2">Trades importés</Typography>
            {trades.length > 0 ? (
              trades.map((trade) => (
                <TradeSummaryCard
                  key={trade.id || trade.externalTradeId}
                  trade={trade}
                  onClick={() => onTradeClick(trade)}
                />
              ))
            ) : (
              <Stack alignItems="center" py={3} spacing={1}>
                <EventBusyIcon
                  sx={{ fontSize: 40, color: "text.secondary" }}
                />
                <Typography variant="body2" color="text.secondary">
                  Aucun trade importé ce jour.
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
  const { events: allEvents, loading, error } = useCalendarEvents(theme);
  const {
    typeFilter,
    impactFilter,
    handleTypeChange,
    handleImpactChange,
    filteredEvents,
  } = useCalendarFilters(allEvents);
  const {
    focusInfo,
    selectedTrade,
    handleEventClick,
    handleDateClick,
    handleFocusClose,
    handleModalClose,
    openTradeFromFocus,
    setSelectedTrade,
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
          Corrèlez vos trades importés avec les annonces économiques.
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

      <TradeDetailModal
        open={Boolean(selectedTrade)}
        trade={selectedTrade}
        onClose={handleModalClose}
      />
    </Stack>
  );
};

export default Calendar;
