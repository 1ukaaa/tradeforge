// frontend/src/utils/timeframeUtils.js
const TIMEFRAME_OPTIONS = ["W", "D", "H4", "H1", "M15", "M5"];

const TIMEFRAME_DISPLAY_LABELS = {
  M: "M",
  W: "W",
  D: "D",
  H4: "H4",
  H1: "H1",
  M15: "M15",
  M5: "M5",
};

const TIMEFRAME_ALIASES = {
  monthly: "M",
  month: "M",
  m1: "M",
  w: "W",
  week: "W",
  weekly: "W",
  w1: "W",
  d: "D",
  day: "D",
  daily: "D",
  d1: "D",
  h4: "H4",
  "4h": "H4",
  h1: "H1",
  "1h": "H1",
  hourly: "H1",
  m15: "M15",
  "15m": "M15",
  m5: "M5",
  "5m": "M5",
};

const CANONICAL_TIMEFRAMES = ["M", "W", "D", "H4", "H1", "M15", "M5"];

const normalizeTimeframeToken = (token) => {
  if (token === undefined || token === null) {
    return null;
  }
  const trimmed = String(token).trim();
  if (!trimmed) {
    return null;
  }
  const lookup = trimmed.toLowerCase();
  if (TIMEFRAME_ALIASES[lookup]) {
    return TIMEFRAME_ALIASES[lookup];
  }
  const upper = trimmed.toUpperCase();
  return CANONICAL_TIMEFRAMES.includes(upper) ? upper : upper;
};

const normalizeTimeframes = (value) => {
  if (value === undefined || value === null) {
    return [];
  }

  const tokens = Array.isArray(value)
    ? value
    : String(value).split(/[\s,/\\]+/);

  const seen = new Set();
  const normalized = [];

  for (const token of tokens) {
    const candidate = normalizeTimeframeToken(token);
    if (!candidate || seen.has(candidate)) continue;
    seen.add(candidate);
    normalized.push(candidate);
  }

  return normalized;
};

const stringifyTimeframes = (value) => {
  return normalizeTimeframes(value).join(" / ");
};

const formatTimeframesForDisplay = (value) => {
  const normalized = normalizeTimeframes(value);
  if (normalized.length === 0) {
    return "";
  }
  return normalized
    .map((token) => TIMEFRAME_DISPLAY_LABELS[token] || token)
    .join(" / ");
};

export {
  TIMEFRAME_OPTIONS,
  normalizeTimeframes,
  stringifyTimeframes,
  formatTimeframesForDisplay,
};
