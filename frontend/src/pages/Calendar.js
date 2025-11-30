// frontend/src/pages/Calendar.js
import frLocale from "@fullcalendar/core/locales/fr";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import FullCalendar from "@fullcalendar/react";

// Imports MUI
import {
  Alert,
  alpha,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Fade,
  FormControlLabel,
  FormGroup,
  Grid,
  IconButton,
  Paper,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";

// Icons
import AssessmentIcon from "@mui/icons-material/Assessment";
import BeachAccessIcon from "@mui/icons-material/BeachAccess";
import BusinessCenterIcon from "@mui/icons-material/BusinessCenter";
import CloseIcon from "@mui/icons-material/Close";
import DoNotDisturbAltIcon from "@mui/icons-material/DoNotDisturbAlt";
import EventBusyIcon from "@mui/icons-material/EventBusy";
import FilterListIcon from "@mui/icons-material/FilterList";
import LaunchRoundedIcon from "@mui/icons-material/LaunchRounded";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import QueryStatsRoundedIcon from "@mui/icons-material/QueryStatsRounded";

// Hooks & Utils
import { Link as RouterLink } from "react-router-dom";
import useCalendarEvents from "../hooks/useCalendarEvents";
import useCalendarFilters from "../hooks/useCalendarFilters";
import useCalendarInteractions from "../hooks/useCalendarInteractions";
import { formatCurrencyValue as formatCurrencyDashboard } from "../utils/dashboardUtils";
import { formatDate } from "../utils/journalUtils";

// --- UTILS ---
const formatDateTime = (value, withTime = true) => {
  if (!value) return "Date inconnue";
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
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

// --- SUB-COMPONENTS ---

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
        transition: "all 0.2s",
        bgcolor: 'background.paper',
        "&:hover": {
          borderColor: tone,
          transform: 'translateY(-2px)',
          boxShadow: (theme) => theme.shadows[4],
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
          sx={{ height: 20, fontSize: 10, fontWeight: 700 }}
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
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ pb: 1 }}>
        <Stack spacing={0.5}>
          <Typography variant="overline" color="primary" fontWeight={700} sx={{ letterSpacing: 1 }}>
            DÉTAIL DU TRADE
          </Typography>
          <Typography variant="h5" fontWeight={800}>
            {trade.symbol || "Instrument"} • {directionLabel}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {trade.accountName || "Compte inconnu"}
          </Typography>
        </Stack>
      </DialogTitle>
      <DialogContent dividers sx={{ borderColor: 'divider' }}>
        <Grid container spacing={3}>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>OUVERTURE</Typography>
            <Typography variant="body1" fontWeight={500}>{formatDateTime(trade.openedAt)}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>CLÔTURE</Typography>
            <Typography variant="body1" fontWeight={500}>{formatDateTime(trade.closedAt)}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>VOLUME</Typography>
            <Typography variant="body1" fontWeight={500}>{trade.volume ? `${trade.volume} lot(s)` : "—"}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>PNL RÉALISÉ</Typography>
            <Typography variant="body1" fontWeight={800} color={isProfit ? "success.main" : "error.main"}>
              {formatSignedAmount(trade.pnl, trade.currency)}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>PRIX ENTRÉE</Typography>
            <Typography variant="body1" fontWeight={500}>{formatPrice(trade.entryPrice)}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>PRIX SORTIE</Typography>
            <Typography variant="body1" fontWeight={500}>{formatPrice(trade.exitPrice)}</Typography>
          </Grid>
        </Grid>
      </DialogContent>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 3, py: 2.5, bgcolor: 'background.default' }}>
        {trade.journalEntryId ? (
          <Button component={RouterLink} to={`/journal?entryId=${trade.journalEntryId}`} startIcon={<LaunchRoundedIcon />} onClick={onClose} variant="outlined" size="small">
            Voir dans le journal
          </Button>
        ) : (
          <Stack direction="row" spacing={1} alignItems="center" color="text.secondary">
            <QueryStatsRoundedIcon fontSize="small" />
            <Typography variant="caption">Non lié au journal</Typography>
          </Stack>
        )}
        <Button onClick={onClose} variant="contained" sx={{ px: 3 }}>Fermer</Button>
      </Stack>
    </Dialog>
  );
};

