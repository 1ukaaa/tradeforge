import {
  Box,
  ButtonBase,
  Pagination,
  Stack,
  Typography,
  alpha,
  useTheme
} from "@mui/material";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { memo, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Treemap,
  XAxis,
  YAxis
} from "recharts";

// ─── Icons ────────────────────────────────────────────────────────
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import TrendingDownRoundedIcon from "@mui/icons-material/TrendingDownRounded";
import TrendingFlatRoundedIcon from "@mui/icons-material/TrendingFlatRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";

// ─── Design Tokens ────────────────────────────────────────────────
const NEON_BLUE = "#4F8EF7";
export const MONO_FONT = `"JetBrains Mono", "SF Mono", "Fira Code", monospace`;

// ─── Helpers ──────────────────────────────────────────────────────
const formatCurrency = (value, currency) => {
  let safe = (currency && typeof currency === "string") ? currency.trim().toUpperCase() : "USD";
  try {
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency: safe, maximumFractionDigits: 2 }).format(value || 0);
  } catch {
    return `${Number(value || 0).toFixed(2)} ${safe}`;
  }
};

// ─────────────────────────────────────────────────────────────────
// GLASS PANEL — theme-aware container
// ─────────────────────────────────────────────────────────────────
export const GlassPanel = ({ children, sx = {}, onClick }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <Box
      onClick={onClick}
      sx={{
        bgcolor: "background.paper",
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: "16px",
        overflow: "hidden",
        backdropFilter: isDark ? "blur(16px)" : "blur(8px)",
        WebkitBackdropFilter: isDark ? "blur(16px)" : "blur(8px)",
        transition: "border-color 0.2s, box-shadow 0.2s",
        ...(onClick && {
          cursor: "pointer",
          "&:hover": {
            borderColor: isDark
              ? alpha("#FFFFFF", 0.16)
              : alpha("#0F172A", 0.18),
          },
        }),
        ...sx,
      }}
    >
      {children}
    </Box>
  );
};

// Section micro-label
const SectionLabel = ({ children }) => (
  <Typography
    sx={{
      fontSize: "0.6rem",
      fontWeight: 700,
      letterSpacing: "0.12em",
      textTransform: "uppercase",
      color: "text.secondary",
      mb: 0.5,
    }}
  >
    {children}
  </Typography>
);

// ─── Tiny Sparkline ───────────────────────────────────────────────
const Sparkline = ({ data = [], color = "#00FF66" }) => (
  <ResponsiveContainer width="100%" height={36}>
    <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
      <defs>
        <linearGradient id={`spark-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <Area
        type="monotone" dataKey="value"
        stroke={color} strokeWidth={1.5}
        fill={`url(#spark-${color.replace("#", "")})`}
        dot={false} isAnimationActive={false}
      />
    </AreaChart>
  </ResponsiveContainer>
);

// ─────────────────────────────────────────────────────────────────
// STAT CARD
// ─────────────────────────────────────────────────────────────────
export const StatCard = memo(({ label, value, type = "number", currency, trend, trendValue, sparkData = [] }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const isPositive = trend === "positive";
  const isNegative = trend === "negative";

  const positiveColor = theme.palette.success.main;
  const negativeColor = theme.palette.error.main;

  const numColor = isPositive ? positiveColor : isNegative ? negativeColor : theme.palette.text.primary;
  const trendColor = isPositive ? positiveColor : isNegative ? negativeColor : theme.palette.text.secondary;

  let formattedValue = value;
  if (type === "currency") formattedValue = formatCurrency(value, currency);
  if (type === "percent") formattedValue = `${Number(value).toFixed(1)}%`;

  const TrendIcon = isPositive ? TrendingUpRoundedIcon : isNegative ? TrendingDownRoundedIcon : TrendingFlatRoundedIcon;

  return (
    <GlassPanel sx={{ p: 2.5, height: "100%" }}>
      <Stack justifyContent="space-between" sx={{ height: "100%" }}>
        <Box>
          <SectionLabel>{label}</SectionLabel>
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mt: 1 }}>
            <Typography sx={{
              fontFamily: MONO_FONT,
              fontSize: "1.4rem",
              fontWeight: 700,
              letterSpacing: "-0.03em",
              color: numColor,
              lineHeight: 1,
              textShadow: (isPositive || isNegative) && isDark
                ? `0 0 18px ${numColor}55`
                : "none",
            }}>
              {formattedValue}
            </Typography>

            {trendValue !== undefined && (isPositive || isNegative) && (
              <Stack direction="row" alignItems="center" spacing={0.3} sx={{
                px: 1, py: 0.3, borderRadius: "6px",
                bgcolor: alpha(trendColor, 0.1),
                border: `1px solid ${alpha(trendColor, 0.22)}`,
              }}>
                <TrendIcon sx={{ fontSize: 12, color: trendColor }} />
                <Typography sx={{ fontFamily: MONO_FONT, fontSize: "0.68rem", fontWeight: 700, color: trendColor }}>
                  {trendValue > 0 ? "+" : ""}{Number(trendValue).toFixed(1)}%
                </Typography>
              </Stack>
            )}
          </Stack>
        </Box>

        {sparkData.length > 1 && (
          <Box sx={{ mt: 1.5, mx: -0.5 }}>
            <Sparkline data={sparkData} color={numColor === theme.palette.text.primary ? theme.palette.success.main : numColor} />
          </Box>
        )}
      </Stack>
    </GlassPanel>
  );
});

