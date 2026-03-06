import {
    Box,
    Button,
    CircularProgress,
    Collapse,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Fade,
    IconButton,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TablePagination,
    TableRow,
    TextField,
    Typography,
    alpha,
    useTheme, InputAdornment, Drawer, Fab
} from "@mui/material";
import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import {
    Area,
    AreaChart,
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Sector,
    Tooltip,
    XAxis,
    YAxis
} from "recharts";

import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import DeleteIcon from "@mui/icons-material/Delete";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import TrendingDownRoundedIcon from "@mui/icons-material/TrendingDownRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import MonetizationOnRoundedIcon from "@mui/icons-material/MonetizationOnRounded";

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
import { API_BASE_URL } from "../config/apiConfig";

// ─── Constants ────────────────────────────────────────────────────
const MONO_FONT = `"JetBrains Mono", "SF Mono", "Fira Code", monospace`;

// ─── Palette for donut chart slices ───────────────────────────────
const DONUT_COLORS = [
    "#7C5CFC", "#00C9A7", "#FF6B6B", "#FFC542", "#45B7D1",
    "#96CEB4", "#FF8E9B", "#A29BFE", "#00B894", "#FDCB6E",
    "#E17055", "#74B9FF", "#55EFC4", "#FFEAA7", "#DFE6E9",
];