const FocusDayModal = ({ open, onClose, date, trades, economics, onTradeClick }) => {
  if (!date) return null;
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="overline" color="primary" fontWeight={700} sx={{ letterSpacing: 1 }}>
              FOCUS JOURNALIER
            </Typography>
            <Typography variant="h5" fontWeight={800}>
              {formatDate(date, { weekday: "long", day: "numeric", month: "long" })}
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
        </Stack>
      </DialogTitle>
      <DialogContent dividers sx={{ borderColor: 'divider' }}>
        <Stack spacing={4}>
          {/* Annonces */}
          <Box>
            <Typography variant="subtitle2" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AssessmentIcon fontSize="small" color="action" /> ANNONCES ÉCO
            </Typography>
            {economics.length > 0 ? (
              <Stack direction="row" flexWrap="wrap" gap={1}>
                {economics.map((event) => (
                  <Chip
                    key={event.id}
                    label={event.title}
                    size="small"
                    sx={{
                      bgcolor: alpha(event.color, 0.1),
                      color: event.color,
                      borderColor: alpha(event.color, 0.3),
                      fontWeight: 600,
                    }}
                    variant="outlined"
                  />
                ))}
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>R.A.S.</Typography>
            )}
          </Box>

          {/* Trades */}
          <Box>
            <Typography variant="subtitle2" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <BusinessCenterIcon fontSize="small" color="action" /> TRADES
            </Typography>
            {trades.length > 0 ? (
              <Stack spacing={1.5}>
                {trades.map((trade) => (
                  <TradeSummaryCard key={trade.id || trade.externalTradeId} trade={trade} onClick={() => onTradeClick(trade)} />
                ))}
              </Stack>
            ) : (
              <Paper variant="outlined" sx={{ py: 4, textAlign: 'center', borderStyle: 'dashed' }}>
                <EventBusyIcon sx={{ fontSize: 40, color: "text.secondary", opacity: 0.5, mb: 1 }} />
                <Typography variant="body2" color="text.secondary">Aucun trade ce jour.</Typography>
              </Paper>
            )}
          </Box>
        </Stack>
      </DialogContent>
    </Dialog>
  );
};

