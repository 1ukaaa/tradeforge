import {
    Avatar,
    Box,
    Button,
    Chip,
    CircularProgress,
    Collapse,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Fade,
    IconButton,
    Tooltip as MuiTooltip,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
    alpha,
    useTheme
} from "@mui/material";
import { useEffect, useState } from "react";
import {
    Area,
    AreaChart,
    CartesianGrid,
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Sector,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ArrowDownwardRoundedIcon from "@mui/icons-material/ArrowDownwardRounded";
import ArrowUpwardRoundedIcon from "@mui/icons-material/ArrowUpwardRounded";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import DeleteIcon from "@mui/icons-material/Delete";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import TrendingDownRoundedIcon from "@mui/icons-material/TrendingDownRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";

import {
    addInvestment,
    deleteInvestment,
    getPortfolioChartData,
} from "../services/investmentClient";
import {
    addTransaction,
    deleteTransaction,
    getTransactions,
} from "../services/transactionClient";

// ─── Constants ────────────────────────────────────────────────────
const MONO_FONT = `"JetBrains Mono", "SF Mono", "Fira Code", monospace`;

// ─── Palette for donut chart slices ───────────────────────────────
const DONUT_COLORS = [
    "#7C5CFC", "#00C9A7", "#FF6B6B", "#FFC542", "#45B7D1",
    "#96CEB4", "#FF8E9B", "#A29BFE", "#00B894", "#FDCB6E",
    "#E17055", "#74B9FF", "#55EFC4", "#FFEAA7", "#DFE6E9",
];

// ─── KPI Card ─────────────────────────────────────────────────────
const StatCard = ({ label, value, type = "currency", currency = "USD", trendValue = null, icon }) => {
    const theme = useTheme();
    const isDark = theme.palette.mode === "dark";
    const isPositive = trendValue !== null && trendValue >= 0;
    const isNegative = trendValue !== null && trendValue < 0;

    const formattedValue =
        type === "currency"
            ? new Intl.NumberFormat("fr-FR", { style: "currency", currency }).format(value || 0)
            : `${value}%`;

    const trendColor = isPositive
        ? theme.palette.success.main
        : isNegative
            ? theme.palette.error.main
            : theme.palette.text.secondary;

    return (
        <Box
            sx={{
                p: 3,
                borderRadius: "20px",
                position: "relative",
                overflow: "hidden",
                bgcolor: isDark ? alpha("#FFFFFF", 0.03) : "#FFFFFF",
                border: `1px solid ${isDark ? alpha("#FFFFFF", 0.07) : alpha("#000", 0.06)}`,
                boxShadow: isDark
                    ? "0 8px 32px rgba(0,0,0,0.25)"
                    : "0 4px 24px rgba(15,23,42,0.06)",
                transition: "transform 0.2s, box-shadow 0.2s",
                "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow: isDark
                        ? "0 12px 40px rgba(0,0,0,0.35)"
                        : "0 8px 32px rgba(15,23,42,0.1)",
                },
            }}
        >
            {/* Background glow accent */}
            <Box
                sx={{
                    position: "absolute",
                    top: -30,
                    right: -30,
                    width: 100,
                    height: 100,
                    borderRadius: "50%",
                    background: trendColor,
                    opacity: isDark ? 0.06 : 0.04,
                    filter: "blur(20px)",
                    pointerEvents: "none",
                }}
            />

            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box>
                    <Typography
                        sx={{
                            fontSize: "0.62rem",
                            fontWeight: 700,
                            letterSpacing: "0.12em",
                            textTransform: "uppercase",
                            color: "text.secondary",
                            mb: 1.5,
                        }}
                    >
                        {label}
                    </Typography>
                    <Typography
                        sx={{
                            fontFamily: MONO_FONT,
                            fontSize: "1.65rem",
                            fontWeight: 800,
                            letterSpacing: "-0.03em",
                            color: "text.primary",
                            lineHeight: 1,
                        }}
                    >
                        {formattedValue}
                    </Typography>
                    {trendValue !== null && (
                        <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 1.5 }}>
                            {isPositive
                                ? <TrendingUpRoundedIcon sx={{ fontSize: 16, color: trendColor }} />
                                : <TrendingDownRoundedIcon sx={{ fontSize: 16, color: trendColor }} />
                            }
                            <Typography
                                sx={{
                                    fontFamily: MONO_FONT,
                                    fontSize: "0.82rem",
                                    fontWeight: 700,
                                    color: trendColor,
                                }}
                            >
                                {isPositive ? "+" : ""}
                                {type === "currency"
                                    ? new Intl.NumberFormat("fr-FR", { style: "currency", currency }).format(trendValue)
                                    : `${trendValue}%`
                                }
                            </Typography>
                        </Stack>
                    )}
                </Box>
            </Stack>
        </Box>
    );
};

// ─── Custom Donut Active Shape ────────────────────────────────────
const renderActiveShape = (props) => {
    const {
        cx, cy, innerRadius, outerRadius, startAngle, endAngle,
        fill, payload, percent, value,
    } = props;

    return (
        <g>
            <text x={cx} y={cy - 18} textAnchor="middle" fill={fill} style={{ fontFamily: MONO_FONT, fontSize: 15, fontWeight: 800 }}>
                {payload.ticker}
            </text>
            <text x={cx} y={cy + 6} textAnchor="middle" fill="#888" style={{ fontSize: 11 }}>
                {(percent * 100).toFixed(1)}%
            </text>
            <text x={cx} y={cy + 24} textAnchor="middle" fill={fill} style={{ fontFamily: MONO_FONT, fontSize: 12, fontWeight: 700 }}>
                {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value)}
            </text>
            <Sector
                cx={cx} cy={cy}
                innerRadius={innerRadius}
                outerRadius={outerRadius + 6}
                startAngle={startAngle}
                endAngle={endAngle}
                fill={fill}
            />
            <Sector
                cx={cx} cy={cy}
                innerRadius={outerRadius + 10}
                outerRadius={outerRadius + 14}
                startAngle={startAngle}
                endAngle={endAngle}
                fill={fill}
                opacity={0.4}
            />
        </g>
    );
};

