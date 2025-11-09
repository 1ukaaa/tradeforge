import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import AutoStoriesIcon from "@mui/icons-material/AutoStories";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CloseIcon from "@mui/icons-material/Close";
import HourglassBottomIcon from "@mui/icons-material/HourglassBottom";
import PhotoCameraFrontIcon from "@mui/icons-material/PhotoCameraFront";
import QueryStatsIcon from "@mui/icons-material/QueryStats";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grow,
  IconButton,
  InputLabel,
  LinearProgress,
  MenuItem,
  OutlinedInput,
  Paper,
  Select,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

const buildMetadataForm = (entry) => {
  const meta = entry?.metadata || {};
  const sourceDate = meta.date || entry?.createdAt;
  return {
    title: meta.title || "",
    result: meta.result || entry?.type || "",
    grade: meta.grade || "",
    timeframe: meta.timeframe || "",
    date: sourceDate || "",
    symbol: meta.symbol || "",
    nextSteps: meta.nextSteps || "",
    risk: meta.risk || "",
    tags: (meta.tags || []).join(", "),
    images: meta.images || [],
  };
};

const WEEK_DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const RESULT_OPTIONS = ["Break Even", "Stop Loss", "Target"];
const TIMEFRAME_OPTIONS = ["M5", "M15", "H1", "H4", "D", "W"];

const isValidDate = (value) => value instanceof Date && !Number.isNaN(value.getTime());

