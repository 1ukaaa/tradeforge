import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
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
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import EmptyState from "../components/EmptyState";
import { ForgeCard, MetricBadge, PageHero, SectionHeading } from "../components/ForgeUI";
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
const TAB_MODES = [
  { value: "all", label: "Flux global", helper: "Toutes les entrées" },
  { value: "trade", label: "Trades", helper: "Exécutions & revues" },
  { value: "analyse", label: "Analyses", helper: "Plans et scénarios" },
  { value: "calendar", label: "Calendrier", helper: "Vue chrono" },
];

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
  const resultLabel = trade.metadata?.result || "En attente";
  const timeframe = trade.metadata?.timeframe || "—";
  return (
    <ForgeCard
      subtitle="FOCUS JOUR"
      title={title}
      helper={dateLabel}
      actions={
        <Button variant="outlined" size="small" onClick={() => onView(trade)}>
          Ouvrir
        </Button>
      }
      sx={{ gap: 1.5, p: { xs: 2, md: 2.5 } }}
    >
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="flex-start">
        <Stack spacing={0.5} flex={1}>
          <Typography variant="caption" color="text.secondary" sx={{ fontFamily: "JetBrains Mono, monospace" }}>
            {trade.metadata?.symbol || "Actif inconnu"}
          </Typography>
          {trade.metadata?.outcome && (
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.4 }}>
              {trade.metadata.outcome.split("\n")[0]}
            </Typography>
          )}
          <Typography variant="caption" color="text.secondary">
            {trade.metadata?.nextSteps ? `Next : ${trade.metadata.nextSteps}` : "Aucune prochaine étape"}
          </Typography>
        </Stack>
        <Stack spacing={1} alignItems="flex-end">
          <Chip label={timeframe} size="small" />
          <Chip label={resultLabel} size="small" color={resultTone(resultLabel)} />
        </Stack>
      </Stack>
    </ForgeCard>
  );
};

const SectionCard = ({ title, helper, children, sx }) => (
  <ForgeCard
    subtitle="SECTION"
    title={title}
    helper={helper}
    sx={{
      gap: 1,
      ...sx,
    }}
  >
    {children}
  </ForgeCard>
);