// ─── Main Component ────────────────────────────────────────────────
export default function Investment() {
    const theme = useTheme();
    const isDark = theme.palette.mode === "dark";

    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState("1y");
    const [currency, setCurrency] = useState("EUR");
    const [cache, setCache] = useState({});
    const [activeDonutIndex, setActiveDonutIndex] = useState(0);
    const [data, setData] = useState({
        investments: [],
        chart: [],
        totalInvested: 0,
        currentPortValue: 0,
    });

    const [openDialog, setOpenDialog] = useState(false);
    const [form, setForm] = useState({
        ticker: "",
        quantity: "",
        average_price: "",
        buy_date: "",
        currency: "USD",
    });

    // Transaction state
    const [expandedRow, setExpandedRow] = useState(null);      // investment id of expanded row
    const [txDialogInv, setTxDialogInv] = useState(null);      // investment object for tx dialog
    const [txForm, setTxForm] = useState({ type: "buy", quantity: "", price: "", currency: "USD", tx_date: "", notes: "" });
    const [txLoading, setTxLoading] = useState(false);
    const [txMap, setTxMap] = useState({});                    // { [investmentId]: transactions[] }
    // const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
    // const [historyFilter, setHistoryFilter] = useState("all"); // 'all' | investmentId
    const [showClosed, setShowClosed] = useState(false);     // toggle closed positions
    const [plShowPct, setPlShowPct] = useState(false);       // toggle P&L: amount vs percent


    const loadData = async (forceRefresh = false) => {
        if (!forceRefresh && cache[period]) {
            setData(cache[period]);
            setLoading(false);
            getPortfolioChartData(period).then(res => {
                setCache(prev => ({ ...prev, [period]: res }));
                if (period === res.periodRequested) setData(res);
            }).catch(() => { });
            return;
        }
        try {
            if (!cache[period]) setLoading(true);
            const res = await getPortfolioChartData(period);
            setCache(prev => ({ ...prev, [period]: res }));
            setData(res);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [period]);

    useEffect(() => {
        let isMounted = true;
        setTimeout(() => {
            if (isMounted && !cache['all']) {
                getPortfolioChartData('all')
                    .then(res => { if (isMounted) setCache(prev => ({ ...prev, all: res })); })
                    .catch(() => { });
            }
        }, 1500);
        return () => { isMounted = false; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const totalPnL = data.currentPortValue - data.totalInvested;
    const eurToUsdRate = data.eurToUsdRate || 1;
    const isUSD = currency === "USD";
    const multiplier = isUSD ? eurToUsdRate : 1;
    const cc = isUSD ? "USD" : "EUR";
    const perfPct = data.totalInvested ? ((totalPnL / data.totalInvested) * 100).toFixed(2) : 0;

    const handleAddInvestment = async () => {
        await addInvestment({
            ticker: form.ticker,
            quantity: parseFloat(form.quantity),
            average_price: parseFloat(form.average_price),
            buy_date: form.buy_date,
            currency: form.currency,
        });
        setOpenDialog(false);
        setForm({ ticker: "", quantity: "", average_price: "", buy_date: "", currency: "USD" });
        setCache({});
        loadData(true);
    };

    const handleDelete = async (id) => {
        await deleteInvestment(id);
        setCache({});
        loadData(true);
    };

    // ── Transaction handlers ──────────────────────────────────────
    const loadTransactions = async (investmentId, force = false) => {
        if (!force && txMap[investmentId]) return; // already cached
        try {
            const txs = await getTransactions(investmentId);
            setTxMap(prev => ({ ...prev, [investmentId]: txs }));
        } catch (e) { console.error(e); }
    };

    const handleExpandRow = (invId) => {
        if (expandedRow === invId) {
            setExpandedRow(null);
        } else {
            setExpandedRow(invId);
            loadTransactions(invId);
        }
    };

    const handleOpenTxDialog = (inv) => {
        const defaultCurrency = (inv.native_currency || inv.currency || "USD").toUpperCase() === "EUR" ? "EUR" : "USD";
        setTxDialogInv(inv);
        setTxForm({ type: "buy", quantity: "", price: "", currency: defaultCurrency, tx_date: "", notes: "" });
    };

    const handleAddTransaction = async () => {
        if (!txDialogInv) return;
        setTxLoading(true);
        try {
            await addTransaction(txDialogInv.id, txForm);
            setTxDialogInv(null);
            // Refresh transactions for this investment
            await loadTransactions(txDialogInv.id, true);
            setCache({});
            loadData(true);
        } catch (e) { console.error(e); }
        setTxLoading(false);
    };

    const handleDeleteTransaction = async (txId, investmentId) => {
        await deleteTransaction(txId);
        await loadTransactions(investmentId, true);
        setCache({});
        loadData(true);
    };

    // Donut chart data
    const donutData = data.investments
        .filter(inv => inv.current_value > 0)
        .map((inv, i) => ({
            ticker: inv.ticker,
            shortName: inv.longName ? (inv.longName.length > 20 ? inv.longName.slice(0, 20) + "…" : inv.longName) : inv.ticker,
            value: (inv.current_value || 0) * multiplier,
            color: DONUT_COLORS[i % DONUT_COLORS.length],
        }));

    const MANUAL_LOGOS = {
        // US Mega-caps
        "GOOGL": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/1024px-Google_%22G%22_logo.svg.png",
        "GOOG": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/1024px-Google_%22G%22_logo.svg.png",
        "AAPL": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Apple_logo_black.svg/1024px-Apple_logo_black.svg.png",
        "AMZN": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Amazon_logo.svg/1024px-Amazon_logo.svg.png",
        "MSFT": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Microsoft_logo.svg/1024px-Microsoft_logo.svg.png",
        "NVDA": "https://upload.wikimedia.org/wikipedia/sco/thumb/2/21/Nvidia_logo.svg/1024px-Nvidia_logo.svg.png",
        "META": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Meta_Platforms_Inc._logo.svg/1024px-Meta_Platforms_Inc._logo.svg.png",
        "TSLA": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Tesla_logo.png/1024px-Tesla_logo.png",
        "NFLX": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Netflix_2015_logo.svg/1024px-Netflix_2015_logo.svg.png",
        "INTC": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/Intel_logo_%282006-2020%29.svg/1024px-Intel_logo_%282006-2020%29.svg.png",
        "AMD": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/AMD_Logo.svg/1024px-AMD_Logo.svg.png",
        "PYPL": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/PayPal_logo.svg/1024px-PayPal_logo.svg.png",
        "SHOP": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Shopify_logo_2018.svg/1024px-Shopify_logo_2018.svg.png",
        "UBER": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Uber_logo_2018.svg/1024px-Uber_logo_2018.svg.png",
        "SPOT": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Spotify_logo_without_text.svg/1024px-Spotify_logo_without_text.svg.png",
        // Gaming
        "TTWO": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Take-Two_Interactive_Logo.svg/320px-Take-Two_Interactive_Logo.svg.png",
        "EA": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Electronic-Arts-Logo.svg/1024px-Electronic-Arts-Logo.svg.png",
        "RBLX": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Roblox_gameicon.svg/1024px-Roblox_gameicon.svg.png",
        // French / European — using Yahoo Finance logo endpoint as most reliable
        "MC.PA": "https://query2.finance.yahoo.com/v1/finance/search?q=MC.PA&quotesCount=1&lang=fr-FR",
        "OR.PA": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/L%27Or%C3%A9al_logo.svg/512px-L%27Or%C3%A9al_logo.svg.png",
        "AI.PA": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Air_Liquide_logo_2017.svg/320px-Air_Liquide_logo_2017.svg.png",
        "TTE.PA": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/TotalEnergies_logo.svg/1024px-TotalEnergies_logo.svg.png",
        "BNP.PA": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/BNP_Paribas_logo.svg/1024px-BNP_Paribas_logo.svg.png",
        "SAN.PA": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Sanofi_logo.svg/1024px-Sanofi_logo.svg.png",
        "SAP.DE": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/SAP_2011_logo.svg/1024px-SAP_2011_logo.svg.png",
        "NOV.DE": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Novo_Nordisk_logo.svg/320px-Novo_Nordisk_logo.svg.png",
        "ESE.PA": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/BNP_Paribas_logo.svg/1024px-BNP_Paribas_logo.svg.png",
    };

    const periods = [
        { label: "1J", value: "1d" },
        { label: "1S", value: "1w" },
        { label: "1M", value: "1m" },
        { label: "YTD", value: "ytd" },
        { label: "1A", value: "1y" },
        { label: "TOUT", value: "all" },
    ];

    // Gradient stop colors
    const accentColor = theme.palette.secondary.main;

    return (
        <Box sx={{ minHeight: "100vh", pb: 6, px: { xs: 2, sm: 3, md: 4 }, pt: { xs: 2, md: 3 } }}>

            {/* ── HEADER ───────────────────────────────────── */}
            <Fade in timeout={400}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
                    <Box>
                        <Typography
                            sx={{
                                fontSize: "0.62rem",
                                fontWeight: 700,
                                letterSpacing: "0.14em",
                                textTransform: "uppercase",
                                color: "text.secondary",
                                mb: 0.5,
                            }}
                        >
                            Portefeuille Boursier
                        </Typography>
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                            <Box
                                sx={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: "10px",
                                    bgcolor: isDark ? alpha(accentColor, 0.15) : alpha(accentColor, 0.1),
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    border: `1px solid ${alpha(accentColor, 0.2)}`,
                                }}
                            >
                                <TrendingUpRoundedIcon sx={{ fontSize: 20, color: accentColor }} />
                            </Box>
                            <Typography
                                sx={{
                                    fontSize: { xs: "1.5rem", md: "1.9rem" },
                                    fontWeight: 800,
                                    letterSpacing: "-0.04em",
                                    color: "text.primary",
                                    lineHeight: 1,
                                }}
                            >
                                Investissements
                            </Typography>
                        </Stack>
                    </Box>

                    <Stack direction="row" spacing={1.5} alignItems="center">
                        {/* EUR / USD toggle */}
                        <Box
                            sx={{
                                display: "flex",
                                borderRadius: "12px",
                                overflow: "hidden",
                                border: `1px solid ${isDark ? alpha("#FFF", 0.1) : alpha("#000", 0.08)}`,
                                bgcolor: isDark ? alpha("#FFF", 0.04) : "#F8FAFC",
                            }}
                        >
                            {["EUR", "USD"].map((cur) => (
                                <Button
                                    key={cur}
                                    onClick={() => setCurrency(cur)}
                                    sx={{
                                        minWidth: 52,
                                        px: 1.5,
                                        py: 0.8,
                                        fontSize: "0.8rem",
                                        fontWeight: 700,
                                        borderRadius: 0,
                                        color: currency === cur ? (isDark ? "#000" : "#FFF") : "text.secondary",
                                        bgcolor: currency === cur ? accentColor : "transparent",
                                        "&:hover": {
                                            bgcolor: currency === cur ? accentColor : isDark ? alpha("#FFF", 0.06) : alpha("#000", 0.04),
                                        },
                                        transition: "all 0.2s",
                                    }}
                                >
                                    {cur === "EUR" ? "€ EUR" : "$ USD"}
                                </Button>
                            ))}
                        </Box>

                        <Button
                            variant="contained"
                            color="secondary"
                            startIcon={<AddRoundedIcon />}
                            onClick={() => setOpenDialog(true)}
                            sx={{
                                borderRadius: "12px",
                                textTransform: "none",
                                fontWeight: 700,
                                fontSize: "0.875rem",
                                px: 2.5,
                                py: 1,
                                boxShadow: isDark ? `0 4px 20px ${alpha(accentColor, 0.45)}` : "none",
                            }}
                        >
                            Ajouter un actif
                        </Button>
                    </Stack>
                </Stack>
            </Fade>

            {loading ? (
                <Box sx={{ py: 20, display: "flex", justifyContent: "center" }}>
                    <CircularProgress color="secondary" />
                </Box>
            ) : (
                <Fade in timeout={600}>
                    <Box>

                        {/* ── KPI CARDS ─────────────────────────────── */}
                        <Box
                            sx={{
                                display: "grid",
                                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(3, 1fr)" },
                                gap: 2,
                                mb: 3,
                            }}
                        >
                            <StatCard
                                label="Valeur du Portefeuille"
                                value={data.currentPortValue * multiplier}
                                trendValue={totalPnL * multiplier}
                                currency={cc}
                            />
                            <StatCard
                                label="Total Investi"
                                value={data.totalInvested * multiplier}
                                currency={cc}
                            />
                            <StatCard
                                label="Performance Globale"
                                value={perfPct}
                                type="percent"
                                trendValue={Number(perfPct)}
                            />
                        </Box>

                        {/* ── DONUT + CHART ROW ─────────────────────── */}
                        <Box
                            sx={{
                                display: "grid",
                                gridTemplateColumns: { xs: "1fr", lg: "380px 1fr" },
                                gap: 2.5,
                                mb: 2.5,
                            }}
                        >
                            {/* Donut Chart */}
                            <Box
                                sx={{
                                    p: 3,
                                    borderRadius: "20px",
                                    bgcolor: isDark ? alpha("#FFFFFF", 0.03) : "#FFFFFF",
                                    border: `1px solid ${isDark ? alpha("#FFF", 0.07) : alpha("#000", 0.06)}`,
                                    boxShadow: isDark ? "0 8px 32px rgba(0,0,0,0.25)" : "0 4px 24px rgba(15,23,42,0.06)",
                                    display: "flex",
                                    flexDirection: "column",
                                }}
                            >
                                <Typography sx={{ fontWeight: 700, fontSize: "0.95rem", color: "text.primary", mb: 0.5 }}>
                                    Répartition du Portefeuille
                                </Typography>
                                <Typography sx={{ fontSize: "0.75rem", color: "text.secondary", mb: 2 }}>
                                    Pondération par valeur de marché
                                </Typography>

                                {donutData.length === 0 ? (
                                    <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", py: 6 }}>
                                        <Typography sx={{ color: "text.secondary", fontSize: "0.875rem" }}>
                                            Aucun actif à afficher
                                        </Typography>
                                    </Box>
                                ) : (
                                    <>
                                        {/* Pie */}
                                        <Box sx={{ height: 240, position: "relative" }}>
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        activeIndex={activeDonutIndex}
                                                        activeShape={renderActiveShape}
                                                        data={donutData}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={72}
                                                        outerRadius={100}
                                                        dataKey="value"
                                                        onMouseEnter={(_, index) => setActiveDonutIndex(index)}
                                                        stroke="none"
                                                    >
                                                        {donutData.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                                        ))}
                                                    </Pie>
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </Box>

                                        {/* Legend - scrollable so it doesn't bloat the card height */}
                                        <Box sx={{
                                            mt: 1, maxHeight: 220, overflowY: "auto", pr: 0.5,
                                            "&::-webkit-scrollbar": { width: 4 },
                                            "&::-webkit-scrollbar-track": { bgcolor: "transparent" },
                                            "&::-webkit-scrollbar-thumb": { bgcolor: isDark ? alpha("#FFF", 0.15) : alpha("#000", 0.12), borderRadius: 2 },
                                        }}>
                                            {donutData.map((entry, i) => {
                                                const pct = data.currentPortValue > 0
                                                    ? ((entry.value / (data.currentPortValue * multiplier)) * 100).toFixed(1)
                                                    : "0.0";
                                                return (
                                                    <Stack
                                                        key={i}
                                                        direction="row"
                                                        alignItems="center"
                                                        justifyContent="space-between"
                                                        onClick={() => setActiveDonutIndex(i)}
                                                        sx={{
                                                            py: 0.9,
                                                            px: 1,
                                                            borderRadius: "8px",
                                                            cursor: "pointer",
                                                            bgcolor: activeDonutIndex === i
                                                                ? isDark ? alpha(entry.color, 0.1) : alpha(entry.color, 0.06)
                                                                : "transparent",
                                                            transition: "background-color 0.15s",
                                                            "&:hover": {
                                                                bgcolor: isDark ? alpha(entry.color, 0.08) : alpha(entry.color, 0.05),
                                                            },
                                                        }}
                                                    >
                                                        <Stack direction="row" alignItems="center" spacing={1.2}>
                                                            <Box
                                                                sx={{
                                                                    width: 10,
                                                                    height: 10,
                                                                    borderRadius: "3px",
                                                                    bgcolor: entry.color,
                                                                    flexShrink: 0,
                                                                }}
                                                            />
                                                            <Typography
                                                                sx={{
                                                                    fontSize: "0.8rem",
                                                                    fontWeight: activeDonutIndex === i ? 700 : 500,
                                                                    color: activeDonutIndex === i ? "text.primary" : "text.secondary",
                                                                    fontFamily: MONO_FONT,
                                                                }}
                                                            >
                                                                {entry.ticker}
                                                            </Typography>
                                                        </Stack>
                                                        <Stack direction="row" spacing={1.5} alignItems="center">
                                                            <Typography
                                                                sx={{
                                                                    fontSize: "0.78rem",
                                                                    fontWeight: 700,
                                                                    color: entry.color,
                                                                    fontFamily: MONO_FONT,
                                                                }}
                                                            >
                                                                {pct}%
                                                            </Typography>
                                                            <Typography
                                                                sx={{
                                                                    fontSize: "0.75rem",
                                                                    color: "text.secondary",
                                                                    fontFamily: MONO_FONT,
                                                                }}
                                                            >
                                                                {new Intl.NumberFormat("fr-FR", { style: "currency", currency: cc, maximumFractionDigits: 0 }).format(entry.value)}
                                                            </Typography>
                                                        </Stack>
                                                    </Stack>
                                                );
                                            })}
                                        </Box>
                                    </>
                                )}
                            </Box>

                            {/* Area Chart */}
                            <Box
                                sx={{
                                    p: 3,
                                    borderRadius: "20px",
                                    bgcolor: isDark ? alpha("#FFFFFF", 0.03) : "#FFFFFF",
                                    border: `1px solid ${isDark ? alpha("#FFF", 0.07) : alpha("#000", 0.06)}`,
                                    boxShadow: isDark ? "0 8px 32px rgba(0,0,0,0.25)" : "0 4px 24px rgba(15,23,42,0.06)",
                                    display: "flex",
                                    flexDirection: "column",
                                }}
                            >
                                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3 }}>
                                    <Box>
                                        <Typography sx={{ fontWeight: 700, fontSize: "0.95rem", color: "text.primary", mb: 0.5 }}>
                                            Évolution du Portefeuille
                                        </Typography>
                                        <Typography sx={{ fontSize: "0.75rem", color: "text.secondary" }}>
                                            Valeur vs Capital Investi
                                        </Typography>
                                    </Box>

                                    {/* Period selector */}
                                    <Stack direction="row" spacing={0.5} sx={{ bgcolor: isDark ? alpha("#FFF", 0.05) : alpha("#000", 0.03), p: 0.5, borderRadius: "10px" }}>
                                        {periods.map((opt) => (
                                            <Button
                                                key={opt.value}
                                                onClick={() => setPeriod(opt.value)}
                                                sx={{
                                                    minWidth: "auto",
                                                    px: 1.5,
                                                    py: 0.5,
                                                    fontSize: "0.72rem",
                                                    fontWeight: period === opt.value ? 800 : 500,
                                                    borderRadius: "7px",
                                                    color: period === opt.value ? (isDark ? "#000" : "#FFF") : "text.secondary",
                                                    bgcolor: period === opt.value ? accentColor : "transparent",
                                                    boxShadow: period === opt.value && isDark ? `0 2px 12px ${alpha(accentColor, 0.5)}` : "none",
                                                    "&:hover": {
                                                        bgcolor: period === opt.value ? accentColor : isDark ? alpha("#FFF", 0.06) : alpha("#000", 0.04),
                                                    },
                                                    transition: "all 0.15s",
                                                }}
                                            >
                                                {opt.label}
                                            </Button>
                                        ))}
                                    </Stack>
                                </Stack>

                                <Box sx={{ flex: 1, minHeight: 0 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart
                                            data={data.chart.map((c) => ({
                                                ...c,
                                                value: c.value * multiplier,
                                                invested: c.invested * multiplier,
                                            }))}
                                            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                                        >
                                            <defs>
                                                <linearGradient id="gradValue" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor={accentColor} stopOpacity={0.35} />
                                                    <stop offset="95%" stopColor={accentColor} stopOpacity={0} />
                                                </linearGradient>
                                                <linearGradient id="gradInvested" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.2} />
                                                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={alpha(theme.palette.divider, 0.5)} />
                                            <XAxis
                                                dataKey="date"
                                                tick={{ fontSize: 11, fill: theme.palette.text.secondary }}
                                                tickFormatter={(str) => {
                                                    const d = new Date(str);
                                                    if (period === "1d" || period === "1w")
                                                        return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
                                                    return `${d.getDate()}/${d.getMonth() + 1}`;
                                                }}
                                                axisLine={false}
                                                tickLine={false}
                                            />
                                            <YAxis
                                                domain={["auto", "auto"]}
                                                tick={{ fontSize: 11, fill: theme.palette.text.secondary }}
                                                axisLine={false}
                                                tickLine={false}
                                                tickFormatter={(val) =>
                                                    new Intl.NumberFormat("fr-FR", { style: "currency", currency: cc, maximumFractionDigits: 0 }).format(val)
                                                }
                                            />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: isDark ? "#1A1A2E" : "#FFFFFF",
                                                    borderRadius: "12px",
                                                    border: `1px solid ${alpha(accentColor, 0.2)}`,
                                                    boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
                                                    padding: "10px 14px",
                                                }}
                                                labelStyle={{ color: theme.palette.text.secondary, fontSize: 11, marginBottom: 6 }}
                                                formatter={(value, name) => [
                                                    new Intl.NumberFormat("fr-FR", { style: "currency", currency: cc }).format(value),
                                                    name,
                                                ]}
                                                labelFormatter={(label) => {
                                                    const d = new Date(label);
                                                    return d.toLocaleDateString("fr-FR", {
                                                        weekday: "long",
                                                        day: "numeric",
                                                        month: "long",
                                                        year: "numeric",
                                                        hour: period === "1d" || period === "1w" ? "2-digit" : undefined,
                                                        minute: period === "1d" || period === "1w" ? "2-digit" : undefined,
                                                    });
                                                }}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="invested"
                                                name="Investi"
                                                stroke="#8884d8"
                                                strokeWidth={1.5}
                                                strokeDasharray="5 3"
                                                fillOpacity={1}
                                                fill="url(#gradInvested)"
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="value"
                                                name="Valeur"
                                                stroke={accentColor}
                                                strokeWidth={2.5}
                                                fillOpacity={1}
                                                fill="url(#gradValue)"
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </Box>
                            </Box>
                        </Box>

                        {/* ── HOLDINGS TABLE ────────────────────────── */}
                        <Box
                            sx={{
                                borderRadius: "20px",
                                bgcolor: isDark ? alpha("#FFFFFF", 0.03) : "#FFFFFF",
                                border: `1px solid ${isDark ? alpha("#FFF", 0.07) : alpha("#000", 0.06)}`,
                                boxShadow: isDark ? "0 8px 32px rgba(0,0,0,0.25)" : "0 4px 24px rgba(15,23,42,0.06)",
                                overflow: "hidden",
                            }}
                        >
                            {/* Table Header */}
                            <Stack
                                direction="row"
                                alignItems="center"
                                justifyContent="space-between"
                                sx={{ px: 3, pt: 3, pb: 2, borderBottom: `1px solid ${theme.palette.divider}` }}
                            >
                                <Stack direction="row" alignItems="center" spacing={1.5}>
                                    <Typography sx={{ fontWeight: 700, fontSize: "0.95rem", color: "text.primary" }}>
                                        Actifs Détenus
                                    </Typography>
                                    {data.investments.length > 0 && (
                                        <Chip
                                            label={data.investments.length}
                                            size="small"
                                            sx={{
                                                bgcolor: isDark ? alpha(accentColor, 0.15) : alpha(accentColor, 0.1),
                                                color: accentColor,
                                                fontWeight: 800,
                                                fontSize: "0.72rem",
                                                height: 22,
                                            }}
                                        />
                                    )}
                                </Stack>
                            </Stack>

                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow
                                            sx={{
                                                "& th": {
                                                    color: "text.secondary",
                                                    fontWeight: 600,
                                                    fontSize: "0.72rem",
                                                    letterSpacing: "0.06em",
                                                    textTransform: "uppercase",
                                                    borderBottom: `1px solid ${theme.palette.divider}`,
                                                    py: 1.5,
                                                    bgcolor: isDark ? alpha("#FFF", 0.015) : alpha("#000", 0.015),
                                                },
                                            }}
                                        >
                                            <TableCell sx={{ pl: 3 }}>Actif</TableCell>
                                            <TableCell align="right">Quantité</TableCell>
                                            <TableCell align="right">PRU</TableCell>
                                            <TableCell align="right">Prix Actuel</TableCell>
                                            <TableCell align="right">Valeur</TableCell>
                                            <TableCell align="right">+/- Value</TableCell>
                                            <TableCell align="right">Poids</TableCell>
                                            <TableCell align="center" sx={{ pr: 3 }}>Actions</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {data.investments.filter(i => i.quantity > 0).map((inv, idx) => {
                                            const logoUrl = MANUAL_LOGOS[inv.ticker]
                                                || (inv.website ? `https://logo.clearbit.com/${inv.website}` : null);
                                            const isPos = (inv.profit_loss || 0) >= 0;
                                            const weight = data.currentPortValue > 0
                                                ? ((inv.current_value / data.currentPortValue) * 100).toFixed(1)
                                                : "0.0";
                                            const dotColor = DONUT_COLORS[idx % DONUT_COLORS.length];
                                            const isExpanded = expandedRow === inv.id;
                                            const txs = txMap[inv.id] || [];
                                            const txCount = txs.length;

                                            return (
                                                <>
                                                    {/* ── Main row ─────────────────────── */}
                                                    <TableRow
                                                        key={inv.id}
                                                        sx={{
                                                            "& td": {
                                                                borderBottom: isExpanded ? "none" : `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                                                                py: 1.8,
                                                                fontFamily: MONO_FONT,
                                                                fontSize: "0.85rem",
                                                            },
                                                            "&:last-child td": { borderBottom: "none" },
                                                            "&:hover": {
                                                                bgcolor: isDark ? alpha("#FFFFFF", 0.025) : alpha("#000", 0.018),
                                                            },
                                                            bgcolor: isExpanded ? (isDark ? alpha(dotColor, 0.04) : alpha(dotColor, 0.025)) : "transparent",
                                                            transition: "background-color 0.15s",
                                                        }}
                                                    >
                                                        <TableCell sx={{ pl: 3, minWidth: 210, fontFamily: "inherit" }}>
                                                            <Stack direction="row" alignItems="center" spacing={1.8}>
                                                                {/* Expand arrow */}
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() => handleExpandRow(inv.id)}
                                                                    sx={{
                                                                        p: 0.3,
                                                                        color: isExpanded ? dotColor : "text.disabled",
                                                                        transition: "transform 0.2s, color 0.2s",
                                                                        transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
                                                                    }}
                                                                >
                                                                    <ChevronRightIcon sx={{ fontSize: 18 }} />
                                                                </IconButton>

                                                                {/* Color dot */}
                                                                <Box sx={{ width: 4, height: 36, borderRadius: "2px", bgcolor: dotColor, flexShrink: 0 }} />

                                                                <Avatar
                                                                    src={logoUrl}
                                                                    sx={{
                                                                        width: 38, height: 38,
                                                                        bgcolor: isDark ? alpha(dotColor, 0.12) : alpha(dotColor, 0.08),
                                                                        color: dotColor,
                                                                        fontWeight: 800,
                                                                        fontSize: "1rem",
                                                                        border: `1px solid ${alpha(dotColor, 0.25)}`,
                                                                    }}
                                                                >
                                                                    {inv.ticker.slice(0, 1)}
                                                                </Avatar>

                                                                <Box>
                                                                    <Typography sx={{ fontWeight: 800, fontSize: "0.9rem", color: "text.primary", fontFamily: MONO_FONT }}>
                                                                        {inv.ticker}
                                                                    </Typography>
                                                                    <Typography sx={{ fontSize: "0.72rem", color: "text.secondary", fontWeight: 400, mt: 0.2 }}>
                                                                        {inv.longName && inv.longName !== inv.ticker
                                                                            ? inv.longName.length > 22 ? inv.longName.slice(0, 22) + "…" : inv.longName
                                                                            : "Action / ETF"}
                                                                    </Typography>
                                                                </Box>
                                                            </Stack>
                                                        </TableCell>

                                                        <TableCell align="right">
                                                            {inv.quantity.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                                                        </TableCell>
                                                        <TableCell align="right">
                                                            {new Intl.NumberFormat("fr-FR", { style: "currency", currency: cc }).format(inv.average_price * multiplier)}
                                                        </TableCell>
                                                        <TableCell align="right">
                                                            {new Intl.NumberFormat("fr-FR", { style: "currency", currency: cc }).format((inv.current_price || 0) * multiplier)}
                                                        </TableCell>
                                                        <TableCell align="right" sx={{ fontWeight: 700, color: "text.primary" }}>
                                                            {new Intl.NumberFormat("fr-FR", { style: "currency", currency: cc }).format((inv.current_value || 0) * multiplier)}
                                                        </TableCell>

                                                        <TableCell align="right">
                                                            <Box sx={{ display: "inline-flex", flexDirection: "column", alignItems: "flex-end" }}>
                                                                <Typography sx={{ fontFamily: MONO_FONT, fontWeight: 700, fontSize: "0.85rem", color: isPos ? "success.main" : "error.main" }}>
                                                                    {isPos ? "+" : ""}
                                                                    {new Intl.NumberFormat("fr-FR", { style: "currency", currency: cc }).format((inv.profit_loss || 0) * multiplier)}
                                                                </Typography>
                                                                <Typography sx={{ fontFamily: MONO_FONT, fontWeight: 600, fontSize: "0.72rem", color: isPos ? alpha(theme.palette.success.main, 0.7) : alpha(theme.palette.error.main, 0.7) }}>
                                                                    {isPos ? "+" : ""}{(inv.profit_loss_pct || 0).toFixed(2)}%
                                                                </Typography>
                                                            </Box>
                                                        </TableCell>

                                                        {/* Weight */}
                                                        <TableCell align="right">
                                                            <Stack alignItems="flex-end" spacing={0.5}>
                                                                <Typography sx={{ fontFamily: MONO_FONT, fontSize: "0.82rem", fontWeight: 700, color: dotColor }}>
                                                                    {weight}%
                                                                </Typography>
                                                                <Box sx={{ width: 60, height: 4, borderRadius: "2px", bgcolor: isDark ? alpha("#FFF", 0.05) : alpha("#000", 0.05), overflow: "hidden" }}>
                                                                    <Box sx={{ width: `${weight}%`, height: "100%", bgcolor: dotColor, borderRadius: "2px" }} />
                                                                </Box>
                                                            </Stack>
                                                        </TableCell>

                                                        {/* Actions */}
                                                        <TableCell align="center" sx={{ pr: 3 }}>
                                                            <Stack direction="row" spacing={0.5} justifyContent="center">
                                                                {/* Add Transaction button */}
                                                                <MuiTooltip title="Ajouter une transaction" placement="top">
                                                                    <IconButton
                                                                        size="small"
                                                                        onClick={() => handleOpenTxDialog(inv)}
                                                                        sx={{
                                                                            borderRadius: "8px",
                                                                            color: dotColor,
                                                                            bgcolor: alpha(dotColor, 0.08),
                                                                            "&:hover": { bgcolor: alpha(dotColor, 0.18) },
                                                                        }}
                                                                    >
                                                                        <AddRoundedIcon fontSize="small" />
                                                                    </IconButton>
                                                                </MuiTooltip>

                                                                {/* Expand history button with count badge */}
                                                                <MuiTooltip title={`Historique (${txCount} tx)`} placement="top">
                                                                    <IconButton
                                                                        size="small"
                                                                        onClick={() => handleExpandRow(inv.id)}
                                                                        sx={{
                                                                            borderRadius: "8px",
                                                                            color: isExpanded ? dotColor : "text.secondary",
                                                                            bgcolor: isExpanded ? alpha(dotColor, 0.1) : "transparent",
                                                                            "&:hover": { bgcolor: alpha(dotColor, 0.1) },
                                                                            position: "relative",
                                                                        }}
                                                                    >
                                                                        <HistoryRoundedIcon fontSize="small" />
                                                                        {txCount > 0 && (
                                                                            <Box sx={{
                                                                                position: "absolute", top: 1, right: 1,
                                                                                width: 14, height: 14, borderRadius: "50%",
                                                                                bgcolor: dotColor, color: "#FFF",
                                                                                fontSize: 9, fontWeight: 800,
                                                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                                            }}>
                                                                                {txCount}
                                                                            </Box>
                                                                        )}
                                                                    </IconButton>
                                                                </MuiTooltip>

                                                                <MuiTooltip title="Supprimer la position" placement="top">
                                                                    <IconButton
                                                                        size="small"
                                                                        color="error"
                                                                        onClick={() => handleDelete(inv.id)}
                                                                        sx={{
                                                                            opacity: 0.45,
                                                                            borderRadius: "8px",
                                                                            "&:hover": { opacity: 1, bgcolor: alpha(theme.palette.error.main, 0.1) },
                                                                        }}
                                                                    >
                                                                        <DeleteIcon fontSize="small" />
                                                                    </IconButton>
                                                                </MuiTooltip>
                                                            </Stack>
                                                        </TableCell>
                                                    </TableRow>

                                                    {/* ── Expanded: Transaction History ── */}
                                                    <TableRow key={`${inv.id}-detail`}>
                                                        <TableCell colSpan={8} sx={{ p: 0, border: "none" }}>
                                                            <Collapse in={isExpanded} timeout={250} unmountOnExit>
                                                                <Box
                                                                    sx={{
                                                                        mx: 3, mb: 2, mt: 0.5,
                                                                        borderRadius: "14px",
                                                                        border: `1px solid ${alpha(dotColor, 0.2)}`,
                                                                        bgcolor: isDark ? alpha(dotColor, 0.04) : alpha(dotColor, 0.02),
                                                                        overflow: "hidden",
                                                                    }}
                                                                >
                                                                    {/* Header */}
                                                                    <Stack
                                                                        direction="row"
                                                                        alignItems="center"
                                                                        justifyContent="space-between"
                                                                        sx={{ px: 2.5, py: 1.5, borderBottom: `1px solid ${alpha(dotColor, 0.12)}` }}
                                                                    >
                                                                        <Stack direction="row" alignItems="center" spacing={1}>
                                                                            <HistoryRoundedIcon sx={{ fontSize: 16, color: dotColor }} />
                                                                            <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, color: dotColor }}>
                                                                                Historique des transactions — {inv.ticker}
                                                                            </Typography>
                                                                        </Stack>
                                                                        <Button
                                                                            size="small"
                                                                            startIcon={<AddRoundedIcon />}
                                                                            onClick={() => handleOpenTxDialog(inv)}
                                                                            sx={{
                                                                                fontSize: "0.72rem",
                                                                                fontWeight: 700,
                                                                                borderRadius: "8px",
                                                                                color: dotColor,
                                                                                bgcolor: alpha(dotColor, 0.1),
                                                                                "&:hover": { bgcolor: alpha(dotColor, 0.18) },
                                                                                px: 1.5, py: 0.4,
                                                                            }}
                                                                        >
                                                                            Nouvelle transaction
                                                                        </Button>
                                                                    </Stack>

                                                                    {/* Transaction list */}
                                                                    {txs.length === 0 ? (
                                                                        <Box sx={{ py: 3, textAlign: "center" }}>
                                                                            <Typography sx={{ fontSize: "0.8rem", color: "text.secondary" }}>
                                                                                Aucune transaction enregistrée.
                                                                            </Typography>
                                                                            <Typography sx={{ fontSize: "0.72rem", color: "text.secondary", opacity: 0.6, mt: 0.5 }}>
                                                                                Cliquez sur "Nouvelle transaction" pour commencer l'historique.
                                                                            </Typography>
                                                                        </Box>
                                                                    ) : (
                                                                        <Table size="small">
                                                                            <TableHead>
                                                                                <TableRow>
                                                                                    {["Type", "Date", "Quantité", "Prix", "Montant", "Gain / Perte", ""].map(h => (
                                                                                        <TableCell
                                                                                            key={h}
                                                                                            sx={{
                                                                                                fontSize: "0.68rem",
                                                                                                fontWeight: 700,
                                                                                                color: "text.secondary",
                                                                                                textTransform: "uppercase",
                                                                                                letterSpacing: "0.06em",
                                                                                                py: 0.8,
                                                                                                border: "none",
                                                                                                bgcolor: "transparent",
                                                                                                "&:first-of-type": { pl: 2.5 },
                                                                                                "&:last-of-type": { pr: 1.5 },
                                                                                            }}
                                                                                        >
                                                                                            {h}
                                                                                        </TableCell>
                                                                                    ))}
                                                                                </TableRow>
                                                                            </TableHead>
                                                                            <TableBody>
                                                                                {txs.map((tx) => {
                                                                                    const isBuy = tx.type === "buy";
                                                                                    const txColor = isBuy ? theme.palette.success.main : theme.palette.error.main;
                                                                                    const txQty = parseFloat(tx.quantity);
                                                                                    const txPrice = parseFloat(tx.price);
                                                                                    const txCur = (tx.currency || "EUR").toUpperCase();
                                                                                    const txAmount = txQty * txPrice;

                                                                                    // Gain/Perte calculation
                                                                                    let plValue = null;
                                                                                    let plLabel = null;
                                                                                    if (isBuy) {
                                                                                        // Latent gain: (current price EUR - buy price EUR) × qty
                                                                                        const txPriceEur = txCur === "EUR" ? txPrice
                                                                                            : txPrice / (data.eurToUsdRate || 1.05);
                                                                                        const currentPriceEur = parseFloat(inv.current_price) || 0;
                                                                                        plValue = (currentPriceEur - txPriceEur) * txQty;
                                                                                        plLabel = "Latent";
                                                                                    } else {
                                                                                        // Realized: extract from notes
                                                                                        const notesStr = tx.notes || "";
                                                                                        const match = notesStr.match(/([+-]?[\d.,]+)\s*(EUR|USD|€|\$)/i);
                                                                                        if (match) {
                                                                                            plValue = parseFloat(match[1].replace(",", "."));
                                                                                            // If the notes say 'perte' or value is negative keep it negative
                                                                                            if (/perte/i.test(notesStr) && plValue > 0) plValue = -plValue;
                                                                                        }
                                                                                        plLabel = "Réalisé";
                                                                                    }
                                                                                    const plPositive = plValue !== null && plValue >= 0;
                                                                                    // % calculation: plValue / cost × 100
                                                                                    const txPriceEurForPct = txCur === "EUR" ? txPrice : txPrice / (data.eurToUsdRate || 1.05);
                                                                                    const plCost = txQty * txPriceEurForPct;
                                                                                    const plPct = plCost !== 0 && plValue !== null ? (plValue / plCost) * 100 : null;
                                                                                    return (
                                                                                        <TableRow
                                                                                            key={tx.id}
                                                                                            sx={{
                                                                                                "& td": { border: "none", py: 0.8, fontFamily: MONO_FONT, fontSize: "0.8rem" },
                                                                                                "&:hover": { bgcolor: isDark ? alpha("#FFF", 0.02) : alpha("#000", 0.015) },
                                                                                            }}
                                                                                        >
                                                                                            <TableCell sx={{ pl: 2.5 }}>
                                                                                                <Stack direction="row" alignItems="center" spacing={0.8}>
                                                                                                    <Box sx={{
                                                                                                        display: "flex", alignItems: "center", justifyContent: "center",
                                                                                                        width: 22, height: 22, borderRadius: "50%",
                                                                                                        bgcolor: alpha(txColor, 0.12), color: txColor,
                                                                                                    }}>
                                                                                                        {isBuy ? <ArrowUpwardRoundedIcon sx={{ fontSize: 13 }} /> : <ArrowDownwardRoundedIcon sx={{ fontSize: 13 }} />}
                                                                                                    </Box>
                                                                                                    <Typography sx={{ fontWeight: 700, fontSize: "0.78rem", color: txColor, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                                                                                                        {isBuy ? "Achat" : "Vente"}
                                                                                                    </Typography>
                                                                                                </Stack>
                                                                                            </TableCell>
                                                                                            <TableCell sx={{ color: "text.secondary" }}>
                                                                                                {tx.tx_date ? new Date(tx.tx_date).toLocaleDateString("fr-FR") : "—"}
                                                                                            </TableCell>
                                                                                            <TableCell>
                                                                                                {txQty.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                                                                                            </TableCell>
                                                                                            <TableCell>
                                                                                                {new Intl.NumberFormat("fr-FR", { style: "currency", currency: txCur }).format(txPrice)}
                                                                                            </TableCell>
                                                                                            <TableCell sx={{ fontWeight: 700, color: isBuy ? "error.main" : "success.main" }}>
                                                                                                {isBuy ? "-" : "+"}{new Intl.NumberFormat("fr-FR", { style: "currency", currency: txCur }).format(txAmount)}
                                                                                            </TableCell>
                                                                                            <TableCell>
                                                                                                {plValue !== null ? (
                                                                                                    <Box
                                                                                                        onClick={() => setPlShowPct(v => !v)}
                                                                                                        sx={{
                                                                                                            display: "inline-flex", alignItems: "center", gap: 0.4,
                                                                                                            px: 1, py: 0.25, borderRadius: "6px", cursor: "pointer",
                                                                                                            bgcolor: alpha(plPositive ? theme.palette.success.main : theme.palette.error.main, 0.1),
                                                                                                            transition: "all 0.15s",
                                                                                                            "&:hover": { bgcolor: alpha(plPositive ? theme.palette.success.main : theme.palette.error.main, 0.18) },
                                                                                                        }}
                                                                                                    >
                                                                                                        <Typography sx={{
                                                                                                            fontSize: "0.72rem", fontWeight: 700, fontFamily: MONO_FONT,
                                                                                                            color: plPositive ? theme.palette.success.main : theme.palette.error.main,
                                                                                                            transition: "all 0.15s",
                                                                                                        }}>
                                                                                                            {plShowPct && plPct !== null
                                                                                                                ? `${plPositive ? "+" : ""}${plPct.toFixed(1)}%`
                                                                                                                : `${plPositive ? "+" : ""}${new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", signDisplay: "never" }).format(Math.abs(plValue))}`
                                                                                                            }
                                                                                                        </Typography>
                                                                                                        <Typography sx={{ fontSize: "0.6rem", color: "text.disabled", fontWeight: 600 }}>
                                                                                                            {plLabel}
                                                                                                        </Typography>
                                                                                                    </Box>
                                                                                                ) : <Typography sx={{ fontSize: "0.75rem", color: "text.disabled" }}>—</Typography>}
                                                                                            </TableCell>
                                                                                            <TableCell sx={{ pr: 1.5 }}>
                                                                                                <IconButton
                                                                                                    size="small"
                                                                                                    onClick={() => handleDeleteTransaction(tx.id, inv.id)}
                                                                                                    sx={{ opacity: 0.35, "&:hover": { opacity: 1, color: "error.main" } }}
                                                                                                >
                                                                                                    <DeleteIcon sx={{ fontSize: 14 }} />
                                                                                                </IconButton>
                                                                                            </TableCell>
                                                                                        </TableRow>
                                                                                    );
                                                                                })}
                                                                            </TableBody>
                                                                        </Table>
                                                                    )}
                                                                </Box>
                                                            </Collapse>
                                                        </TableCell>
                                                    </TableRow>
                                                </>
                                            );
                                        })}

                                        {data.investments.filter(i => i.quantity > 0).length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={8} align="center" sx={{ py: 7, color: "text.secondary" }}>
                                                    <Stack alignItems="center" spacing={1}>
                                                        <TrendingUpRoundedIcon sx={{ fontSize: 36, color: alpha(accentColor, 0.3) }} />
                                                        <Typography sx={{ fontSize: "0.9rem", fontWeight: 600, color: "text.secondary" }}>
                                                            Aucun actif dans le portefeuille
                                                        </Typography>
                                                        <Typography sx={{ fontSize: "0.78rem", color: "text.secondary" }}>
                                                            Cliquez sur "Ajouter un actif" pour commencer
                                                        </Typography>
                                                    </Stack>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>

                            {/* ── Closed positions section ── */}
                            {data.investments.filter(i => i.quantity === 0).length > 0 && (
                                <Box sx={{ px: 3, pb: 2 }}>
                                    <Button
                                        size="small"
                                        onClick={() => setShowClosed(v => !v)}
                                        endIcon={<ChevronRightIcon sx={{ transform: showClosed ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s", fontSize: 16 }} />}
                                        sx={{
                                            mt: 1, mb: showClosed ? 1.5 : 0,
                                            fontSize: "0.75rem", fontWeight: 700,
                                            color: "text.secondary",
                                            borderRadius: "10px",
                                            bgcolor: isDark ? alpha("#FFF", 0.04) : alpha("#000", 0.04),
                                            px: 1.5, py: 0.6,
                                            "&:hover": { bgcolor: isDark ? alpha("#FFF", 0.08) : alpha("#000", 0.07) },
                                            transition: "all 0.2s",
                                        }}
                                    >
                                        📦 {data.investments.filter(i => i.quantity === 0).length} position{data.investments.filter(i => i.quantity === 0).length > 1 ? "s" : ""} clôturée{data.investments.filter(i => i.quantity === 0).length > 1 ? "s" : ""}
                                    </Button>

                                    <Collapse in={showClosed} timeout={250}>
                                        <Table size="small">
                                            <TableBody>
                                                {data.investments.filter(i => i.quantity === 0).map((inv, idx) => {
                                                    // const dotColor = "#888";
                                                    const isExpanded = expandedRow === inv.id;
                                                    const txs = txMap[inv.id] || [];
                                                    const txCount = txs.length;
                                                    // Compute realized P&L from transactions
                                                    let realizedStr = "";
                                                    if (txs.length > 0) {
                                                        const sellTx = txs.filter(t => t.type === "sell");
                                                        if (sellTx.length > 0 && sellTx[0].notes) {
                                                            realizedStr = sellTx[0].notes;
                                                        }
                                                    }
                                                    return (
                                                        <>
                                                            <TableRow
                                                                key={inv.id}
                                                                sx={{
                                                                    "& td": {
                                                                        borderBottom: isExpanded ? "none" : `1px solid ${alpha(theme.palette.divider, 0.3)}`,
                                                                        py: 1.2, fontFamily: MONO_FONT, fontSize: "0.82rem",
                                                                        color: "text.secondary", opacity: 0.75,
                                                                    },
                                                                    "&:hover": { bgcolor: isDark ? alpha("#FFF", 0.02) : alpha("#000", 0.01), "& td": { opacity: 1 } },
                                                                    bgcolor: isExpanded ? (isDark ? alpha("#FFF", 0.03) : alpha("#000", 0.02)) : "transparent",
                                                                }}
                                                            >
                                                                <TableCell sx={{ pl: 3, minWidth: 210 }}>
                                                                    <Stack direction="row" alignItems="center" spacing={1.5}>
                                                                        <IconButton
                                                                            size="small"
                                                                            onClick={() => handleExpandRow(inv.id)}
                                                                            sx={{
                                                                                p: 0.3, color: isExpanded ? accentColor : "text.disabled",
                                                                                transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
                                                                                transition: "transform 0.2s",
                                                                            }}
                                                                        >
                                                                            <ChevronRightIcon sx={{ fontSize: 16 }} />
                                                                        </IconButton>
                                                                        <Avatar sx={{ width: 30, height: 30, bgcolor: alpha("#888", 0.1), color: "#888", fontSize: "0.75rem", fontWeight: 700 }}>
                                                                            {inv.ticker.slice(0, 1)}
                                                                        </Avatar>
                                                                        <Box>
                                                                            <Typography sx={{ fontWeight: 700, fontSize: "0.82rem", color: "text.secondary", fontFamily: MONO_FONT, textDecoration: "line-through" }}>
                                                                                {inv.ticker}
                                                                            </Typography>
                                                                            <Typography sx={{ fontSize: "0.68rem", color: "text.disabled" }}>Position clôturée</Typography>
                                                                        </Box>
                                                                    </Stack>
                                                                </TableCell>
                                                                <TableCell align="right" colSpan={5}>
                                                                    <Typography sx={{ fontSize: "0.72rem", color: "text.secondary", fontFamily: MONO_FONT }}>
                                                                        {realizedStr || "Historique disponible"}
                                                                    </Typography>
                                                                </TableCell>
                                                                <TableCell />
                                                                <TableCell align="center" sx={{ pr: 3 }}>
                                                                    <MuiTooltip title={`Historique (${txCount} tx)`} placement="top">
                                                                        <IconButton
                                                                            size="small"
                                                                            onClick={() => handleExpandRow(inv.id)}
                                                                            sx={{ color: isExpanded ? accentColor : "text.disabled", borderRadius: "8px" }}
                                                                        >
                                                                            <HistoryRoundedIcon sx={{ fontSize: 16 }} />
                                                                            {txCount > 0 && (
                                                                                <Box sx={{ position: "absolute", top: 1, right: 1, width: 12, height: 12, borderRadius: "50%", bgcolor: "text.disabled", color: "#FFF", fontSize: 8, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                                                    {txCount}
                                                                                </Box>
                                                                            )}
                                                                        </IconButton>
                                                                    </MuiTooltip>
                                                                    <MuiTooltip title="Supprimer" placement="top">
                                                                        <IconButton size="small" color="error" onClick={() => handleDelete(inv.id)} sx={{ opacity: 0.3, borderRadius: "8px", "&:hover": { opacity: 1 } }}>
                                                                            <DeleteIcon sx={{ fontSize: 14 }} />
                                                                        </IconButton>
                                                                    </MuiTooltip>
                                                                </TableCell>
                                                            </TableRow>

                                                            {/* Expanded tx history */}
                                                            <TableRow key={`${inv.id}-closed-detail`}>
                                                                <TableCell colSpan={8} sx={{ p: 0, border: "none" }}>
                                                                    <Collapse in={isExpanded} timeout={250} unmountOnExit>
                                                                        <Box sx={{ mx: 3, mb: 2, mt: 0.5, borderRadius: "12px", border: `1px solid ${alpha("#888", 0.15)}`, bgcolor: isDark ? alpha("#FFF", 0.02) : alpha("#000", 0.015), overflow: "hidden" }}>
                                                                            <Stack direction="row" alignItems="center" spacing={1} sx={{ px: 2, py: 1.2, borderBottom: `1px solid ${alpha("#888", 0.1)}` }}>
                                                                                <HistoryRoundedIcon sx={{ fontSize: 14, color: "text.secondary" }} />
                                                                                <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: "text.secondary" }}>
                                                                                    Historique — {inv.ticker} (position clôturée)
                                                                                </Typography>
                                                                            </Stack>
                                                                            {txs.length === 0 ? (
                                                                                <Box sx={{ py: 2, textAlign: "center" }}>
                                                                                    <Typography sx={{ fontSize: "0.75rem", color: "text.secondary" }}>Aucune transaction.</Typography>
                                                                                </Box>
                                                                            ) : (
                                                                                <Table size="small">
                                                                                    <TableHead>
                                                                                        <TableRow>
                                                                                            {["Type", "Date", "Quantité", "Prix", "Montant", "Gain / Perte", ""].map(h => (
                                                                                                <TableCell key={h} sx={{ fontSize: "0.65rem", fontWeight: 700, color: "text.disabled", textTransform: "uppercase", letterSpacing: "0.06em", py: 0.6, border: "none", "&:first-of-type": { pl: 2 }, "&:last-of-type": { pr: 1 } }}>{h}</TableCell>
                                                                                            ))}
                                                                                        </TableRow>
                                                                                    </TableHead>
                                                                                    <TableBody>
                                                                                        {txs.map((tx) => {
                                                                                            const isBuy = tx.type === "buy";
                                                                                            const txColor = isBuy ? theme.palette.success.main : theme.palette.error.main;
                                                                                            const txQty = parseFloat(tx.quantity);
                                                                                            const txPrice = parseFloat(tx.price);
                                                                                            const txCur = (tx.currency || "EUR").toUpperCase();
                                                                                            const txAmount = txQty * txPrice;

                                                                                            // For closed positions: only realized P&L from notes
                                                                                            let plValue = null;
                                                                                            let plLabel = isBuy ? "Achat" : "Réalisé";
                                                                                            if (!isBuy) {
                                                                                                const notesStr = tx.notes || "";
                                                                                                const match = notesStr.match(/([+-]?[\d.,]+)\s*(EUR|USD|€|\$)/i);
                                                                                                if (match) {
                                                                                                    plValue = parseFloat(match[1].replace(",", "."));
                                                                                                    if (/perte/i.test(notesStr) && plValue > 0) plValue = -plValue;
                                                                                                }
                                                                                            }
                                                                                            const plPositive = plValue !== null && plValue >= 0;
                                                                                            // % for closed sells: plValue / sell proceeds × 100 (rough ROI)
                                                                                            const txPriceEurForPct = txCur === "EUR" ? txPrice : txPrice / (data.eurToUsdRate || 1.05);
                                                                                            const plCost = txQty * txPriceEurForPct;
                                                                                            const plPct = plCost !== 0 && plValue !== null ? (plValue / plCost) * 100 : null;
                                                                                            return (
                                                                                                <TableRow key={tx.id} sx={{ "& td": { border: "none", py: 0.7, fontFamily: MONO_FONT, fontSize: "0.78rem" } }}>
                                                                                                    <TableCell sx={{ pl: 2 }}>
                                                                                                        <Stack direction="row" alignItems="center" spacing={0.6}>
                                                                                                            <Box sx={{ width: 18, height: 18, borderRadius: "50%", bgcolor: alpha(txColor, 0.12), color: txColor, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                                                                                {isBuy ? <ArrowUpwardRoundedIcon sx={{ fontSize: 11 }} /> : <ArrowDownwardRoundedIcon sx={{ fontSize: 11 }} />}
                                                                                                            </Box>
                                                                                                            <Typography sx={{ fontWeight: 700, fontSize: "0.72rem", color: txColor, textTransform: "uppercase" }}>
                                                                                                                {isBuy ? "Achat" : "Vente"}
                                                                                                            </Typography>
                                                                                                        </Stack>
                                                                                                    </TableCell>
                                                                                                    <TableCell sx={{ color: "text.secondary" }}>{tx.tx_date ? new Date(tx.tx_date).toLocaleDateString("fr-FR") : "—"}</TableCell>
                                                                                                    <TableCell>{txQty.toLocaleString(undefined, { maximumFractionDigits: 6 })}</TableCell>
                                                                                                    <TableCell>{new Intl.NumberFormat("fr-FR", { style: "currency", currency: txCur }).format(txPrice)}</TableCell>
                                                                                                    <TableCell sx={{ fontWeight: 700, color: isBuy ? "error.main" : "success.main" }}>
                                                                                                        {isBuy ? "-" : "+"}{new Intl.NumberFormat("fr-FR", { style: "currency", currency: txCur }).format(txAmount)}
                                                                                                    </TableCell>
                                                                                                    <TableCell>
                                                                                                        {plValue !== null ? (
                                                                                                            <Box
                                                                                                                onClick={() => setPlShowPct(v => !v)}
                                                                                                                sx={{
                                                                                                                    display: "inline-flex", alignItems: "center", gap: 0.4,
                                                                                                                    px: 1, py: 0.25, borderRadius: "6px", cursor: "pointer",
                                                                                                                    bgcolor: alpha(plPositive ? theme.palette.success.main : theme.palette.error.main, 0.1),
                                                                                                                    transition: "all 0.15s",
                                                                                                                    "&:hover": { bgcolor: alpha(plPositive ? theme.palette.success.main : theme.palette.error.main, 0.18) },
                                                                                                                }}
                                                                                                            >
                                                                                                                <Typography sx={{
                                                                                                                    fontSize: "0.72rem", fontWeight: 700, fontFamily: MONO_FONT,
                                                                                                                    color: plPositive ? theme.palette.success.main : theme.palette.error.main,
                                                                                                                    transition: "all 0.15s",
                                                                                                                }}>
                                                                                                                    {plShowPct && plPct !== null
                                                                                                                        ? `${plPositive ? "+" : ""}${plPct.toFixed(1)}%`
                                                                                                                        : `${plPositive ? "+" : ""}${new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", signDisplay: "never" }).format(Math.abs(plValue))}`
                                                                                                                    }
                                                                                                                </Typography>
                                                                                                                <Typography sx={{ fontSize: "0.6rem", color: "text.disabled", fontWeight: 600 }}>
                                                                                                                    {plLabel}
                                                                                                                </Typography>
                                                                                                            </Box>
                                                                                                        ) : <Typography sx={{ fontSize: "0.75rem", color: "text.disabled" }}>—</Typography>}
                                                                                                    </TableCell>
                                                                                                    <TableCell sx={{ pr: 1 }}>
                                                                                                        <IconButton size="small" onClick={() => handleDeleteTransaction(tx.id, inv.id)} sx={{ opacity: 0.3, "&:hover": { opacity: 1, color: "error.main" } }}>
                                                                                                            <DeleteIcon sx={{ fontSize: 12 }} />
                                                                                                        </IconButton>
                                                                                                    </TableCell>
                                                                                                </TableRow>
                                                                                            );
                                                                                        })}
                                                                                    </TableBody>
                                                                                </Table>
                                                                            )}
                                                                        </Box>
                                                                    </Collapse>
                                                                </TableCell>
                                                            </TableRow>
                                                        </>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>
                                    </Collapse>
                                </Box>
                            )}

                        </Box>

                    </Box>
                </Fade>
            )}

            {/* ── DIALOG ADD ────────────────────────────── */}
            <Dialog
                open={openDialog}
                onClose={() => setOpenDialog(false)}
                PaperProps={{
                    sx: {
                        borderRadius: "20px",
                        bgcolor: isDark ? "#141420" : "background.paper",
                        backgroundImage: "none",
                        border: `1px solid ${isDark ? alpha("#FFF", 0.08) : alpha("#000", 0.06)}`,
                        p: 1,
                        minWidth: 420,
                        boxShadow: "0 24px 80px rgba(0,0,0,0.3)",
                    },
                }}
            >
                <DialogTitle sx={{ fontWeight: 800, fontSize: "1.1rem", pb: 1 }}>
                    Ajouter un actif
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={2.5} sx={{ mt: 1 }}>
                        <TextField
                            label="Ticker (ex: AAPL, TSLA, MC.PA)"
                            variant="outlined"
                            fullWidth
                            value={form.ticker}
                            onChange={(e) => setForm({ ...form, ticker: e.target.value.toUpperCase() })}
                            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
                        />
                        <TextField
                            label="Quantité"
                            type="number"
                            variant="outlined"
                            fullWidth
                            value={form.quantity}
                            onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
                        />
                        <Box>
                            <Typography sx={{ fontSize: "0.75rem", color: "text.secondary", mb: 1, fontWeight: 600 }}>
                                Prix Moyen d'Achat (PRU)
                            </Typography>
                            <Stack direction="row" spacing={1.5}>
                                <TextField
                                    placeholder="Ex: 308.00"
                                    type="number"
                                    variant="outlined"
                                    fullWidth
                                    value={form.average_price}
                                    onChange={(e) => setForm({ ...form, average_price: e.target.value })}
                                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
                                />
                                <Box
                                    sx={{
                                        display: "flex",
                                        borderRadius: "12px",
                                        overflow: "hidden",
                                        border: `1px solid ${isDark ? alpha("#FFF", 0.1) : alpha("#000", 0.12)}`,
                                        flexShrink: 0,
                                    }}
                                >
                                    {["USD", "EUR"].map((cur) => (
                                        <Button
                                            key={cur}
                                            onClick={() => setForm({ ...form, currency: cur })}
                                            sx={{
                                                minWidth: 56,
                                                px: 1,
                                                py: 0.8,
                                                fontSize: "0.78rem",
                                                fontWeight: 700,
                                                borderRadius: 0,
                                                color: form.currency === cur ? (isDark ? "#000" : "#FFF") : "text.secondary",
                                                bgcolor: form.currency === cur ? accentColor : "transparent",
                                                "&:hover": {
                                                    bgcolor: form.currency === cur ? accentColor : isDark ? alpha("#FFF", 0.06) : alpha("#000", 0.04),
                                                },
                                                transition: "all 0.15s",
                                            }}
                                        >
                                            {cur === "USD" ? "$" : "€"} {cur}
                                        </Button>
                                    ))}
                                </Box>
                            </Stack>
                            <Typography sx={{ fontSize: "0.7rem", color: "text.secondary", mt: 0.8, opacity: 0.7 }}>
                                Sélectionnez la devise dans laquelle vous avez acheté cet actif
                            </Typography>
                        </Box>
                        <TextField
                            label="Date d'achat (optionnel)"
                            type="date"
                            variant="outlined"
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            value={form.buy_date}
                            onChange={(e) => setForm({ ...form, buy_date: e.target.value })}
                            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
                    <Button
                        onClick={() => setOpenDialog(false)}
                        sx={{ color: "text.secondary", borderRadius: "10px" }}
                    >
                        Annuler
                    </Button>
                    <Button
                        onClick={handleAddInvestment}
                        variant="contained"
                        color="secondary"
                        sx={{
                            borderRadius: "10px",
                            fontWeight: 700,
                            px: 3,
                            boxShadow: isDark ? `0 4px 18px ${alpha(accentColor, 0.4)}` : "none",
                        }}
                    >
                        Ajouter
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ─── Transaction Dialog ─────────────────────────────── */}
            <Dialog
                open={!!txDialogInv}
                onClose={() => setTxDialogInv(null)}
                PaperProps={{
                    sx: {
                        borderRadius: "20px",
                        bgcolor: isDark ? "#141420" : "background.paper",
                        backgroundImage: "none",
                        border: `1px solid ${isDark ? alpha("#FFF", 0.08) : alpha("#000", 0.06)}`,
                        p: 1,
                        minWidth: 440,
                        boxShadow: "0 24px 80px rgba(0,0,0,0.3)",
                    },
                }}
            >
                <DialogTitle sx={{ fontWeight: 800, fontSize: "1.1rem", pb: 1 }}>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Box
                            sx={{
                                width: 34, height: 34, borderRadius: "10px",
                                bgcolor: txDialogInv ? alpha(DONUT_COLORS[data.investments.findIndex(i => i.id === txDialogInv?.id) % DONUT_COLORS.length] || accentColor, 0.12) : "transparent",
                                display: "flex", alignItems: "center", justifyContent: "center",
                            }}
                        >
                            <AddRoundedIcon sx={{ fontSize: 18, color: txDialogInv ? DONUT_COLORS[data.investments.findIndex(i => i.id === txDialogInv?.id) % DONUT_COLORS.length] || accentColor : accentColor }} />
                        </Box>
                        <Box>
                            <Typography sx={{ fontWeight: 800, fontSize: "1rem" }}>
                                Nouvelle Transaction
                            </Typography>
                            {txDialogInv && (
                                <Typography sx={{ fontSize: "0.72rem", color: "text.secondary", fontWeight: 500 }}>
                                    {txDialogInv.ticker} — {txDialogInv.longName || ""}
                                </Typography>
                            )}
                        </Box>
                    </Stack>
                </DialogTitle>

                <DialogContent>
                    <Stack spacing={2.5} sx={{ mt: 1 }}>
                        {/* Buy / Sell Toggle */}
                        <Box>
                            <Typography sx={{ fontSize: "0.75rem", color: "text.secondary", mb: 1, fontWeight: 600 }}>
                                Type de transaction
                            </Typography>
                            <Stack direction="row" spacing={0} sx={{ borderRadius: "12px", overflow: "hidden", border: `1px solid ${isDark ? alpha("#FFF", 0.1) : alpha("#000", 0.12)}` }}>
                                {[{ value: "buy", label: "🟢  Achat", color: "success" }, { value: "sell", label: "🔴  Vente", color: "error" }].map(({ value, label, color }) => (
                                    <Button
                                        key={value}
                                        fullWidth
                                        onClick={() => setTxForm({ ...txForm, type: value })}
                                        sx={{
                                            py: 1, fontWeight: 700, fontSize: "0.85rem",
                                            borderRadius: 0,
                                            color: txForm.type === value
                                                ? (value === "buy" ? "#fff" : "#fff")
                                                : "text.secondary",
                                            bgcolor: txForm.type === value
                                                ? (value === "buy" ? "success.main" : "error.main")
                                                : "transparent",
                                            "&:hover": {
                                                bgcolor: txForm.type === value
                                                    ? (value === "buy" ? "success.dark" : "error.dark")
                                                    : isDark ? alpha("#FFF", 0.04) : alpha("#000", 0.03),
                                            },
                                            transition: "all 0.15s",
                                        }}
                                    >
                                        {label}
                                    </Button>
                                ))}
                            </Stack>
                        </Box>

                        {/* Qty + Price row */}
                        <Stack direction="row" spacing={1.5}>
                            <TextField
                                label="Quantité"
                                type="number"
                                variant="outlined"
                                fullWidth
                                value={txForm.quantity}
                                onChange={(e) => setTxForm({ ...txForm, quantity: e.target.value })}
                                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
                                inputProps={{ min: 0, step: "any" }}
                            />
                            <TextField
                                label="Prix unitaire"
                                type="number"
                                variant="outlined"
                                fullWidth
                                placeholder="Ex: 308.00"
                                value={txForm.price}
                                onChange={(e) => setTxForm({ ...txForm, price: e.target.value })}
                                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
                                inputProps={{ min: 0, step: "any" }}
                            />
                        </Stack>

                        {/* Currency selector */}
                        <Box>
                            <Typography sx={{ fontSize: "0.75rem", color: "text.secondary", mb: 1, fontWeight: 600 }}>
                                Devise du prix
                            </Typography>
                            <Stack direction="row" sx={{ borderRadius: "12px", overflow: "hidden", border: `1px solid ${isDark ? alpha("#FFF", 0.1) : alpha("#000", 0.12)}`, display: "inline-flex" }}>
                                {["USD", "EUR"].map((cur) => (
                                    <Button
                                        key={cur}
                                        onClick={() => setTxForm({ ...txForm, currency: cur })}
                                        sx={{
                                            minWidth: 72, px: 1, py: 0.8,
                                            fontSize: "0.78rem", fontWeight: 700, borderRadius: 0,
                                            color: txForm.currency === cur ? (isDark ? "#000" : "#FFF") : "text.secondary",
                                            bgcolor: txForm.currency === cur ? accentColor : "transparent",
                                            "&:hover": { bgcolor: txForm.currency === cur ? accentColor : isDark ? alpha("#FFF", 0.06) : alpha("#000", 0.04) },
                                            transition: "all 0.15s",
                                        }}
                                    >
                                        {cur === "USD" ? "$" : "€"} {cur}
                                    </Button>
                                ))}
                            </Stack>
                        </Box>

                        {/* Date */}
                        <TextField
                            label="Date de la transaction (optionnel)"
                            type="date"
                            variant="outlined"
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            value={txForm.tx_date}
                            onChange={(e) => setTxForm({ ...txForm, tx_date: e.target.value })}
                            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
                        />

                        {/* Notes */}
                        <TextField
                            label="Notes (optionnel)"
                            variant="outlined"
                            fullWidth
                            multiline
                            rows={2}
                            placeholder="Ex: Renforcement position, DCA mensuel…"
                            value={txForm.notes}
                            onChange={(e) => setTxForm({ ...txForm, notes: e.target.value })}
                            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
                        />

                        {/* Summary */}
                        {txForm.quantity && txForm.price && (
                            <Box
                                sx={{
                                    borderRadius: "12px",
                                    bgcolor: isDark ? alpha("#FFF", 0.03) : alpha("#000", 0.025),
                                    border: `1px solid ${isDark ? alpha("#FFF", 0.06) : alpha("#000", 0.06)}`,
                                    px: 2, py: 1.5,
                                }}
                            >
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Typography sx={{ fontSize: "0.78rem", color: "text.secondary", fontWeight: 600 }}>
                                        Montant total
                                    </Typography>
                                    <Typography sx={{ fontSize: "0.9rem", fontWeight: 800, color: txForm.type === "buy" ? "error.main" : "success.main" }}>
                                        {txForm.type === "buy" ? "-" : "+"}
                                        {new Intl.NumberFormat("fr-FR", { style: "currency", currency: txForm.currency || "USD" })
                                            .format(parseFloat(txForm.quantity || 0) * parseFloat(txForm.price || 0))}
                                    </Typography>
                                </Stack>
                                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 0.5 }}>
                                    <Typography sx={{ fontSize: "0.72rem", color: "text.secondary", fontWeight: 500 }}>
                                        {parseFloat(txForm.quantity || 0).toLocaleString(undefined, { maximumFractionDigits: 6 })} × {new Intl.NumberFormat("fr-FR", { style: "currency", currency: txForm.currency || "USD" }).format(parseFloat(txForm.price || 0))}
                                    </Typography>
                                    <Typography sx={{ fontSize: "0.72rem", color: "text.secondary" }}>
                                        {txForm.type === "buy" ? "Achat" : "Vente"} • Nouveau PRU calculé auto
                                    </Typography>
                                </Stack>
                            </Box>
                        )}
                    </Stack>
                </DialogContent>

                <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
                    <Button
                        onClick={() => setTxDialogInv(null)}
                        sx={{ color: "text.secondary", borderRadius: "10px" }}
                    >
                        Annuler
                    </Button>
                    <Button
                        onClick={handleAddTransaction}
                        variant="contained"
                        disabled={txLoading || !txForm.quantity || !txForm.price}
                        sx={{
                            borderRadius: "10px",
                            fontWeight: 700,
                            px: 3,
                            minWidth: 140,
                            bgcolor: txForm.type === "buy" ? "success.main" : "error.main",
                            "&:hover": { bgcolor: txForm.type === "buy" ? "success.dark" : "error.dark" },
                            boxShadow: "none",
                        }}
                    >
                        {txLoading ? <CircularProgress size={18} color="inherit" /> : (txForm.type === "buy" ? "Confirmer l'Achat" : "Confirmer la Vente")}
                    </Button>
                </DialogActions>
            </Dialog>

        </Box>
    );
}