const toDateKey = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const toLocalDateTimeValue = (iso) => {
  if (!iso) return "";
  const date = new Date(iso);
  if (!isValidDate(date)) return "";
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(
    date.getMinutes()
  )}`;
};

const parseLocalDateTime = (value) => {
  if (!value) return "";
  const parsed = new Date(value);
  if (!isValidDate(parsed)) return "";
  return parsed.toISOString();
};

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const calendarPulseKeyframes = {
  "@keyframes dayPulse": {
    "0%": { transform: "scale(1)", opacity: 0.5 },
    "50%": { transform: "scale(1.35)", opacity: 0.2 },
    "100%": { transform: "scale(1)", opacity: 0.5 },
  },
};
const successPulseKeyframes = {
  "@keyframes successPulse": {
    "0%": { transform: "scale(0.92)", opacity: 0.6 },
    "60%": { transform: "scale(1.12)", opacity: 1 },
    "100%": { transform: "scale(1)", opacity: 0.9 },
  },
};

const resultTone = (result) => {
  if (!result) return "primary";
  const normalized = result.toLowerCase();
  if (/(gain|profit|gagné|positif|win)/.test(normalized)) return "success";
  if (/(perte|loss|négatif|raté|down)/.test(normalized)) return "error";
  return "info";
};

const TradeDayCard = ({ trade, onView }) => {
  const title = trade.metadata?.title || trade.metadata?.symbol || "Trade";
  const dateLabel = formatDate(trade.metadata?.date || trade.createdAt);
  return (
    <Paper
      elevation={1}
      sx={{
        p: 2,
        borderRadius: 3,
        border: "1px solid rgba(39,58,150,0.12)",
        background: "linear-gradient(180deg, rgba(247,249,255,0.95), rgba(233,237,255,0.9))",
      }}
    >
      <Stack spacing={1.25}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
          <Stack spacing={0.4}>
            <Typography variant="subtitle1" fontWeight={700}>
              {title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {trade.metadata?.symbol || "Actif inconnu"}
            </Typography>
          </Stack>
          <Typography variant="caption" color="text.secondary">
            {dateLabel}
          </Typography>
        </Stack>
        <Stack direction="row" spacing={1} flexWrap="wrap">
          {trade.metadata?.timeframe && (
            <Chip label={trade.metadata.timeframe} size="small" variant="outlined" />
          )}
          <Chip
            label={`Résultat : ${trade.metadata?.result || "En attente"}`}
            size="small"
            color={resultTone(trade.metadata?.result)}
            variant="filled"
          />
        </Stack>
        {trade.metadata?.outcome && (
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.4 }}>
            {trade.metadata.outcome.split("\n")[0]}
          </Typography>
        )}
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="caption" color="text.secondary">
            {trade.metadata?.nextSteps ? `Prochaine étape : ${trade.metadata.nextSteps}` : "Pas de prochaine étape précisée"}
          </Typography>
          <Button variant="text" size="small" sx={{ textTransform: "none" }} onClick={() => onView(trade)}>
            Voir la fiche
          </Button>
        </Stack>
      </Stack>
      </Paper>
  );
};

const SectionCard = ({ title, helper, children, sx }) => (
  <Paper
    elevation={0}
    sx={{
      p: { xs: 2, md: 2.5 },
      borderRadius: 3,
      border: "1px solid rgba(15,76,129,0.15)",
      background: "rgba(255,255,255,0.95)",
      boxShadow: "0 12px 30px rgba(15,76,129,0.08)",
      ...sx,
    }}
  >
    <Stack spacing={1}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="subtitle2" color="text.secondary">
          {title}
        </Typography>
        {helper && (
          <Typography variant="caption" color="text.secondary">
            {helper}
          </Typography>
        )}
      </Stack>
      {children}
    </Stack>
  </Paper>
);

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
  const [editedType, setEditedType] = useState("analyse");
  const [editedMetadata, setEditedMetadata] = useState(buildMetadataForm(null));
  const [operationLoading, setOperationLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editError, setEditError] = useState("");
  const [editSuccess, setEditSuccess] = useState("");
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDateKey, setSelectedDateKey] = useState(() => {
    const now = new Date();
    return toDateKey(new Date(now.getFullYear(), now.getMonth(), 1));
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [successPulse, setSuccessPulse] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSymbol, setFilterSymbol] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterResults, setFilterResults] = useState([]);
  const [filterTags, setFilterTags] = useState([]);
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const planRef = useRef(null);
  const dissectionRef = useRef(null);
  const stepsRef = useRef(null);
  const capturesRef = useRef(null);

  const resetEditingFields = useCallback((entry) => {
    const planSource = entry?.plan || entry?.metadata?.planSummary || "";
    setEditedMetadata(buildMetadataForm(entry));
    setEditedType(entry?.type || "analyse");
    setEditedContent(entry?.content || "");
    setEditedPlan(planSource);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadingMessage("Chargement du journal en cours...");
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
        if (!cancelled) {
          setLoading(false);
          setLoadingMessage("");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const tabFilteredEntries = useMemo(() => {
    if (activeTab === "all") return entries;
    if (activeTab === "trade") return entries.filter((entry) => entry.type === "trade");
    if (activeTab === "analyse") return entries.filter((entry) => entry.type === "analyse");
    return [];
  }, [entries, activeTab]);

  const tradeEntries = useMemo(() => entries.filter((entry) => entry.type === "trade"), [entries]);

  const tradesByDate = useMemo(() => {
    const map = {};
    tradeEntries.forEach((entry) => {
      const entryDate = new Date(entry.metadata?.date || entry.createdAt);
      if (!isValidDate(entryDate)) return;
      const key = toDateKey(entryDate);
      if (!map[key]) map[key] = [];
      map[key].push(entry);
    });
    return map;
  }, [tradeEntries]);

  const symbolOptions = useMemo(() => {
    const options = new Set();
    entries.forEach((entry) => {
      const symbol = entry.metadata?.symbol;
      if (symbol) {
        symbol.split(",").forEach((part) => options.add(part.trim()));
      }
    });
    return Array.from(options).filter(Boolean);
  }, [entries]);

  const tagOptions = useMemo(() => {
    const tags = new Set();
    entries.forEach((entry) => {
      (entry.metadata?.tags || []).forEach((tag) => tags.add(tag));
    });
    return Array.from(tags);
  }, [entries]);

  const filteredEntries = useMemo(() => {
    let result = tabFilteredEntries;
    const normalizedSearch = searchQuery.trim().toLowerCase();
    if (normalizedSearch) {
      result = result.filter((entry) => {
        const title = entry.metadata?.title || "";
        const symbol = entry.metadata?.symbol || "";
        const content = entry.content || "";
        return [title, symbol, content]
          .some((value) => value.toLowerCase().includes(normalizedSearch));
      });
    }
    if (filterSymbol) {
      const normalizedSymbol = filterSymbol.trim().toLowerCase();
      result = result.filter((entry) => (entry.metadata?.symbol || "").toLowerCase().includes(normalizedSymbol));
    }
    if (filterType !== "all") {
      result = result.filter((entry) => entry.type === filterType);
    }
    if (filterResults.length) {
      const lowered = filterResults.map((resultItem) => resultItem.toLowerCase());
      result = result.filter((entry) => lowered.includes((entry.metadata?.result || "").toLowerCase()));
    }
    if (filterTags.length) {
      result = result.filter((entry) => {
        const entryTags = (entry.metadata?.tags || []).map((tag) => tag.toLowerCase());
        return filterTags.every((tag) => entryTags.includes(tag.toLowerCase()));
      });
    }
    const start = filterStartDate ? new Date(filterStartDate) : null;
    const end = filterEndDate ? new Date(filterEndDate) : null;
    if (start || end) {
      result = result.filter((entry) => {
        const entryDate = new Date(entry.metadata?.date || entry.createdAt);
        if (!isValidDate(entryDate)) return false;
        if (start && entryDate < start) return false;
        if (end && entryDate > end) return false;
        return true;
      });
    }
    return result;
  }, [
    tabFilteredEntries,
    searchQuery,
    filterSymbol,
    filterType,
    filterResults,
    filterTags,
    filterStartDate,
    filterEndDate,
  ]);

  const tradesThisMonth = useMemo(() => {
    const startOfMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
    const endOfMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0);
    return tradeEntries.filter((entry) => {
      const entryDate = new Date(entry.metadata?.date || entry.createdAt);
      if (!isValidDate(entryDate)) return false;
      return entryDate >= startOfMonth && entryDate <= endOfMonth;
    });
  }, [calendarMonth, tradeEntries]);

  const calendarCells = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const startOffset = (firstDayOfMonth.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const totalSlots = Math.ceil((startOffset + daysInMonth) / 7) * 7;
    const cells = [];
    for (let index = 0; index < totalSlots; index += 1) {
      const dayNumber = index - startOffset + 1;
      const cellDate = new Date(year, month, dayNumber);
      const isCurrentMonth = dayNumber >= 1 && dayNumber <= daysInMonth;
      cells.push({ date: cellDate, current: isCurrentMonth });
    }
    return cells;
  }, [calendarMonth]);

  const monthLabel = useMemo(
    () => new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(calendarMonth),
    [calendarMonth]
  );

  const selectedDayTrades = useMemo(() => {
    if (!selectedDateKey) return [];
    return tradesByDate[selectedDateKey] || [];
  }, [selectedDateKey, tradesByDate]);

  const selectedDateLabel = useMemo(() => {
    if (!selectedDateKey) return "";
    const [year, month, day] = selectedDateKey.split("-");
    const numericDate = new Date(Number(year), Number(month) - 1, Number(day));
    if (!isValidDate(numericDate)) return "";
    return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(numericDate);
  }, [selectedDateKey]);

  const handlePrevMonth = useCallback(() => {
    setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }, []);

  const handleNextMonth = useCallback(() => {
    setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }, []);

  const timeframeSelection = useMemo(() => {
    return (editedMetadata.timeframe || "")
      .split(",")
      .map((frame) => frame.trim())
      .filter(Boolean);
  }, [editedMetadata.timeframe]);

  const formattedDateInput = useMemo(() => toLocalDateTimeValue(editedMetadata.date), [editedMetadata.date]);

  const handleResultChange = useCallback(
    (event) => {
      const { value } = event.target;
      setEditedMetadata((prev) => ({ ...prev, result: value }));
    },
    [setEditedMetadata]
  );

  const handleTimeframeChange = useCallback(
    (event) => {
      const { value } = event.target;
      const selections = typeof value === "string" ? value.split(",") : value;
      const normalized = selections.map((item) => item.trim()).filter(Boolean);
      setEditedMetadata((prev) => ({ ...prev, timeframe: normalized.join(", ") }));
    },
    [setEditedMetadata]
  );

  const handleDateChange = useCallback(
    (event) => {
      setEditedMetadata((prev) => ({ ...prev, date: parseLocalDateTime(event.target.value) }));
    },
    [setEditedMetadata]
  );

  const addImages = useCallback(
    async (files) => {
      if (!files.length) return;
      const encoded = await Promise.all(
        files.map(async (file) => ({
          id: `${Date.now()}-${Math.random()}`,
          name: file.name || "clipboard.png",
          src: await fileToBase64(file),
        }))
      );
      setEditedMetadata((prev) => ({
        ...prev,
        images: [...prev.images, ...encoded],
      }));
    },
    [setEditedMetadata]
  );

  const handleImageUpload = useCallback(
    async (event) => {
      event.preventDefault();
      const files = Array.from(event.target.files || []).filter((file) => file.type.startsWith("image/"));
      if (!files.length) return;
      await addImages(files);
      event.target.value = "";
    },
    [addImages]
  );

  const handleRemoveImage = useCallback(
    (id) => {
      setEditedMetadata((prev) => ({
        ...prev,
        images: prev.images.filter((item) => item.id !== id),
      }));
    },
    [setEditedMetadata]
  );

  useEffect(() => {
    setSelectedDateKey(toDateKey(calendarMonth));
  }, [calendarMonth]);

  const handleNavigate = useCallback((ref) => {
    ref?.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const handleResetFilters = useCallback(() => {
    setSearchQuery("");
    setFilterSymbol("");
    setFilterType("all");
    setFilterResults([]);
    setFilterTags([]);
    setFilterStartDate("");
    setFilterEndDate("");
  }, []);

  const handleSnackbarClose = useCallback(() => {
    setSnackbarOpen(false);
    setSuccessPulse(false);
    setStatusMessage("");
  }, []);

  useEffect(() => {
    if (!statusMessage) return undefined;
    setSuccessPulse(true);
    setSnackbarOpen(true);
    const timer = setTimeout(() => {
      setSuccessPulse(false);
      setSnackbarOpen(false);
      setStatusMessage("");
    }, 4000);
    return () => clearTimeout(timer);
  }, [statusMessage]);

  const navSections = useMemo(
    () => [
      { label: "Plan initial", ref: planRef },
      { label: "Dissection", ref: dissectionRef },
      { label: "Prochaines étapes", ref: stepsRef },
      { label: "Captures", ref: capturesRef },
    ],
    []
  );

  const open = Boolean(detailEntry);
  const previewTags = isEditing
    ? editedMetadata.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
    : detailEntry?.metadata?.tags || [];
  const onCloseDetail = () => setDetailEntry(null);

  const handlePasteImages = useCallback(
    async (event) => {
      if (!open) return;
      const items = Array.from(event.clipboardData?.items || []);
      const files = items
        .filter((item) => item.kind === "file" && item.type.startsWith("image/"))
        .map((item) => item.getAsFile())
        .filter(Boolean);
      if (!files.length) return;
      event.preventDefault();
      await addImages(files);
    },
    [addImages, open]
  );

  useEffect(() => {
    if (!open) return undefined;
    window.addEventListener("paste", handlePasteImages);
    return () => window.removeEventListener("paste", handlePasteImages);
  }, [open, handlePasteImages]);

  useEffect(() => {
    if (!detailEntry) {
      resetEditingFields(null);
      setIsEditing(false);
      setEditError("");
      setEditSuccess("");
      setStatusMessage("");
      return;
    }
    resetEditingFields(detailEntry);
    setIsEditing(false);
    setEditError("");
    setEditSuccess("");
  }, [detailEntry, resetEditingFields]);

  const handleSaveDetail = async () => {
    if (!detailEntry) return;
    setOperationLoading(true);
    setEditError("");
    setEditSuccess("");
    setLoadingMessage(`${editedType === "trade" ? "Trade" : "Analyse"} en cours...`);
    try {
      const metadataBase = detailEntry.metadata || {};
      const tagValues = editedMetadata.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);
      const metadata = {
        ...metadataBase,
        title:
          editedMetadata.title ||
          metadataBase.title ||
          `${editedType === "trade" ? "Trade" : "Analyse"} enregistrée`,
        result: editedMetadata.result || metadataBase.result || editedType,
        date: editedMetadata.date || metadataBase.date || detailEntry.createdAt,
        grade: editedMetadata.grade || metadataBase.grade,
        timeframe: editedMetadata.timeframe || metadataBase.timeframe,
        symbol: editedMetadata.symbol || metadataBase.symbol,
        nextSteps: editedMetadata.nextSteps || metadataBase.nextSteps,
        risk: editedMetadata.risk || metadataBase.risk,
        tags: tagValues,
        images: editedMetadata.images,
        planSummary: editedPlan.split("\n")[0]?.trim() || metadataBase.planSummary,
        outcome:
          editedContent.split("\n").slice(0, 2).join(" ").trim() || metadataBase.outcome,
      };
      const updated = await updateJournalEntry({
        id: detailEntry.id,
        type: editedType,
        content: editedContent,
        plan: editedPlan,
        transcript: detailEntry.transcript,
        metadata,
      });
      setEntries((prev) => prev.map((entry) => (entry.id === updated.id ? updated : entry)));
      setDetailEntry(updated);
      const successMessage = `Entrée ${editedType} enregistrée dans le journal.`;
      setEditSuccess(successMessage);
      setStatusMessage(successMessage);
      setIsEditing(false);
    } catch (err) {
      setEditError(err.message || "Impossible de mettre à jour la fiche.");
    } finally {
      setOperationLoading(false);
      setLoadingMessage("");
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
        <Tab value="calendar" label="Calendrier" />
      </Tabs>

      <Paper elevation={0} sx={{ borderRadius: 3, border: "1px solid rgba(15,76,129,0.12)", p: 2, mb: 2 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="flex-end" flexWrap="wrap">
          <TextField
            label="Recherche"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            size="small"
            placeholder="Titre, contenu ou symbole"
            sx={{ minWidth: 240, flex: 1 }}
          />
          <TextField
            label="Paire / Symbole"
            value={filterSymbol}
            onChange={(event) => setFilterSymbol(event.target.value)}
            size="small"
            placeholder="EUR/USD"
            sx={{ minWidth: 200 }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="filter-type-label">Type</InputLabel>
            <Select
              labelId="filter-type-label"
              label="Type"
              value={filterType}
              onChange={(event) => setFilterType(event.target.value)}
            >
              <MenuItem value="all">Tous</MenuItem>
              <MenuItem value="trade">Trades</MenuItem>
              <MenuItem value="analyse">Analyses</MenuItem>
            </Select>
          </FormControl>
          <Autocomplete
            multiple
            size="small"
            options={RESULT_OPTIONS}
            value={filterResults}
            onChange={(_, value) => setFilterResults(value)}
            renderInput={(params) => (
              <TextField {...params} label="Résultat" placeholder="Target, Break Even..." />
            )}
            sx={{ minWidth: 200 }}
          />
          <Autocomplete
            multiple
            size="small"
            options={tagOptions}
            value={filterTags}
            onChange={(_, value) => setFilterTags(value)}
            renderInput={(params) => (
              <TextField {...params} label="Tags" placeholder="Haussier, Breakout..." />
            )}
            sx={{ minWidth: 220 }}
          />
          <Stack direction="row" spacing={1}>
            <TextField
              label="Début"
              type="date"
              value={filterStartDate}
              onChange={(event) => setFilterStartDate(event.target.value)}
              InputLabelProps={{ shrink: true }}
              size="small"
            />
            <TextField
              label="Fin"
              type="date"
              value={filterEndDate}
              onChange={(event) => setFilterEndDate(event.target.value)}
              InputLabelProps={{ shrink: true }}
              size="small"
            />
          </Stack>
          <Button variant="outlined" onClick={handleResetFilters} size="small">
            Réinitialiser
          </Button>
        </Stack>
      </Paper>

      <Snackbar
        open={snackbarOpen}
        onClose={handleSnackbarClose}
        autoHideDuration={4000}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity="success"
          sx={{
            borderRadius: 3,
            display: "flex",
            alignItems: "center",
            gap: 1,
            animation: successPulse ? "successPulse 0.8s ease" : undefined,
            ...(successPulse ? successPulseKeyframes : {}),
          }}
          icon={
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                bgcolor: "success.light",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <CheckCircleOutlineIcon fontSize="small" />
            </Box>
          }
        >
          {statusMessage}
        </Alert>
      </Snackbar>

      {loading && (
        <>
          <LinearProgress sx={{ height: 4, borderRadius: 999 }} />
          <Typography variant="body2" color="text.secondary">
            {loadingMessage || "Analyse en cours..."}
          </Typography>
        </>
      )}
      {fetchError && <Alert severity="error">{fetchError}</Alert>}
      {!loading && activeTab === "analyse" && (
        <Typography variant="body2" color="text.secondary">
          Analyse en cours...
        </Typography>
      )}
      {!loading && activeTab === "trade" && (
        <Typography variant="body2" color="text.secondary">
          Revue des trades disponible.
        </Typography>
      )}

      {activeTab === "calendar" ? (
        <Stack spacing={2} sx={{ pb: 4 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="h6" fontWeight={600}>
              {monthLabel}
            </Typography>
            <Stack direction="row" spacing={1}>
              <IconButton size="small" onClick={handlePrevMonth} aria-label="Mois précédent">
                <ArrowBackIosNewIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={handleNextMonth} aria-label="Mois suivant">
                <ArrowForwardIosIcon fontSize="small" />
              </IconButton>
            </Stack>
          </Stack>

          <Typography variant="body2" color="text.secondary">
            Ne sont affichés que les trades et leurs métadonnées sur le mois sélectionné.
          </Typography>

          <Stack direction="row" spacing={1} sx={{ width: "100%" }}>
            {WEEK_DAYS.map((label) => (
              <Typography key={label} variant="caption" align="center" sx={{ flex: 1, fontWeight: 600 }}>
                {label}
              </Typography>
            ))}
          </Stack>

          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 3,
              border: "1px solid rgba(39,58,150,0.12)",
              background: "rgba(255,255,255,0.95)",
              boxShadow: "0 20px 40px rgba(15,76,129,0.08)",
            }}
          >
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
                gap: 1,
              }}
            >
              {calendarCells.map((cell, index) => {
                const cellKey = `${toDateKey(cell.date)}-${index}`;
                const baseKey = toDateKey(cell.date);
                const dayTrades = cell.current ? tradesByDate[baseKey] || [] : [];
                const highlightTrades = dayTrades.slice(0, 2);
                const moreCount = Math.max(0, dayTrades.length - highlightTrades.length);
                const hasTrades = dayTrades.length > 0;
                const isSelected = cell.current && selectedDateKey === baseKey;

                return (
                <Box
                  key={cellKey}
                  onClick={() => {
                    if (!cell.current) return;
                    setSelectedDateKey(baseKey);
                  }}
                  sx={{
                    borderRadius: 2,
                    minHeight: 120,
                    p: 1,
                    border: 1,
                    borderColor: isSelected ? "primary.dark" : hasTrades ? "primary.main" : "divider",
                    bgcolor: isSelected
                      ? "rgba(39,58,150,0.08)"
                      : hasTrades
                      ? "rgba(15,76,129,0.04)"
                      : cell.current
                      ? "background.paper"
                      : "action.hover",
                    cursor: cell.current ? "pointer" : "default",
                    transition: "border-color 0.2s, background-color 0.2s, box-shadow 0.2s",
                    boxShadow: isSelected ? "0 12px 30px rgba(15,76,129,0.15)" : "none",
                    position: "relative",
                    overflow: "hidden",
                    ...calendarPulseKeyframes,
                    "&:hover": {
                      transform: cell.current ? "translateY(-3px)" : "none",
                    },
                  }}
                >
                  {hasTrades && (
                    <Box
                      sx={{
                        position: "absolute",
                        inset: 6,
                        borderRadius: 2,
                        border: "1px solid rgba(39,58,150,0.08)",
                        pointerEvents: "none",
                        animation: isSelected ? "dayPulse 1.6s infinite" : "none",
                      }}
                    />
                  )}
                  <Stack spacing={1}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                      <Typography
                        variant="subtitle2"
                        color={cell.current ? "text.primary" : "text.secondary"}
                      >
                        {cell.date.getDate()}
                      </Typography>
                      {hasTrades && (
                        <Chip
                          label={`${dayTrades.length} trade${dayTrades.length > 1 ? "s" : ""}`}
                          size="small"
                          color="info"
                          sx={{ fontSize: "0.6rem", px: 1 }}
                        />
                      )}
                    </Stack>
                    <Stack spacing={0.5}>
                      {highlightTrades.map((trade) => (
                        <Stack
                          key={trade.id}
                          direction="row"
                          justifyContent="space-between"
                          alignItems="center"
                          sx={{
                            bgcolor: "rgba(15,76,129,0.08)",
                            borderRadius: 1.5,
                            px: 1,
                            py: 0.4,
                            transition: "background-color 0.2s",
                            "&:hover": {
                              bgcolor: "rgba(15,76,129,0.15)",
                            },
                          }}
                        >
                          <Typography variant="caption" fontWeight={600}>
                            {trade.metadata?.symbol || trade.metadata?.title || "Trade"}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {trade.metadata?.result || "En attente"}
                          </Typography>
                        </Stack>
                      ))}
                      {moreCount > 0 && (
                        <Typography variant="caption" color="text.secondary">
                          +{moreCount} autres
                        </Typography>
                      )}
                    </Stack>
                  </Stack>
                </Box>
              );
            })}
            </Box>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 3,
              border: "1px solid rgba(39,58,150,0.12)",
              background: "rgba(247,249,255,0.95)",
              boxShadow: "0 14px 30px rgba(15,76,129,0.08)",
            }}
          >
            <Stack spacing={1.5}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Stack spacing={0.4}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    {selectedDateLabel ? `Trades du ${selectedDateLabel}` : "Sélectionne une journée"}
                  </Typography>
                  {selectedDayTrades.length > 0 && (
                    <Typography variant="caption" color="text.secondary">
                      {selectedDayTrades.length} trade{selectedDayTrades.length > 1 ? "s" : ""} journalisé
                      {selectedDayTrades.length > 1 ? "s" : ""}
                    </Typography>
                  )}
                </Stack>
                <Chip
                  label={selectedDayTrades.length ? "Focus" : "À venir"}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              </Stack>
              {selectedDayTrades.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  {selectedDateLabel
                    ? "Aucun trade enregistré pour cette journée."
                    : "Clique sur une case pour voir les trades associés."}
                </Typography>
              ) : (
                <Stack spacing={2}>
                  {selectedDayTrades.map((trade, index) => (
                    <Grow
                      in
                      key={trade.id}
                      style={{ transformOrigin: "top center" }}
                      timeout={250 + index * 50}
                    >
                      <Box>
                        <TradeDayCard trade={trade} onView={setDetailEntry} />
                      </Box>
                    </Grow>
                  ))}
                </Stack>
              )}
            </Stack>
          </Paper>

          {tradesThisMonth.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              Aucun trade journalisé pour {monthLabel}. Enregistre un trade pour le visualiser ici.
            </Typography>
          )}
        </Stack>
      ) : !loading && filteredEntries.length === 0 ? (
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
          <Stack spacing={3}>
            <Stack spacing={1}>
              <Typography variant="subtitle2" color="text.secondary">
                {formatDate(detailEntry?.metadata?.date || detailEntry?.createdAt)} · {detailEntry?.metadata?.symbol || "Actif"}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {navSections.map((section) => (
                <Button
                  key={section.label}
                  variant="outlined"
                  size="small"
                  onClick={() => handleNavigate(section.ref)}
                >
                  {section.label}
                </Button>
              ))}
            </Stack>
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: 3,
                border: "1px solid rgba(39,58,150,0.12)",
                background: "rgba(255,255,255,0.96)",
                boxShadow: "0 12px 30px rgba(15,76,129,0.08)",
              }}
            >
              <Stack spacing={2}>
                {isEditing ? (
                  <Stack spacing={2}>
                    <TextField
                      label="Titre de la fiche"
                      value={editedMetadata.title}
                      onChange={(event) => setEditedMetadata((prev) => ({ ...prev, title: event.target.value }))}
                      fullWidth
                      variant="outlined"
                    />
                    <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                      <Stack spacing={1} flex={1}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Type de la fiche
                        </Typography>
                        <ToggleButtonGroup
                          value={editedType}
                          exclusive
                          onChange={(_, value) => value && setEditedType(value)}
                          aria-label="Type de la fiche"
                          size="small"
                          sx={{ width: "100%" }}
                        >
                          <ToggleButton value="analyse">Analyse</ToggleButton>
                          <ToggleButton value="trade">Trade</ToggleButton>
                        </ToggleButtonGroup>
                      </Stack>
                      <FormControl fullWidth size="small">
                        <InputLabel id="result-label">Résultat</InputLabel>
                        <Select
                          labelId="result-label"
                          label="Résultat"
                          value={editedMetadata.result}
                          onChange={handleResultChange}
                        >
                          {RESULT_OPTIONS.map((option) => (
                            <MenuItem key={option} value={option}>
                              {option}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Stack>
                    <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                      <TextField
                        label="Grade"
                        value={editedMetadata.grade}
                        onChange={(event) => setEditedMetadata((prev) => ({ ...prev, grade: event.target.value }))}
                        fullWidth
                        variant="outlined"
                      />
                      <TextField
                        label="Symbole"
                        value={editedMetadata.symbol}
                        onChange={(event) => setEditedMetadata((prev) => ({ ...prev, symbol: event.target.value }))}
                        fullWidth
                        variant="outlined"
                      />
                    </Stack>
                    <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                      <TextField
                        label="Date"
                        type="datetime-local"
                        value={formattedDateInput}
                        onChange={handleDateChange}
                        fullWidth
                        variant="outlined"
                        InputLabelProps={{ shrink: true }}
                      />
                      <FormControl fullWidth size="small">
                        <InputLabel id="timeframe-label">Timeframe</InputLabel>
                        <Select
                          labelId="timeframe-label"
                          multiple
                          value={timeframeSelection}
                          onChange={handleTimeframeChange}
                          input={<OutlinedInput label="Timeframe" />}
                          renderValue={(selected) => (selected.length ? selected.join(", ") : "Aucun")}
                        >
                          {TIMEFRAME_OPTIONS.map((option) => (
                            <MenuItem key={option} value={option}>
                              {option}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Stack>
                    <TextField
                      label="Tags (séparés par des virgules)"
                      value={editedMetadata.tags}
                      onChange={(event) => setEditedMetadata((prev) => ({ ...prev, tags: event.target.value }))}
                      fullWidth
                      variant="outlined"
                      helperText="Par exemple : Trade, IA, Breakout"
                    />
                  </Stack>
                ) : (
                  <Stack spacing={1}>
                    <Typography variant="h5" fontWeight={700}>
                      {detailEntry?.metadata?.title || detailEntry?.content}
                    </Typography>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1} flexWrap="wrap">
                      <Chip
                        label={typeLabel[detailEntry?.type || "analyse"]?.chip || "Entrée"}
                        variant="outlined"
                        sx={{
                          borderColor: typeLabel[detailEntry?.type || "analyse"]?.color || "divider",
                          color: typeLabel[detailEntry?.type || "analyse"]?.color || "text.primary",
                          fontWeight: 600,
                        }}
                      />
                      {detailEntry?.metadata?.result && (
                        <Chip
                          label={`Résultat : ${detailEntry.metadata.result}`}
                          size="small"
                          color={resultTone(detailEntry?.metadata?.result)}
                          variant="filled"
                        />
                      )}
                      {detailEntry?.metadata?.timeframe && (
                        <Chip label={`Timeframe : ${detailEntry.metadata.timeframe}`} size="small" variant="outlined" />
                      )}
                      {detailEntry?.metadata?.grade && (
                        <Chip label={`Grade : ${detailEntry.metadata.grade}`} size="small" variant="outlined" />
                      )}
                    </Stack>
                  </Stack>
                )}
              </Stack>
            </Paper>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <Box ref={planRef} width="100%">
                <SectionCard title="Plan initial" helper="Principe et scénario">
                  {isEditing ? (
                    <TextField
                      value={editedPlan}
                      onChange={(event) => setEditedPlan(event.target.value)}
                      multiline
                      minRows={4}
                      fullWidth
                      variant="outlined"
                    />
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      {detailEntry?.metadata?.planSummary || detailEntry?.plan || "Plan non défini."}
                    </Typography>
                  )}
                </SectionCard>
              </Box>
              <Box ref={dissectionRef} width="100%">
                <SectionCard title="Dissection" helper="Retours et résultats">
                  {isEditing ? (
                    <TextField
                      value={editedContent}
                      onChange={(event) => setEditedContent(event.target.value)}
                      multiline
                      minRows={8}
                      fullWidth
                      label="Contenu"
                      variant="outlined"
                    />
                  ) : (
                    <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                      {detailEntry?.metadata?.outcome || detailEntry?.content}
                    </Typography>
                  )}
                </SectionCard>
              </Box>
            </Stack>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <Box ref={stepsRef} width="100%">
                <SectionCard title="Prochaines étapes">
                  {isEditing ? (
                    <TextField
                      value={editedMetadata.nextSteps}
                      onChange={(event) => setEditedMetadata((prev) => ({ ...prev, nextSteps: event.target.value }))}
                      multiline
                      minRows={3}
                      fullWidth
                      variant="outlined"
                    />
                  ) : (
                    <Typography variant="body2">{detailEntry?.metadata?.nextSteps || "À approfondir."}</Typography>
                  )}
                </SectionCard>
              </Box>
              <Box width="100%">
                <SectionCard title="Risque critique">
                  {isEditing ? (
                    <TextField
                      value={editedMetadata.risk}
                      onChange={(event) => setEditedMetadata((prev) => ({ ...prev, risk: event.target.value }))}
                      multiline
                      minRows={3}
                      fullWidth
                      variant="outlined"
                    />
                  ) : (
                    <Typography variant="body2">{detailEntry?.metadata?.risk || "Aucune remarque."}</Typography>
                  )}
                </SectionCard>
              </Box>
            </Stack>
            <SectionCard title="Tags" helper="Mots-clés associés">
              {previewTags.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  Aucun tag défini.
                </Typography>
              ) : (
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {previewTags.map((tag) => (
                    <Chip key={tag} label={tag} size="small" />
                  ))}
                </Stack>
              )}
            </SectionCard>
            <Box ref={capturesRef}>
              <SectionCard title="Captures" helper="Screens de l’analyse">
                {isEditing ? (
                <Stack spacing={1}>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {editedMetadata.images.map((image) => (
                      <Box
                        key={image.id}
                        sx={{
                          position: "relative",
                          width: 120,
                          height: 80,
                          borderRadius: 2,
                          overflow: "hidden",
                          border: "1px solid rgba(15,76,129,0.2)",
                        }}
                      >
                        <img src={image.src} alt={image.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        <IconButton
                          size="small"
                          onClick={() => handleRemoveImage(image.id)}
                          sx={{
                            position: "absolute",
                            top: 4,
                            right: 4,
                            bgcolor: "rgba(15,27,61,0.8)",
                            color: "#fff",
                            "&:hover": { bgcolor: "rgba(15,27,61,0.9)" },
                          }}
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    ))}
                    <Button component="label" startIcon={<PhotoCameraFrontIcon />} size="small">
                      Ajouter
                      <input hidden accept="image/*" multiple type="file" onChange={handleImageUpload} />
                    </Button>
                  </Stack>
                  <Typography variant="caption" color="text.secondary">
                    Tu peux aussi coller un screenshot copié (⌘+V / Ctrl+V) directement dans cette fiche.
                  </Typography>
                </Stack>
              ) : (
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {(detailEntry?.metadata?.images || []).length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      Aucune capture enregistrée.
                    </Typography>
                  ) : (
                    (detailEntry?.metadata?.images || []).map((image) => (
                      <Box
                        key={image.id}
                        onClick={() => setSelectedImage(image)}
                        sx={{
                          width: { xs: "100%", sm: 160 },
                          height: 110,
                          borderRadius: 2,
                          overflow: "hidden",
                          border: "1px solid rgba(15,76,129,0.2)",
                          cursor: "pointer",
                          transition: "transform 0.2s",
                          "&:hover": { transform: "scale(1.04)" },
                        }}
                      >
                        <img src={image.src} alt={image.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </Box>
                    ))
                  )}
                </Stack>
              )}
            </SectionCard>
            </Box>
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
              <Box
                component="pre"
                sx={{
                  whiteSpace: "pre-wrap",
                  fontFamily: `'JetBrains Mono','Fira Code',monospace`,
                  bgcolor: "rgba(15,27,61,0.05)",
                  borderRadius: 2,
                  p: 2,
                }}
              >
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
                  resetEditingFields(detailEntry);
                  setIsEditing(false);
                  setEditError("");
                  setEditSuccess("");
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
      <Dialog
        open={Boolean(selectedImage)}
        onClose={() => setSelectedImage(null)}
        maxWidth="xl"
        PaperProps={{ sx: { background: "transparent", boxShadow: "none" } }}
      >
        <DialogContent
          sx={{
            p: 0,
            bgcolor: "transparent",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Box
            sx={{
              position: "relative",
              borderRadius: 3,
              overflow: "hidden",
              maxWidth: "90vw",
              maxHeight: "85vh",
              boxShadow: "0 25px 60px rgba(15,27,61,0.45)",
            }}
          >
            <IconButton
              onClick={() => setSelectedImage(null)}
              sx={{
                position: "absolute",
                top: 8,
                right: 8,
                zIndex: 10,
                bgcolor: "rgba(255,255,255,0.9)",
                "&:hover": { bgcolor: "rgba(255,255,255,1)" },
              }}
            >
              <CloseIcon />
            </IconButton>
            <img
              src={selectedImage?.src}
              alt={selectedImage?.name}
              style={{ display: "block", width: "100%", height: "100%", objectFit: "contain" }}
            />
          </Box>
        </DialogContent>
      </Dialog>
    </Stack>
  );
};

export default Journal;