const JournalEntryCard = ({ entry, onView }) => {
  const meta = entry.metadata || {};
  const title = meta.title || `${entry.type === "trade" ? "Trade" : "Analyse"} enregistrée`;
  const dateLabel = meta.date ? formatDate(meta.date) : formatDate(entry.createdAt);
  const planSummary = meta.planSummary || entry.plan || "Plan non renseigné.";
  const outcome = meta.outcome || entry.content?.split("\n").slice(0, 2).join(" ") || "Synthèse en cours.";
  const planAdherence = Math.min(100, Math.max(0, meta.planAdherence ?? (entry.type === "trade" ? 82 : 56)));
  const tags = meta.tags && meta.tags.length ? meta.tags : [entry.type === "trade" ? "Trade" : "Analyse", "IA"];
  const result = meta.result || (entry.type === "trade" ? "Trade" : "Analyse");
  const grade = meta.grade || "À valider";
  const timeframe = meta.timeframe || (entry.type === "trade" ? "H4 / H1" : "Daily / H4");
  const symbol = meta.symbol || "Actif non défini";
  const nextSteps = meta.nextSteps || "Relire la fiche plus tard.";
  const risk = meta.risk || "Risque à qualifier";
  const toneColor = entry.type === "trade" ? "error.light" : "secondary.light";

  return (
    <ForgeCard
      subtitle={entry.type === "trade" ? "TRADE" : "ANALYSE"}
      title={title}
      helper={dateLabel}
      actions={
        <Stack direction="row" spacing={1}>
          <Button variant="text" onClick={() => onView(entry)}>
            Lire
          </Button>
          <Button variant="contained" size="small" onClick={() => onView(entry)}>
            Focus
          </Button>
        </Stack>
      }
      sx={{
        position: "relative",
        overflow: "hidden",
        "&:before": {
          content: '""',
          position: "absolute",
          top: -80,
          right: -40,
          width: 220,
          height: 220,
          borderRadius: "50%",
          background: (theme) => (entry.type === "trade" ? theme.forge.gradients.warning : theme.forge.gradients.chip),
          opacity: 0.15,
        },
      }}
    >
      <Stack spacing={2}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <Chip label={symbol} size="small" />
          <Stack direction="row" spacing={1} alignItems="center">
            <QueryStatsIcon fontSize="small" color="primary" />
            <Typography variant="body2" color="text.secondary">
              {timeframe}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            <HourglassBottomIcon fontSize="small" color="secondary" />
            <Typography variant="body2" color="text.secondary">
              {result}
            </Typography>
          </Stack>
          <Typography variant="caption" color="text.secondary" sx={{ fontFamily: "JetBrains Mono, monospace" }}>
            {grade}
          </Typography>
        </Stack>

        <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
          <Stack spacing={1} flex={1}>
            <Typography variant="subtitle2" color="text.secondary">
              Plan initial
            </Typography>
            <Typography variant="body2" color="text.primary">
              {planSummary}
            </Typography>
            <Box
              sx={{
                height: 6,
                borderRadius: 999,
                background: "rgba(255,255,255,0.08)",
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  height: "100%",
                  width: `${planAdherence}%`,
                  background: (theme) => (entry.type === "trade" ? theme.forge.gradients.warning : theme.forge.gradients.chip),
                  transition: "width 0.4s ease",
                }}
              />
            </Box>
            <Typography variant="caption" color="text.secondary">
              Discipline : {planAdherence}%
            </Typography>
          </Stack>
          <Stack spacing={1} flex={1}>
            <Typography variant="subtitle2" color="text.secondary">
              Dissection
            </Typography>
            <Typography variant="body2">{outcome}</Typography>
            <Typography variant="body2" fontWeight={600} sx={{ color: toneColor }}>
              {grade}
            </Typography>
          </Stack>
        </Stack>

        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <SectionHeading label="PROCHAINES ÉTAPES" />
          <Typography variant="body2" flex={1}>
            {nextSteps}
          </Typography>
        </Stack>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <SectionHeading label="RISQUE CRITIQUE" />
          <Typography variant="body2" flex={1}>
            {risk}
          </Typography>
        </Stack>

        <Stack direction="row" spacing={1} flexWrap="wrap">
          {tags.map((tag) => (
            <Chip key={tag} label={tag} size="small" />
          ))}
        </Stack>
      </Stack>
    </ForgeCard>
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

  const tabCounts = useMemo(() => {
    const tradeCount = entries.filter((entry) => entry.type === "trade").length;
    const analyseCount = entries.filter((entry) => entry.type === "analyse").length;
    return {
      all: entries.length,
      trade: tradeCount,
      analyse: analyseCount,
      calendar: tradeCount,
    };
  }, [entries]);

  const aggregateSnapshot = useMemo(() => {
    if (!entries.length) {
      return {
        totalEntries: 0,
        tradeCount: 0,
        analyseCount: 0,
        planScore: 0,
        winRate: 0,
        lastEntryLabel: "Aucune entrée",
      };
    }
    const tradeCount = entries.filter((entry) => entry.type === "trade").length;
    const analyseCount = entries.filter((entry) => entry.type === "analyse").length;
    const planValues = entries.map((entry) => entry.metadata?.planAdherence ?? (entry.type === "trade" ? 82 : 56));
    const planScore = planValues.length
      ? Math.round(planValues.reduce((acc, value) => acc + value, 0) / planValues.length)
      : 0;
    const winningTrades = entries
      .filter((entry) => entry.type === "trade")
      .filter((entry) => {
        const resultText = entry.metadata?.result || entry.metadata?.outcome || "";
        return /(target|gain|tp|win)/i.test(resultText);
      }).length;
    const winRate = tradeCount ? Math.round((winningTrades / tradeCount) * 100) : 0;
    const lastEntry = [...entries].sort(
      (a, b) => new Date(b.metadata?.date || b.createdAt) - new Date(a.metadata?.date || a.createdAt)
    )[0];
    const lastEntryLabel = lastEntry ? formatDate(lastEntry.metadata?.date || lastEntry.createdAt) : "Aucune entrée";

    return {
      totalEntries: entries.length,
      tradeCount,
      analyseCount,
      planScore,
      winRate,
      lastEntryLabel,
    };
  }, [entries]);

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
    <Stack spacing={4} pb={6}>
      <PageHero
        eyebrow="COMMAND CENTER"
        title="Journal TradeForge"
        description="Incarne ta discipline : consolide chaque trade, chaque analyse et laisse la forge donner une signature claire à ton process."
        actions={
          <>
            <Button component={Link} to="/" variant="contained">
              Lancer une séance
            </Button>
            <Button component={Link} to="/stats" variant="outlined" color="secondary">
              Ouvrir les stats
            </Button>
          </>
        }
        meta={[
          {
            label: "Entrées actives",
            value: aggregateSnapshot.totalEntries || "—",
            trend: aggregateSnapshot.lastEntryLabel,
          },
          {
            label: "Win rate",
            value: aggregateSnapshot.tradeCount ? `${aggregateSnapshot.winRate}%` : "—",
            trend: `${aggregateSnapshot.tradeCount} trade${aggregateSnapshot.tradeCount > 1 ? "s" : ""}`,
          },
          {
            label: "Discipline",
            value: aggregateSnapshot.planScore ? `${aggregateSnapshot.planScore}%` : "—",
            trend: `${aggregateSnapshot.analyseCount} analyse${aggregateSnapshot.analyseCount > 1 ? "s" : ""}`,
          },
        ]}
      />

      <ForgeCard
        subtitle="FILTRES ACTIFS"
        title="Affiner le flux"
        helper={`${filteredEntries.length} entrée${filteredEntries.length > 1 ? "s" : ""} visibles`}
        actions={
          <Button variant="text" size="small" onClick={handleResetFilters}>
            Réinitialiser
          </Button>
        }
      >
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="flex-end" flexWrap="wrap">
          <TextField
            label="Recherche globale"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Titre, contenu ou symbole"
            sx={{ minWidth: 240, flex: 1 }}
          />
          <TextField
            label="Paire / Symbole"
            value={filterSymbol}
            onChange={(event) => setFilterSymbol(event.target.value)}
            placeholder="EUR/USD"
            sx={{ minWidth: 200 }}
          />
          <FormControl sx={{ minWidth: 150 }}>
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
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ width: "100%" }}>
            <Autocomplete
              multiple
              options={RESULT_OPTIONS}
              value={filterResults}
              onChange={(_, value) => setFilterResults(value)}
              renderInput={(params) => (
                <TextField {...params} label="Résultat" placeholder="Target, Break Even..." />
              )}
              sx={{ flex: 1, minWidth: 200 }}
            />
            <Autocomplete
              multiple
              options={tagOptions}
              value={filterTags}
              onChange={(_, value) => setFilterTags(value)}
              renderInput={(params) => (
                <TextField {...params} label="Tags" placeholder="Haussier, Breakout..." />
              )}
              sx={{ flex: 1, minWidth: 220 }}
            />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ minWidth: 200 }}>
              <TextField
                label="Début"
                type="date"
                value={filterStartDate}
                onChange={(event) => setFilterStartDate(event.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Fin"
                type="date"
                value={filterEndDate}
                onChange={(event) => setFilterEndDate(event.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Stack>
          </Stack>
        </Stack>
      </ForgeCard>

      <ForgeCard
        subtitle="VUES"
        title="Choisis ton angle"
        helper="Bascule entre flux global, focus trades, analyses ou timeline."
        sx={{ gap: 3 }}
      >
        <Stack direction={{ xs: "column", xl: "row" }} spacing={3} alignItems="stretch">
          <ToggleButtonGroup
            value={activeTab}
            exclusive
            onChange={(_, value) => value && setActiveTab(value)}
            sx={{
              flex: 1,
              flexWrap: "wrap",
              gap: 1,
              "& .MuiToggleButtonGroup-grouped": {
                flex: { xs: "1 1 45%", md: "1 1 calc(25% - 8px)" },
                justifyContent: "flex-start",
                borderRadius: 3,
                border: "1px solid rgba(255,255,255,0.08)",
                px: 2,
                py: 1.5,
              },
              "& .MuiToggleButtonGroup-grouped.Mui-selected": {
                color: "text.primary",
                backgroundColor: "rgba(116,246,214,0.14)",
                borderColor: "rgba(116,246,214,0.4)",
              },
            }}
          >
            {TAB_MODES.map((mode) => (
              <ToggleButton key={mode.value} value={mode.value} disableRipple>
                <Stack spacing={0.5} alignItems="flex-start">
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {mode.label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {mode.helper}
                  </Typography>
                  <Typography variant="caption" color="primary.main" sx={{ fontFamily: "JetBrains Mono, monospace" }}>
                    {tabCounts[mode.value] ?? 0} entrées
                  </Typography>
                </Stack>
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <MetricBadge
              label="WIN RATE"
              value={aggregateSnapshot.tradeCount ? `${aggregateSnapshot.winRate}%` : "—"}
              tone="positive"
            />
            <MetricBadge
              label="DISCIPLINE"
              value={aggregateSnapshot.planScore ? `${aggregateSnapshot.planScore}%` : "—"}
            />
            <MetricBadge label="ANALYSES" value={aggregateSnapshot.analyseCount || 0} />
          </Stack>
        </Stack>
      </ForgeCard>

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
            borderRadius: 999,
            display: "flex",
            alignItems: "center",
            gap: 1,
            px: 3,
            py: 1.5,
            bgcolor: "rgba(116,246,214,0.15)",
            border: "1px solid rgba(116,246,214,0.4)",
            boxShadow: successPulse ? "0 0 30px rgba(116,246,214,0.35)" : "none",
            animation: successPulse ? "successPulse 0.8s ease" : undefined,
            ...(successPulse ? successPulseKeyframes : {}),
          }}
          icon={
            <Box
              sx={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                bgcolor: "rgba(116,246,214,0.25)",
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

      {fetchError && <Alert severity="error">{fetchError}</Alert>}

      {loading ? (
        <ForgeCard subtitle="SYNCHRO" title="Chargement du journal" helper="Nous consolidons les dernières entrées.">
          <LinearProgress sx={{ height: 6, borderRadius: 999 }} />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {loadingMessage || "Analyse en cours..."}
          </Typography>
        </ForgeCard>
      ) : activeTab === "calendar" ? (
        <Stack spacing={3}>
          <ForgeCard
            subtitle="TIMELINE"
            title={`Cycle ${monthLabel}`}
            helper={`${tradesThisMonth.length} trade${tradesThisMonth.length > 1 ? "s" : ""} journalisé${
              tradesThisMonth.length > 1 ? "s" : ""
            }`}
            actions={
              <Stack direction="row" spacing={1}>
                <IconButton size="small" onClick={handlePrevMonth} aria-label="Mois précédent">
                  <ArrowBackIosNewIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={handleNextMonth} aria-label="Mois suivant">
                  <ArrowForwardIosIcon fontSize="small" />
                </IconButton>
              </Stack>
            }
          >
            <Stack spacing={2}>
              <Typography variant="body2" color="text.secondary">
                Seuls les trades journalisés sur le mois sélectionné apparaissent dans la timeline.
              </Typography>
              <Stack direction="row" spacing={1}>
                {WEEK_DAYS.map((label) => (
                  <Typography key={label} variant="caption" align="center" sx={{ flex: 1, letterSpacing: "0.2em" }}>
                    {label}
                  </Typography>
                ))}
              </Stack>
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
                      onClick={() => cell.current && setSelectedDateKey(baseKey)}
                      sx={{
                        minHeight: 110,
                        borderRadius: 3,
                        p: 1.2,
                        border: "1px solid rgba(255,255,255,0.06)",
                        background: cell.current
                          ? isSelected
                            ? "linear-gradient(135deg, rgba(116,246,214,0.16), rgba(74,201,255,0.08))"
                            : "rgba(255,255,255,0.02)"
                          : "rgba(255,255,255,0.01)",
                        cursor: cell.current ? "pointer" : "not-allowed",
                        opacity: cell.current ? 1 : 0.3,
                        transition: "transform 0.2s, border-color 0.2s",
                        transform: isSelected ? "translateY(-2px)" : "none",
                        boxShadow: hasTrades ? "0 12px 24px rgba(0,0,0,0.35)" : "none",
                      }}
                    >
                      <Stack spacing={1}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Typography variant="subtitle2">{cell.current ? cell.date.getDate() : ""}</Typography>
                          {hasTrades && (
                            <Chip
                              label={dayTrades.length}
                              size="small"
                              sx={{
                                bgcolor: "rgba(116,246,214,0.12)",
                                color: "primary.main",
                                borderColor: "rgba(116,246,214,0.4)",
                              }}
                            />
                          )}
                        </Stack>
                        {highlightTrades.map((trade) => (
                          <Stack
                            key={trade.id}
                            spacing={0.2}
                            sx={{
                              borderRadius: 2,
                              bgcolor: "rgba(255,255,255,0.04)",
                              px: 1,
                              py: 0.4,
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
                    </Box>
                  );
                })}
              </Box>
            </Stack>
          </ForgeCard>

          <ForgeCard
            subtitle="JOUR"
            title={selectedDateLabel ? `Focus ${selectedDateLabel}` : "Sélectionne une journée"}
            helper={selectedDayTrades.length ? `${selectedDayTrades.length} trade(s)` : "Aucun trade enregistré"}
            glow
          >
            {selectedDayTrades.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                {selectedDateLabel
                  ? "Aucun trade enregistré pour cette journée."
                  : "Clique sur une case du calendrier pour faire apparaître la liste correspondante."}
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
          </ForgeCard>

          {tradesThisMonth.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              Aucun trade journalisé pour {monthLabel}. Alimente ton journal pour activer cette vue.
            </Typography>
          )}
        </Stack>
      ) : !loading && filteredEntries.length === 0 ? (
        <EmptyState
          title="Rien à afficher pour ces filtres"
          description="Allège les filtres ou lance une nouvelle analyse avec l’assistant TradeForge."
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
                border: (theme) =>
                  `1px solid ${theme.palette.mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.12)"}`,
                background: (theme) =>
                  theme.palette.mode === "dark"
                    ? "linear-gradient(155deg, rgba(6,10,21,0.95), rgba(10,17,34,0.9))"
                    : "linear-gradient(155deg, rgba(255,255,255,0.95), rgba(240,244,255,0.9))",
                boxShadow: (theme) =>
                  theme.palette.mode === "dark" ? "0 30px 60px rgba(0,0,0,0.55)" : "0 25px 45px rgba(15,23,42,0.15)",
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