// --- MAIN COMPONENT ---

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
  } = useCalendarInteractions(allEvents);

  return (
    <Box sx={{ minHeight: "100%", bgcolor: "background.default" }}>
      {/* HERO HEADER */}
      <Box
        sx={{
          pt: { xs: 4, md: 6 },
          pb: { xs: 8, md: 10 },
          px: { xs: 2, md: 4 },
          background: theme.forge?.gradients?.hero || "linear-gradient(180deg, #1E1E24 0%, #0A0A0F 100%)",
          borderBottom: `1px solid ${theme.palette.divider}`,
          position: 'relative',
          zIndex: 1
        }}
      >
        <Container maxWidth="xl">
          <Typography
            variant="h3"
            fontWeight={800}
            gutterBottom
            sx={{
              background: theme.palette.mode === 'dark'
                ? "linear-gradient(90deg, #fff, #ccc)"
                : "linear-gradient(90deg, #0F1729, #4A4A52)",
              backgroundClip: "text",
              textFillColor: "transparent",
            }}
          >
            Calendrier
          </Typography>
          <Typography variant="h6" color="text.secondary" fontWeight={400} sx={{ maxWidth: 600 }}>
            Visualisez vos performances de trading en corrélation avec les événements économiques majeurs.
          </Typography>
        </Container>
      </Box>

      {/* CONTENT */}
      <Container maxWidth="xl" sx={{ mt: -6, pb: 8, position: 'relative', zIndex: 2 }}>

        {/* HORIZONTAL FILTERS */}
        <Paper
          elevation={0}
          sx={{
            mb: 4,
            p: 2,
            borderRadius: 3,
            border: `1px solid ${theme.palette.divider}`,
            bgcolor: alpha(theme.palette.background.paper, 0.6),
            backdropFilter: "blur(12px)",
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 3
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FilterListIcon color="action" />
            <Typography variant="subtitle2" fontWeight={700}>FILTRES</Typography>
          </Box>

          <Divider orientation="vertical" flexItem sx={{ height: 24, alignSelf: 'center' }} />

          <FormGroup row sx={{ gap: 2 }}>
            <FormControlLabel
              control={<Checkbox size="small" checked={typeFilter.trade} onChange={handleTypeChange} name="trade" icon={<BusinessCenterIcon fontSize="small" />} checkedIcon={<BusinessCenterIcon fontSize="small" color="primary" />} />}
              label={<Typography variant="body2" fontWeight={500}>Trades</Typography>}
            />
            <FormControlLabel
              control={<Checkbox size="small" checked={typeFilter.economic} onChange={handleTypeChange} name="economic" icon={<AssessmentIcon fontSize="small" />} checkedIcon={<AssessmentIcon fontSize="small" color="primary" />} />}
              label={<Typography variant="body2" fontWeight={500}>Annonces Éco</Typography>}
            />
          </FormGroup>

          <Divider orientation="vertical" flexItem sx={{ height: 24, alignSelf: 'center' }} />

          <FormGroup row sx={{ gap: 1 }}>
            <FormControlLabel
              control={<Checkbox size="small" checked={impactFilter.high} onChange={handleImpactChange} name="high" disabled={!typeFilter.economic} icon={<LocalFireDepartmentIcon fontSize="small" color="error" />} checkedIcon={<LocalFireDepartmentIcon fontSize="small" color="error" />} />}
              label={<Typography variant="caption">Fort</Typography>}
            />
            <FormControlLabel
              control={<Checkbox size="small" checked={impactFilter.medium} onChange={handleImpactChange} name="medium" disabled={!typeFilter.economic} icon={<NotificationsActiveIcon fontSize="small" color="warning" />} checkedIcon={<NotificationsActiveIcon fontSize="small" color="warning" />} />}
              label={<Typography variant="caption">Moyen</Typography>}
            />
            <FormControlLabel
              control={<Checkbox size="small" checked={impactFilter.low} onChange={handleImpactChange} name="low" disabled={!typeFilter.economic} icon={<DoNotDisturbAltIcon fontSize="small" />} checkedIcon={<DoNotDisturbAltIcon fontSize="small" />} />}
              label={<Typography variant="caption">Faible</Typography>}
            />
            <FormControlLabel
              control={<Checkbox size="small" checked={impactFilter.holiday} onChange={handleImpactChange} name="holiday" disabled={!typeFilter.economic} icon={<BeachAccessIcon fontSize="small" color="info" />} checkedIcon={<BeachAccessIcon fontSize="small" color="info" />} />}
              label={<Typography variant="caption">Férié</Typography>}
            />
          </FormGroup>
        </Paper>

        {/* MAIN CALENDAR AREA */}
        <Fade in={true} timeout={600}>
          <Paper
            elevation={0}
            sx={{
              p: 1,
              borderRadius: 3,
              border: `1px solid ${theme.palette.divider}`,
              bgcolor: alpha(theme.palette.background.paper, 0.4),
              backdropFilter: "blur(10px)",
              minHeight: 600,
              // FullCalendar Customization
              "& .fc": { fontFamily: 'inherit' },
              "& .fc-toolbar-title": { fontSize: '1.5rem', fontWeight: 800 },
              "& .fc-button": {
                borderRadius: '8px',
                textTransform: 'capitalize',
                fontWeight: 600,
                boxShadow: 'none !important',
                transition: 'all 0.2s'
              },
              "& .fc-button-primary": {
                bgcolor: 'transparent',
                color: 'text.primary',
                border: `1px solid ${theme.palette.divider}`
              },
              "& .fc-button-primary:hover": { bgcolor: 'action.hover' },
              "& .fc-button-active": {
                bgcolor: alpha(theme.palette.primary.main, 0.1) + ' !important',
                color: 'primary.main !important',
                borderColor: 'primary.main !important'
              },
              "& .fc-col-header-cell": { py: 2, bgcolor: alpha(theme.palette.background.default, 0.5) },
              "& .fc-daygrid-day": { transition: 'bgcolor 0.2s' },
              "& .fc-daygrid-day:hover": { bgcolor: alpha(theme.palette.action.hover, 0.05), cursor: 'pointer' },
              "& .fc-event": {
                borderRadius: '4px',
                border: 'none',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                cursor: 'pointer',
                transition: 'transform 0.1s',
                '&:hover': { transform: 'scale(1.02)' }
              },
              // FIX DARK MODE LIST VIEW
              "& .fc-list-day-cushion": {
                bgcolor: alpha(theme.palette.background.default, 0.5) + " !important",
              },
              "& .fc-list-day-text": {
                color: theme.palette.text.primary,
                fontWeight: 700
              },
              "& .fc-list-day-side-text": {
                color: theme.palette.text.secondary,
              },
              "& .fc-list-event:hover td": {
                bgcolor: alpha(theme.palette.action.hover, 0.1) + " !important",
              }
            }}
          >
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
                <CircularProgress />
              </Box>
            ) : error ? (
              <Alert severity="error">{error}</Alert>
            ) : (
              <FullCalendar
                locale={frLocale}
                plugins={[dayGridPlugin, interactionPlugin, listPlugin]}
                initialView="dayGridMonth"
                events={filteredEvents}
                eventClick={handleEventClick}
                dateClick={handleDateClick}
                height="auto"
                headerToolbar={{
                  left: "prev,next today",
                  center: "title",
                  right: "dayGridMonth,listWeek",
                }}
                buttonText={{
                  today: "Aujourd'hui",
                  month: "Mois",
                  week: "Semaine",
                  list: "Agenda",
                }}
                dayMaxEvents={3}
                moreLinkContent={(args) => `+${args.num} autres`}
                noEventsText="Aucun événement à afficher"
              />
            )}
          </Paper>
        </Fade>
      </Container>

      {/* MODALS */}
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
    </Box>
  );
};

export default Calendar;