// ─────────────────────────────────────────────────────────────────
// PERFORMANCE CHART
// ─────────────────────────────────────────────────────────────────
export const PerformanceChart = memo(({ data, range, onRangeChange, rangeOptions, currency }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const startValue = data.length > 0 ? data[0].value : 0;
  const endValue = data.length > 0 ? data[data.length - 1].value : 0;
  const isProfit = endValue >= startValue;
  const lineColor = isProfit ? theme.palette.success.main : theme.palette.error.main;

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <Box sx={{
        bgcolor: "background.paper",
        border: `1px solid ${alpha(lineColor, 0.35)}`,
        borderRadius: "10px",
        px: 2, py: 1.5,
        boxShadow: isDark
          ? `0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px ${alpha(lineColor, 0.1)}`
          : `0 8px 24px rgba(15,23,42,0.15)`,
      }}>
        <Typography sx={{ color: "text.secondary", fontSize: "0.7rem", fontWeight: 600, mb: 0.5 }}>
          {label}
        </Typography>
        <Typography sx={{ fontFamily: MONO_FONT, fontSize: "1rem", fontWeight: 700, color: lineColor }}>
          {formatCurrency(payload[0].value, currency)}
        </Typography>
      </Box>
    );
  };

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <SectionLabel>Performance</SectionLabel>
          <Typography sx={{ fontWeight: 700, fontSize: "1.05rem", letterSpacing: "-0.02em", color: "text.primary" }}>
            Évolution du Capital
          </Typography>
        </Box>

        {/* Range pills */}
        <Stack direction="row" spacing={0.5} sx={{
          p: 0.5, borderRadius: "10px",
          bgcolor: isDark ? alpha("#FFFFFF", 0.04) : alpha("#0F172A", 0.04),
          border: `1px solid ${theme.palette.divider}`,
        }}>
          {rangeOptions.map((opt) => {
            const active = range === opt.key;
            const pillBg = active ? (isDark ? theme.palette.success.main : theme.palette.secondary.main) : "transparent";
            const pillColor = active ? (isDark ? "#0A0A0A" : "#FFFFFF") : undefined;
            const pillGlow = active && isDark ? `0 0 12px ${theme.palette.success.main}55` : "none";
            return (
              <ButtonBase
                key={opt.key}
                onClick={() => onRangeChange(opt.key)}
                sx={{
                  px: 1.5, py: 0.6, borderRadius: "7px",
                  fontSize: "0.7rem", fontWeight: 700,
                  fontFamily: MONO_FONT, letterSpacing: "0.05em",
                  color: active ? pillColor : "text.secondary",
                  bgcolor: pillBg,
                  boxShadow: pillGlow,
                  transition: "all 0.15s",
                  "&:hover": {
                    color: active ? pillColor : "text.primary",
                    bgcolor: active ? pillBg : isDark ? alpha("#FFFFFF", 0.07) : alpha("#0F172A", 0.07),
                  },
                }}
              >
                {opt.label}
              </ButtonBase>
            );
          })}
        </Stack>
      </Stack>

      {/* Chart */}
      <Box sx={{ flex: 1, width: "100%" }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="capitalGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={lineColor} stopOpacity={isDark ? 0.22 : 0.15} />
                <stop offset="65%" stopColor={lineColor} stopOpacity={isDark ? 0.06 : 0.04} />
                <stop offset="100%" stopColor={lineColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3" vertical={false}
              stroke={isDark ? alpha("#FFFFFF", 0.05) : alpha("#0F172A", 0.07)}
            />
            <XAxis
              dataKey="date" axisLine={false} tickLine={false}
              tick={{ fill: theme.palette.text.secondary, fontSize: 11, fontFamily: MONO_FONT, fontWeight: 500 }}
              dy={8} minTickGap={50}
            />
            <YAxis hide domain={["auto", "auto"]} />
            <RechartsTooltip
              content={<CustomTooltip />}
              cursor={{
                stroke: alpha(lineColor, isDark ? 0.3 : 0.4),
                strokeWidth: 1,
                strokeDasharray: "4 4",
              }}
            />
            <Area
              type="monotone" dataKey="value"
              stroke={lineColor} strokeWidth={2.5}
              fill="url(#capitalGradient)"
              animationDuration={700} dot={false}
              activeDot={{
                r: 5, fill: lineColor, stroke: theme.palette.background.paper, strokeWidth: 2,
                filter: isDark ? `drop-shadow(0 0 8px ${lineColor})` : "none",
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
});

// ─────────────────────────────────────────────────────────────────
// ASSET HEATMAP — dynamic from real trade data
// ─────────────────────────────────────────────────────────────────

// Strip common broker suffixes: USOIL.cash → USOIL, EURUSD_raw → EURUSD
const cleanAssetName = (raw = "") =>
  raw.replace(/[._-](cash|pro|raw|ecn|std|mini|micro|cfds?|spot)$/i, "").toUpperCase();

// Build per-asset aggregates from a trades array
const buildAssetData = (trades = [], initialBalance = 0) => {
  const map = new Map();
  for (const t of trades) {
    const name = cleanAssetName(t.asset || t.symbol || t.pair || "?");
    const pnl = Number(t.pnl) || 0;
    if (!map.has(name)) map.set(name, { name, totalPnl: 0, count: 0, wins: 0 });
    const r = map.get(name);
    r.totalPnl += pnl;
    r.count += 1;
    if (pnl > 0) r.wins += 1;
  }
  const entries = [...map.values()];
  if (!entries.length) return [];
  const totalAbs = entries.reduce((s, e) => s + Math.abs(e.totalPnl), 0) || 1;
  // denominator: initialBalance gives real % gain per asset; fallback = share of total abs PnL
  const denominator = initialBalance > 0 ? initialBalance : totalAbs;
  const sorted = entries
    .map((e) => ({
      ...e,
      size: Math.max(1, Math.round((Math.abs(e.totalPnl) / totalAbs) * 1000)) || e.count,
      winRate: e.count > 0 ? (e.wins / e.count) * 100 : 0,
      pnlPct: (e.totalPnl / denominator) * 100,
    }))
    .sort((a, b) => Math.abs(b.totalPnl) - Math.abs(a.totalPnl));
  return sorted.map((e, i) => ({ ...e, rank: i }));
};

// HeatmapCell — driven entirely by its own props, no global data lookup
const HeatmapCell = (props) => {
  const {
    x, y, width, height,
    name, pnlPct = 0, winRate = 0, rank = 99,
    isDark, positiveColor, negativeColor,
  } = props;
  if (!width || !height || width < 28 || height < 28) return null;

  const positive = pnlPct >= 0;
  const baseColor = positive ? positiveColor : negativeColor;
  const intensity = Math.min(Math.abs(pnlPct) / 50, 1);
  const fillOpacity = (0.10 + intensity * 0.22).toFixed(2);
  const fillColor = `${baseColor}${Math.round(parseFloat(fillOpacity) * 255).toString(16).padStart(2, "0")}`;
  const borderAlpha = Math.round(55 + intensity * 90);
  const strokeColor = `${baseColor}${borderAlpha.toString(16).padStart(2, "0")}`;
  const labelFill = isDark ? "#FFFFFF" : "#0F172A";

  const pnlLabel = (pnlPct >= 0 ? "+" : "") + pnlPct.toFixed(1) + "%";
  const nameFSize = Math.min(width / 4.5, 13);
  const subFSize = Math.min(width / 5.5, 10);
  const showSub = height > 56 && width > 46;
  const showWR = rank < 3 && height > 82 && width > 62;
  const centerY = y + height / 2;
  const nameY = showSub ? centerY - (showWR ? 13 : 8) : centerY;

  return (
    <g>
      <rect
        x={x + 1} y={y + 1} width={width - 2} height={height - 2}
        rx={8} ry={8}
        fill={fillColor} stroke={strokeColor} strokeWidth={1}
      />
      {height > 36 && (
        <>
          <text
            x={x + width / 2} y={nameY}
            textAnchor="middle" dominantBaseline="middle"
            style={{ fontFamily: MONO_FONT, fontSize: nameFSize, fontWeight: 700, fill: labelFill }}
          >
            {name}
          </text>
          {showSub && (
            <text
              x={x + width / 2} y={nameY + nameFSize + 4}
              textAnchor="middle" dominantBaseline="middle"
              style={{ fontFamily: MONO_FONT, fontSize: subFSize, fontWeight: 600, fill: baseColor }}
            >
              {pnlLabel}
            </text>
          )}
          {showWR && (
            <text
              x={x + width / 2} y={nameY + nameFSize + subFSize + 10}
              textAnchor="middle" dominantBaseline="middle"
              style={{ fontFamily: MONO_FONT, fontSize: subFSize - 1, fontWeight: 500, fill: labelFill, opacity: 0.5 }}
            >
              {winRate.toFixed(0)}% WR
            </text>
          )}
        </>
      )}
    </g>
  );
};

export const MarketHeatmap = memo(({ trades = [], initialBalance = 0 }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const positiveColor = theme.palette.success.main;
  const negativeColor = theme.palette.error.main;

  const assetData = useMemo(() => buildAssetData(trades, initialBalance), [trades, initialBalance]);
  const isEmpty = assetData.length === 0;

  const ThemedCell = (props) => (
    <HeatmapCell
      {...props}
      isDark={isDark}
      positiveColor={positiveColor}
      negativeColor={negativeColor}
    />
  );

  return (
    <GlassPanel sx={{ p: 2.5, height: "100%", display: "flex", flexDirection: "column" }}>
      <Box sx={{ mb: 2 }}>
        <SectionLabel>Performances</SectionLabel>
        <Typography sx={{ fontWeight: 700, fontSize: "1.05rem", letterSpacing: "-0.02em", color: "text.primary" }}>
          Performance par Actif
        </Typography>
      </Box>
      <Box sx={{ flex: 1, minHeight: 0 }}>
        {isEmpty ? (
          <Box sx={{
            height: "100%", display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: 1,
          }}>
            <Typography sx={{ fontSize: "0.78rem", color: "text.secondary", fontWeight: 600 }}>
              Aucun trade
            </Typography>
            <Typography sx={{ fontSize: "0.68rem", color: "text.secondary", opacity: 0.6, textAlign: "center", px: 2 }}>
              Les actifs tradés apparaîtront ici
            </Typography>
          </Box>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <Treemap
              data={assetData}
              dataKey="size"
              content={<ThemedCell />}
              isAnimationActive={false}
            >
              {assetData.map((_, i) => <Cell key={`cell-${i}`} />)}
            </Treemap>
          </ResponsiveContainer>
        )}
      </Box>
    </GlassPanel>
  );
});

// ─────────────────────────────────────────────────────────────────
// TRADE HISTORY TABLE
// ─────────────────────────────────────────────────────────────────
export const TradeHistory = memo(({ trades = [], page, setPage, pageSize, accountsMap = new Map() }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const navigate = useNavigate();
  const safeTrades = trades || [];
  const totalPages = Math.ceil(safeTrades.length / pageSize);
  const currentTrades = safeTrades.slice((page - 1) * pageSize, page * pageSize);

  const cols = ["Date", "Paire", "Type", "Entrée", "Sortie", "PnL", "Frais"];
  const gridCols = "1.4fr 1fr 0.7fr 1fr 1fr 1fr 0.8fr";

  const headerColor = isDark ? alpha("#FFFFFF", 0.32) : alpha("#0F172A", 0.4);
  const rowHover = isDark ? alpha("#FFFFFF", 0.025) : alpha("#0F172A", 0.03);
  const rowDivider = isDark ? alpha("#FFFFFF", 0.04) : alpha("#0F172A", 0.06);

  return (
    <GlassPanel sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Head */}
      <Box sx={{ px: 2.5, pt: 2.5, pb: 1.5, borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Box>
            <SectionLabel>Historique</SectionLabel>
            <Typography sx={{ fontWeight: 700, fontSize: "1.05rem", letterSpacing: "-0.02em", color: "text.primary" }}>
              Trade History
            </Typography>
          </Box>
          <ButtonBase
            onClick={() => navigate("/journal")}
            sx={{
              fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.1em",
              textTransform: "uppercase", color: "text.secondary",
              px: 1.5, py: 0.6, borderRadius: "7px",
              border: `1px solid ${theme.palette.divider}`,
              "&:hover": { color: "text.primary", borderColor: isDark ? alpha("#FFFFFF", 0.2) : alpha("#0F172A", 0.22) },
              transition: "all 0.15s",
            }}
          >
            Tout voir
          </ButtonBase>
        </Stack>

        {/* Column headers */}
        <Box sx={{ display: "grid", gridTemplateColumns: gridCols, gap: 1 }}>
          {cols.map((c) => (
            <Typography key={c} sx={{ fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: headerColor }}>
              {c}
            </Typography>
          ))}
        </Box>
      </Box>

      {/* Rows */}
      <Box sx={{ flex: 1, overflowY: "auto" }}>
        {currentTrades.length === 0 ? (
          <Box sx={{ p: 6, textAlign: "center" }}>
            <Typography sx={{ color: "text.secondary", fontSize: "0.9rem" }}>
              Aucun trade à afficher.
            </Typography>
          </Box>
        ) : currentTrades.map((trade, idx) => {
          const isWin = (trade.pnl ?? 0) >= 0;
          const pnlCol = isWin ? theme.palette.success.main : theme.palette.error.main;
          const isLong = trade.direction !== "SELL";

          return (
            <Box
              key={trade.id || idx}
              onClick={() => {
                const accName = accountsMap.get(trade.brokerAccountId)?.name || "";
                const params = new URLSearchParams({
                  tradeId: String(trade.id || trade._id || ""),
                  asset: trade.asset || "",
                  date: trade.date || "",
                  dir: trade.direction || "",
                  pnl: String(trade.pnl ?? 0),
                  account: accName,
                });
                navigate(`/journal?${params.toString()}`);
              }}
              sx={{
                display: "grid", gridTemplateColumns: gridCols, gap: 1,
                alignItems: "center", px: 2.5, py: 1.8,
                borderBottom: `1px solid ${rowDivider}`,
                cursor: "pointer",
                transition: "background 0.12s",
                "&:hover": { bgcolor: rowHover },
                "&:last-child": { borderBottom: "none" },
              }}
            >
              {/* Date */}
              <Typography sx={{ fontFamily: MONO_FONT, fontSize: "0.72rem", color: "text.secondary", fontWeight: 500 }}>
                {trade.date ? format(new Date(trade.date), "dd/MM HH:mm", { locale: fr }) : "—"}
              </Typography>
              {/* Pair */}
              <Typography sx={{ fontFamily: MONO_FONT, fontSize: "0.8rem", fontWeight: 700, color: "text.primary" }}>
                {trade.asset || "—"}
              </Typography>
              {/* Type */}
              <Box sx={{
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                px: 1, py: 0.3, borderRadius: "5px", width: "fit-content",
                fontSize: "0.6rem", fontFamily: MONO_FONT, fontWeight: 700, letterSpacing: "0.06em",
                bgcolor: isLong ? alpha(theme.palette.success.main, 0.10) : alpha(theme.palette.error.main, 0.10),
                color: isLong ? theme.palette.success.main : theme.palette.error.main,
                border: `1px solid ${isLong ? alpha(theme.palette.success.main, 0.28) : alpha(theme.palette.error.main, 0.28)}`,
              }}>
                {isLong ? "LONG" : "SHORT"}
              </Box>
              {/* Entry */}
              <Typography sx={{ fontFamily: MONO_FONT, fontSize: "0.76rem", color: "text.secondary", fontWeight: 500 }}>
                {trade.entryPrice ? Number(trade.entryPrice).toFixed(2) : "—"}
              </Typography>
              {/* Exit */}
              <Typography sx={{ fontFamily: MONO_FONT, fontSize: "0.76rem", color: "text.secondary", fontWeight: 500 }}>
                {trade.exitPrice ? Number(trade.exitPrice).toFixed(2) : "—"}
              </Typography>
              {/* PnL */}
              <Typography sx={{
                fontFamily: MONO_FONT, fontSize: "0.8rem", fontWeight: 800,
                color: pnlCol,
                textShadow: isDark ? `0 0 10px ${pnlCol}45` : "none",
              }}>
                {(trade.pnl ?? 0) >= 0 ? "+" : ""}{(trade.pnl ?? 0).toFixed(2)}
              </Typography>
              {/* Fees */}
              <Typography sx={{ fontFamily: MONO_FONT, fontSize: "0.72rem", color: "text.secondary", fontWeight: 500 }}>
                {trade.fees != null ? Number(trade.fees).toFixed(2) : "—"}
              </Typography>
            </Box>
          );
        })}
      </Box>

      {/* Pagination */}
      {safeTrades.length > pageSize && (
        <Box sx={{ px: 2.5, py: 2, borderTop: `1px solid ${theme.palette.divider}`, display: "flex", justifyContent: "center" }}>
          <Pagination
            count={totalPages} page={page}
            onChange={(_, p) => setPage(p)}
            size="small" shape="rounded"
            sx={{
              "& .MuiPaginationItem-root": {
                color: "text.secondary",
                borderColor: theme.palette.divider,
                fontFamily: MONO_FONT, fontSize: "0.75rem",
              },
              "& .Mui-selected": {
                bgcolor: `${theme.palette.success.main} !important`,
                color: isDark ? "#0A0A0A !important" : "#FFFFFF !important",
                boxShadow: isDark ? `0 0 12px ${theme.palette.success.main}55` : "none",
              },
            }}
          />
        </Box>
      )}
    </GlassPanel>
  );
});

// ─── Legacy alias ──────────────────────────────────────────────────
export const RecentActivity = memo((props) => <TradeHistory {...props} />);

// ─────────────────────────────────────────────────────────────────
// ACCOUNTS LIST (kept for backward compat, not used in main dashboard)
// ─────────────────────────────────────────────────────────────────
export const AccountsList = memo(({ accounts = [], selectedId, onSelect }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <Box>
      <SectionLabel>Comptes</SectionLabel>
      <Typography sx={{ fontWeight: 700, fontSize: "1rem", letterSpacing: "-0.02em", color: "text.primary", mb: 2 }}>
        Mes Comptes
      </Typography>
      <Stack spacing={1.5}>
        {accounts.map((acc) => {
          const isSelected = selectedId === acc.id;
          return (
            <ButtonBase
              key={acc.id}
              onClick={() => onSelect(acc.id)}
              sx={{
                width: "100%", justifyContent: "space-between", p: 2,
                borderRadius: "12px",
                bgcolor: isSelected
                  ? alpha(NEON_BLUE, isDark ? 0.1 : 0.08)
                  : isDark ? alpha("#FFFFFF", 0.04) : alpha("#0F172A", 0.03),
                border: `1px solid ${isSelected ? alpha(NEON_BLUE, 0.35) : theme.palette.divider}`,
                transition: "all 0.15s",
                "&:hover": {
                  bgcolor: isDark ? alpha("#FFFFFF", 0.07) : alpha("#0F172A", 0.06),
                  borderColor: isDark ? alpha("#FFFFFF", 0.15) : alpha("#0F172A", 0.18),
                },
              }}
            >
              <Box sx={{ textAlign: "left" }}>
                <Typography sx={{ fontWeight: 700, fontSize: "0.86rem", color: "text.primary" }}>
                  {acc.name}
                </Typography>
                <Typography sx={{ fontSize: "0.68rem", color: "text.secondary", fontWeight: 500, mt: 0.2 }}>
                  {acc.platform || "MT5"}
                </Typography>
              </Box>
              <Typography sx={{ fontFamily: MONO_FONT, fontWeight: 800, fontSize: "0.9rem", color: "text.primary" }}>
                {formatCurrency(acc.currentBalance, acc.currency)}
              </Typography>
            </ButtonBase>
          );
        })}
      </Stack>
    </Box>
  );
});

// ─────────────────────────────────────────────────────────────────
// GOALS
// ─────────────────────────────────────────────────────────────────
export const Goals = memo(({ current = 0, target = 1, currency }) => {
  const theme = useTheme();
  const safeTarget = target || 1;
  const progress = Math.min(100, Math.max(0, (current / safeTarget) * 100));
  const progressColor = progress >= 100
    ? theme.palette.success.main
    : progress >= 50
      ? theme.palette.secondary.main
      : theme.palette.text.secondary;

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
        <Box>
          <SectionLabel>Objectif</SectionLabel>
          <Typography sx={{ fontWeight: 700, fontSize: "0.86rem", color: "text.primary" }}>Objectif Mensuel</Typography>
        </Box>
        <Typography sx={{ fontFamily: MONO_FONT, fontSize: "0.86rem", fontWeight: 800, color: progressColor }}>
          {progress.toFixed(0)}%
        </Typography>
      </Stack>

      <Stack direction="row" alignItems="baseline" spacing={1} sx={{ mb: 2 }}>
        <Typography sx={{ fontFamily: MONO_FONT, fontSize: "1.2rem", fontWeight: 800, color: "text.primary", letterSpacing: "-0.02em" }}>
          {formatCurrency(current, currency)}
        </Typography>
        <Typography sx={{ fontFamily: MONO_FONT, fontSize: "0.76rem", color: "text.secondary", fontWeight: 600 }}>
          / {formatCurrency(target, currency)}
        </Typography>
      </Stack>

      <Box sx={{ height: 3, borderRadius: 2, bgcolor: theme.palette.divider, overflow: "hidden" }}>
        <Box sx={{
          height: "100%", width: `${progress}%`, bgcolor: progressColor,
          borderRadius: 2,
          boxShadow: theme.palette.mode === "dark" ? `0 0 10px ${progressColor}80` : "none",
          transition: "width 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
        }} />
      </Box>
    </Box>
  );
});

// ─────────────────────────────────────────────────────────────────
// GOAL INSIGHTS
// ─────────────────────────────────────────────────────────────────
export const GoalInsights = memo(({ trades = [] }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  if (!trades.length) return null;

  const lastTrade = trades[0];
  const isWinStreak = trades.slice(0, 3).length === 3 && trades.slice(0, 3).every((t) => t.pnl > 0);

  return (
    <Box sx={{
      p: 2.5, borderRadius: "12px",
      bgcolor: isDark ? alpha("#FFFFFF", 0.04) : alpha("#0F172A", 0.04),
      border: `1px solid ${theme.palette.divider}`,
    }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
        <AutoAwesomeRoundedIcon sx={{ fontSize: 15, color: theme.palette.secondary.main }} />
        <Typography sx={{ fontSize: "0.62rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: theme.palette.secondary.main }}>
          Analyste IA
        </Typography>
      </Stack>
      <Typography sx={{ fontSize: "0.82rem", lineHeight: 1.6, color: "text.secondary", fontWeight: 500 }}>
        {isWinStreak
          ? "Excellente dynamique ! Vous êtes sur une série de 3 gains consécutifs. 🔥"
          : lastTrade?.pnl < 0
            ? "Le dernier trade était une perte. Prenez un moment pour analyser votre plan."
            : "La régularité est la clé du succès. Continuez à suivre votre stratégie."}
      </Typography>
    </Box>
  );
});