// ─── KPI Card ─────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
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
// eslint-disable-next-line no-unused-vars
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
    // eslint-disable-next-line no-unused-vars
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
    // eslint-disable-next-line no-unused-vars
    const [showClosed, setShowClosed] = useState(false);     // toggle closed positions
    // eslint-disable-next-line no-unused-vars
    const [plShowPct, setPlShowPct] = useState(false);       // toggle P&L: amount vs percent
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    // eslint-disable-next-line no-unused-vars
    const [holdingsSort, setHoldingsSort] = useState("weight_desc"); // sort for holdings table
    const [chartMode, setChartMode] = useState("value"); // "value" or "profit"

    // AI Chat State
    const [aiDrawerOpen, setAiDrawerOpen] = useState(false);
    const [aiMessages, setAiMessages] = useState([]);
    const [aiInput, setAiInput] = useState("");
    const [aiLoading, setAiLoading] = useState(false);
    const messagesEndRef = useRef(null);


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

    const totalPnL = useMemo(() => data.currentPortValue - data.totalInvested, [data.currentPortValue, data.totalInvested]);
    const eurToUsdRate = useMemo(() => data.eurToUsdRate || 1, [data.eurToUsdRate]);
    const isUSD = currency === "USD";
    const multiplier = isUSD ? eurToUsdRate : 1;
    const cc = isUSD ? "USD" : "EUR";
    const perfPct = useMemo(() =>
        data.totalInvested ? ((totalPnL / data.totalInvested) * 100).toFixed(2) : 0,
        [totalPnL, data.totalInvested]
    );

    const handleAddInvestment = useCallback(async () => {
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form]);

    // eslint-disable-next-line no-unused-vars
    const handleDelete = useCallback(async (id) => {
        await deleteInvestment(id);
        setCache({});
        loadData(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Transaction handlers ──────────────────────────────────────
    const loadTransactions = useCallback(async (investmentId, force = false) => {
        if (!force && txMap[investmentId]) return; // already cached
        try {
            const txs = await getTransactions(investmentId);
            setTxMap(prev => ({ ...prev, [investmentId]: txs }));
        } catch (e) { console.error(e); }
    }, [txMap]);

    const handleExpandRow = useCallback((invId) => {
        setExpandedRow(prev => {
            if (prev === invId) return null;
            loadTransactions(invId);
            return invId;
        });
    }, [loadTransactions]);

    const handleOpenTxDialog = useCallback((inv) => {
        const defaultCurrency = (inv.native_currency || inv.currency || "USD").toUpperCase() === "EUR" ? "EUR" : "USD";
        setTxDialogInv(inv);
        setTxForm({ type: "buy", quantity: "", price: "", currency: defaultCurrency, tx_date: "", notes: "" });
    }, []);

    const handleAddTransaction = useCallback(async () => {
        if (!txDialogInv) return;
        setTxLoading(true);
        try {
            await addTransaction(txDialogInv.id, txForm);
            const savedInvId = txDialogInv.id;
            setTxDialogInv(null);
            await loadTransactions(savedInvId, true);
            setCache({});
            loadData(true);
        } catch (e) { console.error(e); }
        setTxLoading(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [txDialogInv, txForm, loadTransactions]);

    const handleDeleteTransaction = useCallback(async (txId, investmentId) => {
        await deleteTransaction(txId);
        await loadTransactions(investmentId, true);
        setCache({});
        loadData(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loadTransactions]);

    const handleAskAi = async () => {
        if (!aiInput.trim()) return;
        const prompt = aiInput.trim();
        setAiInput("");

        const newMsg = { id: Date.now(), role: "user", text: prompt };
        setAiMessages(prev => [...prev, newMsg, { id: Date.now() + 1, role: "model", text: "" }]);
        setAiLoading(true);

        try {
            const res = await fetch(`${API_BASE_URL}/gemini/investment/stream`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sessionId: "investment_chat_session",
                    rawText: prompt,
                    investments: data.investments,
                    recentActivity: data.recentActivity
                }),
            });

            if (!res.ok) throw new Error("Erreur lors de la communication de flux");

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let accumulatedText = "";
            let buffer = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                buffer += chunk;
                const lines = buffer.split('\n');
                buffer = lines.pop(); // keep incomplete line in buffer

                for (let line of lines) {
                    if (line.startsWith('data: ')) {
                        const strData = line.slice(6).trim();
                        if (strData && strData !== "[DONE]") {
                            try {
                                const parsed = JSON.parse(strData);
                                if (parsed.text !== undefined) {
                                    accumulatedText = parsed.text;
                                    // eslint-disable-next-line no-loop-func
                                    setAiMessages(prev => {
                                        const newMsgs = [...prev];
                                        const last = newMsgs[newMsgs.length - 1];
                                        if (last.role === "model") {
                                            last.text = accumulatedText;
                                        }
                                        return newMsgs;
                                    });
                                }
                            } catch (e) {
                                // ignore
                            }
                        }
                    }
                }
            }
        } catch (e) {
            console.error(e);
            setAiMessages(prev => {
                const newMsgs = [...prev];
                const last = newMsgs[newMsgs.length - 1];
                if (last.role === "model") last.text = "Erreur de connexion avec l'IA.";
                return newMsgs;
            });
        } finally {
            setAiLoading(false);
        }
    };

    const handleClearAiChat = async () => {
        setAiMessages([]);
        try {
            await fetch(`${API_BASE_URL}/ai-memory/sessions/investment_chat_session/messages`, {
                method: "DELETE",
            });
        } catch (e) {
            console.error("Failed to clear AI memory", e);
        }
    };

    useEffect(() => {
        if (aiDrawerOpen && messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [aiMessages, aiDrawerOpen]);

    // eslint-disable-next-line no-unused-vars
    const handleDonutEnter = useCallback((_, index) => setActiveDonutIndex(index), []);

    // Donut chart data
    const donutData = useMemo(() => data.investments
        .filter(inv => inv.current_value > 0)
        .map((inv, i) => ({
            ticker: inv.ticker,
            shortName: inv.longName ? (inv.longName.length > 20 ? inv.longName.slice(0, 20) + "…" : inv.longName) : inv.ticker,
            value: (inv.current_value || 0) * multiplier,
            color: DONUT_COLORS[i % DONUT_COLORS.length],
        })), [data.investments, multiplier]);

    // Holdings sort options
    // eslint-disable-next-line no-unused-vars
    const HOLDINGS_SORTS = [
        { id: "weight_desc", label: "Poids" },
        { id: "value_desc", label: "Valeur ↓" },
        { id: "value_asc", label: "Valeur ↑" },
        { id: "gain_desc", label: "+Value" },
        { id: "loss_desc", label: "-Value" },
        { id: "pct_desc", label: "Perf. ↑" },
        { id: "pct_asc", label: "Perf. ↓" },
    ];

    const sortedInvestments = useMemo(() => {
        const open = data.investments.filter(i => i.quantity > 0);
        const sorted = [...open];
        switch (holdingsSort) {
            case "value_desc": sorted.sort((a, b) => (b.current_value || 0) - (a.current_value || 0)); break;
            case "value_asc": sorted.sort((a, b) => (a.current_value || 0) - (b.current_value || 0)); break;
            case "gain_desc": sorted.sort((a, b) => (b.profit_loss || 0) - (a.profit_loss || 0)); break;
            case "loss_desc": sorted.sort((a, b) => (a.profit_loss || 0) - (b.profit_loss || 0)); break;
            case "pct_desc": sorted.sort((a, b) => (b.profit_loss_pct || 0) - (a.profit_loss_pct || 0)); break;
            case "pct_asc": sorted.sort((a, b) => (a.profit_loss_pct || 0) - (b.profit_loss_pct || 0)); break;
            default: sorted.sort((a, b) => (b.current_value || 0) - (a.current_value || 0)); break; // weight_desc
        }
        return sorted;
    }, [data.investments, holdingsSort]);

    // eslint-disable-next-line no-unused-vars
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
                <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} gap={2} sx={{ mb: 4 }}>
                    <Box>
                        <Typography sx={{ fontSize: "1.25rem", fontWeight: 700, color: "text.primary", mb: 0.5 }}>Dashboard</Typography>
                        <Typography sx={{ fontSize: "0.85rem", color: "text.secondary" }}>Welcome back! Here is your dashboard overview.</Typography>
                    </Box>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <Button variant="outlined" onClick={() => setCurrency(currency === "EUR" ? "USD" : "EUR")} sx={{ borderColor: isDark ? "#282346" : "divider", color: "text.primary", textTransform: "none", borderRadius: "10px", px: 2, py: 0.8, bgcolor: isDark ? "#1B1C28" : "background.paper", fontSize: "0.8rem", "&:hover": { bgcolor: isDark ? "#242535" : "action.hover" } }}>
                            ↓ {currency === "EUR" ? "€ EUR" : "$ USD"}
                        </Button>
                        <Button variant="outlined" sx={{ borderColor: isDark ? "#282346" : "divider", color: "text.primary", textTransform: "none", borderRadius: "10px", px: 2, py: 0.8, bgcolor: isDark ? "#1B1C28" : "background.paper", fontSize: "0.8rem", "&:hover": { bgcolor: isDark ? "#242535" : "action.hover" } }}>
                            ↑ Retrait
                        </Button>
                        <Button variant="contained" onClick={() => setOpenDialog(true)} sx={{ bgcolor: isDark ? "#fff" : "#000", color: isDark ? "#000" : "#fff", fontWeight: 600, fontSize: "0.8rem", borderRadius: "10px", px: 2, py: 0.8, textTransform: "none", boxShadow: "none", "&:hover": { bgcolor: isDark ? "#f0f0f0" : "#333" } }}>
                            Invest Now
                        </Button>
                    </Stack>
                </Stack>
            </Fade>

            {loading ? (
                <Box sx={{ pt: 1, pb: 6 }}>
                    <CircularProgress sx={{ color: "#7C5CFC" }} />
                </Box>
            ) : (
                <Fade in timeout={600}>
                    <Box>
                        {/* ── KPI CARDS ─────────────────────────────── */}
                        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2,1fr)", md: "repeat(4, 1fr)" }, gap: 2.5, mb: 3 }}>
                            {/* KPI 1 */}
                            <Box sx={{ p: 2.5, borderRadius: "16px", bgcolor: isDark ? "#110e20" : "#ffffff", border: `1px solid ${isDark ? "#282346" : theme.palette.divider}`, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                                    <Box sx={{ width: 36, height: 36, borderRadius: "10px", bgcolor: alpha("#7C5CFC", 0.1), border: `1px solid ${alpha("#7C5CFC", 0.2)}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        <TrendingUpRoundedIcon sx={{ fontSize: 18, color: "#7C5CFC" }} />
                                    </Box>
                                </Box>
                                <Box>
                                    <Typography sx={{ fontSize: "0.75rem", color: "text.secondary", mb: 0.5 }}>Total Portfolio</Typography>
                                    <Typography sx={{ fontFamily: MONO_FONT, fontSize: "1.6rem", fontWeight: 700, color: "text.primary", lineHeight: 1, mb: 1 }}>{new Intl.NumberFormat("fr-FR", { style: "currency", currency: cc, maximumFractionDigits: 2 }).format(data.currentPortValue * multiplier)}</Typography>
                                    <Typography sx={{ fontSize: "0.75rem", fontWeight: 600, color: totalPnL >= 0 ? "success.main" : "error.main" }}>
                                        {totalPnL >= 0 ? "↗" : "↘"} {totalPnL >= 0 ? "+" : ""}{((totalPnL / data.totalInvested) * 100 || 0).toFixed(1)}%
                                    </Typography>
                                </Box>
                            </Box>
                            {/* KPI 2 */}
                            <Box sx={{ p: 2.5, borderRadius: "16px", bgcolor: isDark ? "#110e20" : "#ffffff", border: `1px solid ${isDark ? "#282346" : theme.palette.divider}`, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                                    <Box sx={{ width: 36, height: 36, borderRadius: "10px", bgcolor: totalPnL >= 0 ? alpha("#00C9A7", 0.1) : alpha("#FF6B6B", 0.1), border: `1px solid ${totalPnL >= 0 ? alpha("#00C9A7", 0.2) : alpha("#FF6B6B", 0.2)}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        {totalPnL >= 0 ? <TrendingUpRoundedIcon sx={{ fontSize: 18, color: "#00C9A7" }} /> : <TrendingDownRoundedIcon sx={{ fontSize: 18, color: "#FF6B6B" }} />}
                                    </Box>
                                </Box>
                                <Box>
                                    <Typography sx={{ fontSize: "0.75rem", color: "text.secondary", mb: 0.5 }}>Daily P&L (Total)</Typography>
                                    <Typography sx={{ fontFamily: MONO_FONT, fontSize: "1.6rem", fontWeight: 700, color: "text.primary", lineHeight: 1, mb: 1 }}>{totalPnL >= 0 ? "+" : ""}{new Intl.NumberFormat("fr-FR", { style: "currency", currency: cc, maximumFractionDigits: 2 }).format(totalPnL * multiplier)}</Typography>
                                    <Typography sx={{ fontSize: "0.75rem", fontWeight: 600, color: totalPnL >= 0 ? "success.main" : "error.main" }}>
                                        {totalPnL >= 0 ? "↗" : "↘"} {perfPct}%
                                    </Typography>
                                </Box>
                            </Box>
                            {/* KPI 3 */}
                            <Box sx={{ p: 2.5, borderRadius: "16px", bgcolor: isDark ? "#110e20" : "#ffffff", border: `1px solid ${isDark ? "#282346" : theme.palette.divider}`, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                                    <Box sx={{ width: 36, height: 36, borderRadius: "10px", bgcolor: alpha("#FFC542", 0.1), border: `1px solid ${alpha("#FFC542", 0.2)}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        <TrendingUpRoundedIcon sx={{ fontSize: 18, color: "#FFC542" }} />
                                    </Box>
                                </Box>
                                <Box>
                                    <Typography sx={{ fontSize: "0.75rem", color: "text.secondary", mb: 0.5 }}>Total Income</Typography>
                                    <Typography sx={{ fontFamily: MONO_FONT, fontSize: "1.6rem", fontWeight: 700, color: "text.primary", lineHeight: 1, mb: 1 }}>{new Intl.NumberFormat("fr-FR", { style: "currency", currency: cc, maximumFractionDigits: 2 }).format(data.totalInvested * multiplier)}</Typography>
                                    <Typography sx={{ fontSize: "0.75rem", fontWeight: 600, color: "success.main" }}>
                                        ↗ +8.1%
                                    </Typography>
                                </Box>
                            </Box>
                            {/* KPI 4 */}
                            <Box sx={{ p: 2.5, borderRadius: "16px", bgcolor: isDark ? "#110e20" : "#ffffff", border: `1px solid ${isDark ? "#282346" : theme.palette.divider}`, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                                    <Box sx={{ width: 36, height: 36, borderRadius: "10px", bgcolor: alpha("#45B7D1", 0.1), border: `1px solid ${alpha("#45B7D1", 0.2)}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        <TrendingUpRoundedIcon sx={{ fontSize: 18, color: "#45B7D1" }} />
                                    </Box>
                                </Box>
                                <Box>
                                    <Typography sx={{ fontSize: "0.75rem", color: "text.secondary", mb: 0.5 }}>Dividend Income</Typography>
                                    <Typography sx={{ fontFamily: MONO_FONT, fontSize: "1.6rem", fontWeight: 700, color: "text.primary", lineHeight: 1, mb: 1 }}>{new Intl.NumberFormat("fr-FR", { style: "currency", currency: cc, maximumFractionDigits: 2 }).format((data.totalDividendIncome || 0) * multiplier)}</Typography>
                                    <Typography sx={{ fontSize: "0.75rem", fontWeight: 600, color: "success.main" }}>
                                        {data.totalDividendIncome > 0 ? "✓ Actif" : ""}
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>

                        {/* ROW 2 */}
                        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1.8fr 1fr" }, gap: 2.5, mb: 2.5 }}>
                            {/* Left: Snapshot Table */}
                            <Box sx={{ borderRadius: "16px", bgcolor: isDark ? "#151226" : "#ffffff", border: `1px solid ${isDark ? "#282346" : theme.palette.divider}`, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ p: 2.5 }}>
                                    <Typography sx={{ fontWeight: 600, fontSize: "1rem", color: "text.primary" }}>Portfolio Snapshot</Typography>
                                    <Box sx={{ px: 1.5, py: 0.5, borderRadius: "8px", border: `1px solid ${isDark ? alpha("#FFF", 0.1) : alpha("#000", 0.1)}`, color: "text.secondary", fontSize: "0.75rem", fontWeight: 600 }}>
                                        {sortedInvestments.length} Holding(s)
                                    </Box>
                                </Stack>
                                <TableContainer sx={{ overflowX: "auto", flex: 1 }}>
                                    <Table>
                                        <TableHead>
                                            <TableRow sx={{ "& th": { color: "text.secondary", fontWeight: 500, fontSize: "0.75rem", borderBottom: `1px solid ${isDark ? "#282346" : theme.palette.divider}`, py: 1.5 } }}>
                                                <TableCell sx={{ pl: 2.5 }}>Asset</TableCell>
                                                <TableCell>Type</TableCell>
                                                <TableCell align="right">Current Value</TableCell>
                                                <TableCell align="right">ROI</TableCell>
                                                <TableCell align="left" sx={{ pl: 4 }}>Allocation</TableCell>

                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {sortedInvestments.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((inv, idx) => {
                                                const dotColor = DONUT_COLORS[(page * rowsPerPage + idx) % DONUT_COLORS.length];
                                                const isPos = (inv.profit_loss || 0) >= 0;
                                                const weight = data.currentPortValue > 0 ? ((inv.current_value / data.currentPortValue) * 100).toFixed(1) : "0.0";
                                                const assetType = inv.assetType || (inv.ticker.includes(".PA") ? "Action Européenne" : inv.ticker.includes(".DE") ? "Action Allemande" : "Action US");
                                                return (
                                                    <React.Fragment key={inv.id}>
                                                        <TableRow
                                                            onClick={() => handleExpandRow(inv.id)}
                                                            sx={{
                                                                cursor: "pointer",
                                                                "&:hover": { bgcolor: isDark ? alpha("#FFF", 0.02) : alpha("#000", 0.02) },
                                                                "& td": { borderBottom: `1px solid ${isDark ? "#282346" : theme.palette.divider}`, py: 2, fontSize: "0.85rem", color: "text.primary", fontFamily: MONO_FONT }
                                                            }}
                                                        >
                                                            <TableCell sx={{ pl: 2.5 }}>
                                                                <Typography sx={{ fontWeight: 600, fontSize: "0.85rem", color: "text.primary" }}>{inv.longName && inv.longName.length > 15 ? inv.longName.slice(0, 15) + "…" : inv.ticker}</Typography>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Box sx={{ display: "inline-block", px: 1.2, py: 0.4, borderRadius: "6px", bgcolor: isDark ? "#101018" : alpha("#000", 0.04), color: "text.secondary", fontSize: "0.7rem", fontWeight: 500 }}>{assetType}</Box>
                                                            </TableCell>
                                                            <TableCell align="right" sx={{ fontWeight: 600 }}>
                                                                {new Intl.NumberFormat("fr-FR", { style: "currency", currency: cc, maximumFractionDigits: 2 }).format((inv.current_value || 0) * multiplier)}
                                                            </TableCell>
                                                            <TableCell align="right">
                                                                <Typography sx={{ fontFamily: MONO_FONT, fontWeight: 600, fontSize: "0.85rem", color: isPos ? "success.main" : "error.main" }}>
                                                                    {isPos ? "↗ +" : "↘ "}{(inv.profit_loss_pct || 0).toFixed(1)}%
                                                                </Typography>
                                                            </TableCell>
                                                            <TableCell align="left" sx={{ pl: 4 }}>
                                                                <Box sx={{ display: "flex", gap: "2px", alignItems: "center", justifyContent: "space-between" }}>
                                                                    <Box sx={{ display: "flex", gap: "2px", alignItems: "center" }}>
                                                                        {[...Array(10)].map((_, i) => (
                                                                            <Box key={i} sx={{ width: 4, height: 12, borderRadius: "1px", bgcolor: i < (weight / 10) ? dotColor : isDark ? alpha("#FFF", 0.05) : alpha("#000", 0.05) }} />
                                                                        ))}
                                                                    </Box>
                                                                    <ChevronRightIcon sx={{ color: "text.secondary", transform: expandedRow === inv.id ? "rotate(90deg)" : "none", transition: "transform 0.2s" }} />
                                                                </Box>
                                                            </TableCell>
                                                        </TableRow>
                                                        <TableRow>
                                                            <TableCell style={{ paddingBottom: 0, paddingTop: 0, border: "none" }} colSpan={5}>
                                                                <Collapse in={expandedRow === inv.id} timeout="auto" unmountOnExit>
                                                                    <Box sx={{ p: 2, bgcolor: isDark ? alpha("#000", 0.2) : alpha("#000", 0.02), borderBottom: `1px solid ${isDark ? "#282346" : theme.palette.divider}` }}>
                                                                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                                                                            <Typography sx={{ fontSize: "0.85rem", fontWeight: 600, color: "text.secondary", display: "flex", alignItems: "center", gap: 1 }}>
                                                                                <HistoryRoundedIcon sx={{ fontSize: 16 }} /> Historique des transactions
                                                                            </Typography>
                                                                            <Button
                                                                                variant="outlined"
                                                                                size="small"
                                                                                onClick={(e) => { e.stopPropagation(); handleOpenTxDialog(inv); }}
                                                                                startIcon={<AddRoundedIcon />}
                                                                                sx={{ borderColor: isDark ? "#282346" : "divider", color: "text.primary", borderRadius: "8px", textTransform: "none", fontSize: "0.75rem", py: 0.5 }}
                                                                            >
                                                                                Nouvelle Transaction
                                                                            </Button>
                                                                        </Stack>

                                                                        {txMap[inv.id] && txMap[inv.id].length > 0 ? (
                                                                            <Table size="small" sx={{ "& th, & td": { borderColor: isDark ? alpha("#FFF", 0.05) : alpha("#000", 0.05) } }}>
                                                                                <TableHead>
                                                                                    <TableRow>
                                                                                        <TableCell sx={{ fontSize: "0.7rem", color: "text.secondary", fontWeight: 600 }}>Date</TableCell>
                                                                                        <TableCell sx={{ fontSize: "0.7rem", color: "text.secondary", fontWeight: 600 }}>Type</TableCell>
                                                                                        <TableCell sx={{ fontSize: "0.7rem", color: "text.secondary", fontWeight: 600 }}>Quantité</TableCell>
                                                                                        <TableCell sx={{ fontSize: "0.7rem", color: "text.secondary", fontWeight: 600 }}>Prix</TableCell>
                                                                                        <TableCell sx={{ fontSize: "0.7rem", color: "text.secondary", fontWeight: 600 }}>Total</TableCell>
                                                                                        <TableCell align="right" sx={{ fontSize: "0.7rem", color: "text.secondary", fontWeight: 600 }}>Actions</TableCell>
                                                                                    </TableRow>
                                                                                </TableHead>
                                                                                <TableBody>
                                                                                    {txMap[inv.id].map(tx => (
                                                                                        <TableRow key={tx.id}>
                                                                                            <TableCell sx={{ fontSize: "0.75rem", fontFamily: MONO_FONT }}>{new Date(tx.tx_date).toLocaleDateString()}</TableCell>
                                                                                            <TableCell>
                                                                                                <Box sx={{ display: "inline-block", px: 1, py: 0.2, borderRadius: "4px", fontSize: "0.65rem", fontWeight: 700, bgcolor: tx.type === "buy" ? alpha("#00C9A7", 0.1) : alpha("#FF6B6B", 0.1), color: tx.type === "buy" ? "#00C9A7" : "#FF6B6B" }}>
                                                                                                    {tx.type === "buy" ? "ACHAT" : "VENTE"}
                                                                                                </Box>
                                                                                            </TableCell>
                                                                                            <TableCell sx={{ fontSize: "0.75rem", fontFamily: MONO_FONT }}>{tx.quantity}</TableCell>
                                                                                            <TableCell sx={{ fontSize: "0.75rem", fontFamily: MONO_FONT }}>{new Intl.NumberFormat("fr-FR", { style: "currency", currency: tx.currency }).format(tx.price)}</TableCell>
                                                                                            <TableCell sx={{ fontSize: "0.75rem", fontFamily: MONO_FONT }}>{new Intl.NumberFormat("fr-FR", { style: "currency", currency: tx.currency }).format(tx.quantity * tx.price)}</TableCell>
                                                                                            <TableCell align="right">
                                                                                                <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleDeleteTransaction(tx.id, inv.id); }} sx={{ color: "error.main", p: 0.5 }}>
                                                                                                    <DeleteIcon sx={{ fontSize: 16 }} />
                                                                                                </IconButton>
                                                                                            </TableCell>
                                                                                        </TableRow>
                                                                                    ))}
                                                                                </TableBody>
                                                                            </Table>
                                                                        ) : (
                                                                            <Typography sx={{ fontSize: "0.75rem", color: "text.secondary", fontStyle: "italic", py: 1 }}>Aucune transaction trouvée.</Typography>
                                                                        )}
                                                                    </Box>
                                                                </Collapse>
                                                            </TableCell>
                                                        </TableRow>
                                                    </React.Fragment>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                                <TablePagination
                                    rowsPerPageOptions={[5, 10, 15]}
                                    component="div"
                                    count={sortedInvestments.length}
                                    rowsPerPage={rowsPerPage}
                                    page={page}
                                    onPageChange={(e, newPage) => setPage(newPage)}
                                    onRowsPerPageChange={(e) => {
                                        setRowsPerPage(parseInt(e.target.value, 10));
                                        setPage(0);
                                    }}
                                    labelRowsPerPage="Lignes per page:"
                                    sx={{ color: "text.secondary" }}
                                />
                            </Box>

                            {/* Right: Portfolio Allocations Gauge */}
                            <Box sx={{ borderRadius: "16px", bgcolor: isDark ? "#151226" : "#ffffff", border: `1px solid ${isDark ? "#282346" : theme.palette.divider}`, p: 2.5, display: "flex", flexDirection: "column" }}>
                                <Typography sx={{ fontWeight: 600, fontSize: "1rem", color: "text.primary", mb: 3 }}>Portfolio Allocations</Typography>
                                <Box sx={{ height: 180, position: "relative", mb: 2, "& :focus": { outline: "none" } }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart style={{ outline: "none" }}>
                                            <Tooltip
                                                cursor={{ fill: "transparent" }}
                                                contentStyle={{
                                                    backgroundColor: isDark ? "rgba(20, 20, 32, 0.95)" : "rgba(255, 255, 255, 0.95)",
                                                    borderRadius: "12px",
                                                    border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
                                                    padding: "10px 14px",
                                                    backdropFilter: "blur(10px)",
                                                    boxShadow: "0 8px 32px rgba(0,0,0,0.15)"
                                                }}
                                                itemStyle={{ color: isDark ? "#fff" : "#000", fontSize: "0.9rem", fontWeight: 700, fontFamily: MONO_FONT, paddingBottom: 0 }}
                                                formatter={(value, name, props) => {
                                                    const pct = data.currentPortValue > 0 ? ((value / (data.currentPortValue * multiplier)) * 100).toFixed(1) : "0.0";
                                                    const formattedVal = new Intl.NumberFormat("fr-FR", { style: "currency", currency: cc, maximumFractionDigits: 0 }).format(value);
                                                    return [`${pct}% (${formattedVal})`, props.payload.ticker || name];
                                                }}
                                            />
                                            <Pie
                                                data={donutData}
                                                cx="50%"
                                                cy="100%"
                                                startAngle={180}
                                                endAngle={0}
                                                innerRadius={90}
                                                outerRadius={120}
                                                dataKey="value"
                                                stroke="none"
                                            >
                                                {donutData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                            </Pie>
                                        </PieChart>
                                    </ResponsiveContainer>
                                    {/* Center Text inside gauge */}
                                    <Box sx={{ position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)", textAlign: "center", pointerEvents: "none" }}>
                                        <Typography sx={{ fontSize: "0.7rem", color: "text.secondary", mb: 0.5 }}>Total portfolio</Typography>
                                        <Typography sx={{ fontSize: "1.4rem", fontWeight: 700, color: "text.primary", fontFamily: MONO_FONT }}>
                                            {new Intl.NumberFormat("fr-FR", { style: "currency", currency: cc, maximumFractionDigits: 2 }).format(data.currentPortValue * multiplier)}
                                        </Typography>
                                    </Box>
                                </Box>
                                {/* Legend */}
                                <Stack spacing={1.5} sx={{ mt: 3, flex: 1, justifyContent: "center" }}>
                                    {donutData.slice(0, 4).map((entry, i) => {
                                        const pct = data.currentPortValue > 0 ? ((entry.value / (data.currentPortValue * multiplier)) * 100).toFixed(1) : "0.0";
                                        return (
                                            <Stack key={i} direction="row" justifyContent="space-between" alignItems="center">
                                                <Stack direction="row" alignItems="center" spacing={1.5}>
                                                    <Box sx={{ width: 12, height: 4, borderRadius: "2px", bgcolor: entry.color }} />
                                                    <Typography sx={{ fontSize: "0.75rem", color: "text.secondary" }}>{entry.shortName}</Typography>
                                                </Stack>
                                                <Typography sx={{ fontSize: "0.75rem", color: "text.primary", fontFamily: MONO_FONT, fontWeight: 600 }}>{pct}%</Typography>
                                            </Stack>
                                        );
                                    })}
                                </Stack>
                            </Box>
                        </Box>

                        {/* ROW 3 */}
                        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1.6fr 1fr" }, gap: 2.5 }}>
                            {/* Left: Income Summary */}
                            <Box sx={{ borderRadius: "16px", bgcolor: isDark ? "#151226" : "#ffffff", border: `1px solid ${isDark ? "#282346" : theme.palette.divider}`, p: 2.5 }}>
                                <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={2} sx={{ mb: 3 }}>
                                    <Stack direction="row" spacing={2} alignItems="center">
                                        <Typography sx={{ fontWeight: 600, fontSize: "1rem", color: "text.primary" }}>Income Summary</Typography>
                                        <Stack direction="row" sx={{ borderRadius: "8px", overflow: "hidden", border: `1px solid ${isDark ? alpha("#FFF", 0.1) : alpha("#000", 0.12)}` }}>
                                            <Button onClick={() => setChartMode('value')} sx={{ px: 1.5, py: 0.3, minWidth: 'auto', fontSize: "0.7rem", fontWeight: 700, borderRadius: 0, bgcolor: chartMode === 'value' ? accentColor : 'transparent', color: chartMode === 'value' ? (isDark ? '#000' : '#fff') : 'text.secondary', "&:hover": { bgcolor: chartMode === 'value' ? accentColor : isDark ? alpha("#FFF", 0.05) : alpha("#000", 0.04) } }}>Valeur</Button>
                                            <Button onClick={() => setChartMode('profit')} sx={{ px: 1.5, py: 0.3, minWidth: 'auto', fontSize: "0.7rem", fontWeight: 700, borderRadius: 0, bgcolor: chartMode === 'profit' ? accentColor : 'transparent', color: chartMode === 'profit' ? (isDark ? '#000' : '#fff') : 'text.secondary', "&:hover": { bgcolor: chartMode === 'profit' ? accentColor : isDark ? alpha("#FFF", 0.05) : alpha("#000", 0.04) } }}>Profit</Button>
                                        </Stack>
                                    </Stack>
                                    <Stack direction="row" spacing={0.5} sx={{ bgcolor: isDark ? "#101018" : alpha("#000", 0.04), p: 0.5, borderRadius: "8px", border: `1px solid ${isDark ? alpha("#FFF", 0.05) : alpha("#000", 0.05)}` }}>
                                        {periods.map((p) => (
                                            <Button
                                                key={p.value}
                                                onClick={() => setPeriod(p.value)}
                                                sx={{
                                                    minWidth: "auto",
                                                    px: 1.5,
                                                    py: 0.5,
                                                    fontSize: "0.7rem",
                                                    fontWeight: period === p.value ? 700 : 500,
                                                    color: period === p.value ? (isDark ? "#fff" : "#000") : "text.secondary",
                                                    bgcolor: period === p.value ? (isDark ? alpha("#FFF", 0.1) : "#fff") : "transparent",
                                                    borderRadius: "6px",
                                                    boxShadow: period === p.value && !isDark ? "0 2px 8px rgba(0,0,0,0.05)" : "none",
                                                    "&:hover": {
                                                        bgcolor: period === p.value ? (isDark ? alpha("#FFF", 0.15) : "#fff") : isDark ? alpha("#FFF", 0.05) : "rgba(0,0,0,0.02)"
                                                    }
                                                }}
                                            >
                                                {p.label}
                                            </Button>
                                        ))}
                                    </Stack>
                                </Stack>
                                <Box sx={{ height: 260, width: "100%" }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={data.chart.map(c => ({ ...c, value: c.value * multiplier, invested: c.invested * multiplier, profit: (c.value - c.invested) * multiplier }))} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="gradV" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#7C5CFC" stopOpacity={0.4} />
                                                    <stop offset="95%" stopColor="#7C5CFC" stopOpacity={0} />
                                                </linearGradient>
                                                <linearGradient id="gradP" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#00C9A7" stopOpacity={0.4} />
                                                    <stop offset="95%" stopColor="#00C9A7" stopOpacity={0} />
                                                </linearGradient>
                                                <linearGradient id="gradPLoss" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#FF6B6B" stopOpacity={0.4} />
                                                    <stop offset="95%" stopColor="#FF6B6B" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#666" }} tickFormatter={str => { const d = new Date(str); return `${d.getDate()}/${d.getMonth() + 1}`; }} axisLine={false} tickLine={false} />
                                            <YAxis tick={{ fontSize: 10, fill: "#666" }} axisLine={false} tickLine={false} tickFormatter={val => chartMode === 'profit' ? new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(val) : (val / 1000).toFixed(0) + "k"} />
                                            <Tooltip contentStyle={{ backgroundColor: isDark ? "rgba(27,28,40,0.9)" : "rgba(255,255,255,0.9)", borderRadius: "12px", border: "1px solid rgba(124, 92, 252, 0.5)", padding: "8px 12px", backdropFilter: "blur(10px)" }} labelStyle={{ color: "text.secondary", fontSize: "0.65rem", marginBottom: 2 }} itemStyle={{ color: "text.primary", fontSize: "0.9rem", fontWeight: 700 }} formatter={(value, name) => [new Intl.NumberFormat("fr-FR", { style: "currency", currency: cc, maximumFractionDigits: 0 }).format(value), name]} />

                                            {chartMode === 'value' ? (
                                                <>
                                                    <Area type="monotone" dataKey="invested" name="Investi" stroke="#8884d8" strokeWidth={1.5} strokeDasharray="5 3" fillOpacity={0} />
                                                    <Area type="monotone" dataKey="value" name="Valeur" stroke="#7C5CFC" strokeWidth={2.5} fillOpacity={1} fill="url(#gradV)" activeDot={{ r: 6, fill: "#fff", stroke: "#7C5CFC", strokeWidth: 3 }} />
                                                </>
                                            ) : (
                                                <Area type="monotone" dataKey="profit" name="Profit" stroke="#00C9A7" strokeWidth={2.5} fillOpacity={1} fill="url(#gradP)" activeDot={{ r: 6, fill: "#fff", stroke: "#00C9A7", strokeWidth: 3 }} />
                                            )}

                                        </AreaChart>
                                    </ResponsiveContainer>
                                </Box>
                            </Box>

                            {/* Right: Recent Activity */}
                            <Box sx={{ borderRadius: "16px", bgcolor: isDark ? "#151226" : "#ffffff", border: `1px solid ${isDark ? "#282346" : theme.palette.divider}`, p: 2.5 }}>
                                <Typography sx={{ fontWeight: 600, fontSize: "1rem", color: "text.primary", mb: 3 }}>Recent Activity</Typography>
                                <Stack spacing={2}>
                                    {data.recentActivity && data.recentActivity.length > 0 ? (
                                        data.recentActivity.slice(0, 5).map((act, i) => (
                                            <Stack key={i} direction="row" justifyContent="space-between" alignItems="center" sx={{ borderBottom: i < Math.min(data.recentActivity.length - 1, 4) ? `1px solid ${isDark ? alpha("#FFF", 0.05) : alpha("#000", 0.05)}` : "none", pb: i < Math.min(data.recentActivity.length - 1, 4) ? 2 : 0 }}>
                                                <Stack direction="row" alignItems="center" spacing={2}>
                                                    <Box sx={{ width: 36, height: 36, borderRadius: "10px", bgcolor: isDark ? alpha("#FFF", 0.05) : alpha("#000", 0.05), border: `1px solid ${isDark ? alpha("#FFF", 0.1) : alpha("#000", 0.1)}`, display: "flex", alignItems: "center", justifyContent: "center", color: "text.secondary" }}>
                                                        {act.type === 'dividend' ? <MonetizationOnRoundedIcon sx={{ fontSize: 18, color: "success.main" }} /> : act.txType === 'buy' ? <TrendingUpRoundedIcon sx={{ fontSize: 18, color: "text.primary" }} /> : <TrendingDownRoundedIcon sx={{ fontSize: 18, color: "error.main" }} />}
                                                    </Box>
                                                    <Box>
                                                        <Typography sx={{ fontSize: "0.8rem", color: "text.primary", fontWeight: 500 }}>{act.title}</Typography>
                                                        <Typography sx={{ fontSize: "0.65rem", color: "text.secondary" }}>{new Date(act.timeMs).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</Typography>
                                                    </Box>
                                                </Stack>
                                                <Box sx={{ textAlign: "right" }}>
                                                    <Typography sx={{ fontSize: "0.85rem", color: ((act.txType === 'sell' && act.type === 'transaction') || act.amount < 0) ? "error.main" : "text.primary", fontWeight: 600, fontFamily: MONO_FONT }}>
                                                        {((act.txType === 'sell' && act.type === 'transaction') || act.amount < 0) ? "-" : "+"}
                                                        {new Intl.NumberFormat("fr-FR", { style: "currency", currency: cc, maximumFractionDigits: 2 }).format(Math.abs(act.amount) * multiplier)}
                                                    </Typography>
                                                    <Stack direction="row" alignItems="center" spacing={0.5} justifyContent="flex-end">
                                                        {(act.color === "success.main" || act.color === "error.main") && <Typography sx={{ color: act.color, fontSize: "0.6rem" }}>✓</Typography>}
                                                        <Typography sx={{ fontSize: "0.65rem", color: act.color }}>{act.status}</Typography>
                                                    </Stack>
                                                </Box>
                                            </Stack>
                                        ))
                                    ) : (
                                        <Typography sx={{ fontSize: "0.85rem", color: "text.secondary", fontStyle: "italic", textAlign: "center", mt: 4, mb: 4 }}>
                                            Aucune activité récente pour cette période.
                                        </Typography>
                                    )}
                                </Stack>
                            </Box>
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

            {/* AI FAB */}
            <Fab
                variant="extended"
                onClick={() => setAiDrawerOpen(true)}
                sx={{
                    position: "fixed",
                    bottom: 24,
                    right: 24,
                    bgcolor: accentColor,
                    color: "#000",
                    fontWeight: 700,
                    textTransform: "none",
                    boxShadow: `0 8px 24px ${alpha(accentColor, 0.4)}`,
                    "&:hover": {
                        bgcolor: isDark ? "#fff" : "#000",
                        color: isDark ? "#000" : "#fff",
                    }
                }}
            >
                <AutoAwesomeRoundedIcon sx={{ mr: 1, fontSize: 20 }} />
                Demander à l'IA
            </Fab>

            {/* AI DRAWER */}
            <Drawer
                anchor="right"
                open={aiDrawerOpen}
                onClose={() => setAiDrawerOpen(false)}
                PaperProps={{
                    sx: { width: { xs: "100%", sm: 400 }, bgcolor: isDark ? "#12121c" : "#fafafa", backgroundImage: "none", display: "flex", flexDirection: "column" }
                }}
            >
                <Box sx={{ p: 2, borderBottom: `1px solid ${isDark ? "#282346" : theme.palette.divider}`, display: "flex", alignItems: "center", bgcolor: isDark ? "#151226" : "#fff" }}>
                    <AutoAwesomeRoundedIcon sx={{ color: accentColor, mr: 1.5 }} />
                    <Typography sx={{ fontWeight: 700, flex: 1 }}>Invest AI</Typography>
                    <IconButton onClick={handleClearAiChat} size="small" sx={{ mr: 1, color: "text.secondary" }} title="Effacer la conversation">
                        <DeleteIcon fontSize="small" />
                    </IconButton>
                    <IconButton onClick={() => setAiDrawerOpen(false)} size="small"><ChevronRightIcon /></IconButton>
                </Box>
                <Box sx={{ flex: 1, overflowY: "auto", p: 2, display: "flex", flexDirection: "column", gap: 2 }}>
                    {aiMessages.length === 0 && (
                        <Box sx={{ p: 3, textAlign: "center", opacity: 0.6 }}>
                            <Typography sx={{ fontSize: "0.85rem", mb: 2 }}>Posez-moi une question sur l'évolution de votre portefeuille, vos rendements ou transactions récentes.</Typography>
                            <Typography sx={{ fontSize: "0.75rem", fontStyle: "italic" }}>"Pourquoi j'ai eu un pic de 5000€ le 27 Février ?"</Typography>
                        </Box>
                    )}
                    {aiMessages.map(msg => (
                        <Box key={msg.id} sx={{ alignSelf: msg.role === "user" ? "flex-end" : "flex-start", maxWidth: "85%", bgcolor: msg.role === "user" ? accentColor : isDark ? "#1f1d36" : "#fff", color: msg.role === "user" ? "#000" : "text.primary", p: 1.5, borderRadius: "12px", borderBottomRightRadius: msg.role === "user" ? "0px" : "12px", borderBottomLeftRadius: msg.role === "model" ? "0px" : "12px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)", border: msg.role === "model" ? `1px solid ${isDark ? "#2a264f" : "#eee"}` : "none" }}>
                            <Typography component="div" sx={{ fontSize: "0.85rem", '& p': { m: 0 }, '& ul': { mt: 0, pl: 2 }, '& table': { borderCollapse: 'collapse', width: '100%', mt: 1 }, '& th, & td': { border: `1px solid ${isDark ? '#444' : '#ddd'}`, px: 1, py: 0.5, textAlign: 'left' } }}>
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text || (aiLoading ? "..." : "")}</ReactMarkdown>
                            </Typography>
                        </Box>
                    ))}
                    <div ref={messagesEndRef} />
                </Box>
                <Box sx={{ p: 2, bgcolor: isDark ? "#151226" : "#fff", borderTop: `1px solid ${isDark ? "#282346" : theme.palette.divider}` }}>
                    <TextField
                        fullWidth
                        size="small"
                        placeholder="Posez une question..."
                        value={aiInput}
                        onChange={e => setAiInput(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleAskAi();
                            }
                        }}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton onClick={handleAskAi} disabled={aiLoading || !aiInput.trim()} sx={{ color: accentColor }}>
                                        <SendRoundedIcon fontSize="small" />
                                    </IconButton>
                                </InputAdornment>
                            ),
                            sx: { borderRadius: "10px", fontSize: "0.85rem", bgcolor: isDark ? "#12121c" : "#f5f5f5", "& fieldset": { border: "none" } }
                        }}
                    />
                </Box>
            </Drawer>

        </Box>
    );
}
