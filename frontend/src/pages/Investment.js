import {
    Avatar,
    Box,
    Button,
    Chip,
    CircularProgress,
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
    TableRow,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Typography,
    alpha,
    useTheme
} from "@mui/material";
import { useEffect, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import DeleteIcon from "@mui/icons-material/Delete";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";

import {
    addInvestment,
    deleteInvestment,
    getPortfolioChartData,
} from "../services/investmentClient";

// ─── Constants ────────────────────────────────────────────────────
const MONO_FONT = `"JetBrains Mono", "SF Mono", "Fira Code", monospace`;

const StatCard = ({ label, value, type = "currency", currency = "USD", trendValue = null }) => {
    const theme = useTheme();
    const isDark = theme.palette.mode === "dark";
    const formattedValue =
        type === "currency"
            ? new Intl.NumberFormat("fr-FR", { style: "currency", currency }).format(value || 0)
            : value;

    const color = trendValue && trendValue > 0 ? theme.palette.success.main : trendValue && trendValue < 0 ? theme.palette.error.main : theme.palette.text.primary;

    return (
        <Box
            sx={{
                p: 3,
                borderRadius: "16px",
                bgcolor: isDark ? alpha("#FFFFFF", 0.03) : "background.paper",
                border: `1px solid ${theme.palette.divider}`,
                boxShadow: isDark
                    ? "inset 0 1px 0 rgba(255,255,255,0.05)"
                    : "0 4px 12px rgba(15,23,42,0.04)",
            }}
        >
            <Typography
                sx={{
                    fontSize: "0.62rem",
                    fontWeight: 700,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "text.secondary",
                    mb: 1,
                }}
            >
                {label}
            </Typography>
            <Typography
                sx={{
                    fontFamily: MONO_FONT,
                    fontSize: "1.7rem",
                    fontWeight: 800,
                    letterSpacing: "-0.03em",
                    color: "text.primary",
                }}
            >
                {formattedValue}
            </Typography>
            {trendValue !== null && (
                <Typography
                    sx={{
                        fontFamily: MONO_FONT,
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        color,
                        mt: 1,
                    }}
                >
                    {trendValue > 0 ? "+" : ""}
                    {new Intl.NumberFormat("fr-FR", {
                        style: "currency",
                        currency,
                    }).format(trendValue)}
                </Typography>
            )}
        </Box>
    );
};

export default function Investment() {
    const theme = useTheme();
    const isDark = theme.palette.mode === "dark";

    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState("1y");
    const [currency, setCurrency] = useState("EUR");
    const [cache, setCache] = useState({});
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
    });

    const loadData = async (forceRefresh = false) => {
        if (!forceRefresh && cache[period]) {
            setData(cache[period]);
            setLoading(false);
            // Non-blocking background update
            getPortfolioChartData(period).then(res => {
                setCache(prev => ({ ...prev, [period]: res }));
                if (period === res.periodRequested) setData(res); // Optional sync
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

    // Asynchronous background prefetch of the 'ALL' period to ensure 0-wait when users click on it
    useEffect(() => {
        let isMounted = true;
        // Small delay to ensure the main '1y' data loads first without competing for network
        setTimeout(() => {
            if (isMounted && !cache['all']) {
                getPortfolioChartData('all')
                    .then(res => {
                        if (isMounted) {
                            setCache(prev => ({ ...prev, all: res }));
                        }
                    })
                    .catch(() => { }); // silent fail
            }
        }, 1500);
        return () => { isMounted = false; };
    }, []);

    const totalPnL = data.currentPortValue - data.totalInvested;

    const eurToUsdRate = data.eurToUsdRate || 1;
    const isUSD = currency === "USD";
    const multiplier = isUSD ? eurToUsdRate : 1;
    const cc = isUSD ? "USD" : "EUR";

    const handleAddInvestment = async () => {
        await addInvestment({
            ticker: form.ticker,
            quantity: parseFloat(form.quantity),
            average_price: parseFloat(form.average_price),
            buy_date: form.buy_date,
        });
        setOpenDialog(false);
        setForm({ ticker: "", quantity: "", average_price: "", buy_date: "" });
        setCache({}); // invalidate cache
        loadData(true);
    };

    const handleDelete = async (id) => {
        await deleteInvestment(id);
        setCache({}); // invalidate cache
        loadData(true);
    };

    const MANUAL_LOGOS = {
        "GOOGL": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/1024px-Google_%22G%22_logo.svg.png",
        "GOOG": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/1024px-Google_%22G%22_logo.svg.png",
        "MC.PA": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bd/LVMH_logo.svg/1024px-LVMH_logo.svg.png",
        "OR.PA": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/L%27Or%C3%A9al_logo.svg/1024px-L%27Or%C3%A9al_logo.svg.png",
        "AI.PA": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Air_Liquide_logo_2017.svg/1024px-Air_Liquide_logo_2017.svg.png",
        "TTE.PA": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/TotalEnergies_logo.svg/1024px-TotalEnergies_logo.svg.png",
        "TTWO": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Take-Two_Interactive_Logo.svg/1024px-Take-Two_Interactive_Logo.svg.png",
        "NOV.DE": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Novo_Nordisk_logo.svg/1024px-Novo_Nordisk_logo.svg.png",
        "ESE.PA": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/BNP_Paribas_logo.svg/1024px-BNP_Paribas_logo.svg.png"
    };

    return (
        <Box
            sx={{
                minHeight: "100vh",
                pb: 4,
                px: { xs: 2, sm: 3, md: 4 },
                pt: { xs: 2, md: 3 },
            }}
        >
            {/* ── HEADER ─────────────────────────────────────── */}
            <Fade in timeout={500}>
                <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ mb: 4 }}
                >
                    <Box>
                        <Typography
                            sx={{
                                fontSize: "0.62rem",
                                fontWeight: 700,
                                letterSpacing: "0.12em",
                                textTransform: "uppercase",
                                color: "text.secondary",
                                mb: 0.5,
                            }}
                        >
                            Portefeuille Boursier
                        </Typography>
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                            <TrendingUpRoundedIcon
                                sx={{
                                    fontSize: 22,
                                    color: "secondary.main",
                                    filter: isDark
                                        ? `drop-shadow(0 0 6px ${theme.palette.secondary.main}90)`
                                        : "none",
                                }}
                            />
                            <Typography
                                sx={{
                                    fontSize: { xs: "1.5rem", md: "1.8rem" },
                                    fontWeight: 800,
                                    letterSpacing: "-0.03em",
                                    color: "text.primary",
                                }}
                            >
                                Investissements
                            </Typography>
                        </Stack>
                    </Box>
                    <Stack direction="row" spacing={2} alignItems="center">
                        <ToggleButtonGroup
                            value={currency}
                            exclusive
                            onChange={(e, val) => val && setCurrency(val)}
                            size="small"
                            sx={{
                                bgcolor: isDark ? alpha("#FFFFFF", 0.05) : "background.paper",
                                boxShadow: isDark ? "none" : `0 2px 8px ${alpha(theme.palette.secondary.main, 0.1)}`,
                            }}
                        >
                            <ToggleButton value="EUR" sx={{ px: 2, py: 0.5, fontWeight: 700 }}>€</ToggleButton>
                            <ToggleButton value="USD" sx={{ px: 2, py: 0.5, fontWeight: 700 }}>$</ToggleButton>
                        </ToggleButtonGroup>
                        <Button
                            variant="contained"
                            color="secondary"
                            onClick={() => setOpenDialog(true)}
                            sx={{
                                borderRadius: "10px",
                                textTransform: "none",
                                fontWeight: 700,
                                boxShadow: isDark ? `0 4px 18px ${alpha(theme.palette.secondary.main, 0.4)}` : "none",
                            }}
                        >
                            + Ajouter
                        </Button>
                    </Stack>
                </Stack>
            </Fade>

            {loading ? (
                <Box sx={{ py: 20, display: "flex", justifyContent: "center" }}>
                    <CircularProgress color="secondary" />
                </Box>
            ) : (
                <Fade in timeout={700}>
                    <Box>
                        {/* ── KPI ROW ───────────────────────────────────── */}
                        <Box
                            sx={{
                                display: "grid",
                                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" },
                                gap: 2,
                                mb: 4,
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
                                label="Performance Globale (%)"
                                value={
                                    data.totalInvested
                                        ? ((totalPnL / data.totalInvested) * 100).toFixed(2)
                                        : 0
                                }
                                type="number"
                                trendValue={
                                    data.totalInvested
                                        ? ((totalPnL / data.totalInvested) * 100).toFixed(2)
                                        : 0
                                }
                            />
                        </Box>

                        {/* ── CHART ─────────────────────────────────────── */}
                        <Box
                            sx={{
                                p: 3,
                                borderRadius: "16px",
                                bgcolor: isDark ? alpha("#FFFFFF", 0.03) : "background.paper",
                                border: `1px solid ${theme.palette.divider}`,
                                mb: 4,
                            }}
                        >
                            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                                <Typography
                                    sx={{
                                        fontSize: "1rem",
                                        fontWeight: 700,
                                        color: "text.primary",
                                    }}
                                >
                                    Évolution du Portefeuille
                                </Typography>
                                <Stack direction="row" spacing={0.5} sx={{ bgcolor: isDark ? alpha("#FFFFFF", 0.05) : alpha("#000000", 0.03), p: 0.5, borderRadius: "8px" }}>
                                    {[
                                        { label: '1J', value: '1d' },
                                        { label: '1S', value: '1w' },
                                        { label: '1M', value: '1m' },
                                        { label: 'YTD', value: 'ytd' },
                                        { label: '1A', value: '1y' },
                                        { label: 'TOUT', value: 'all' },
                                    ].map((opt) => (
                                        <Button
                                            key={opt.value}
                                            variant={period === opt.value ? 'contained' : 'text'}
                                            color="secondary"
                                            size="small"
                                            onClick={() => setPeriod(opt.value)}
                                            sx={{
                                                minWidth: 'auto',
                                                px: 1.5,
                                                py: 0.5,
                                                fontSize: '0.75rem',
                                                fontWeight: period === opt.value ? 800 : 600,
                                                borderRadius: "6px",
                                                color: period === opt.value ? (isDark ? '#000' : '#FFF') : 'text.secondary',
                                                boxShadow: period === opt.value ? (isDark ? `0 2px 10px ${alpha(theme.palette.secondary.main, 0.5)}` : "none") : "none",
                                            }}
                                        >
                                            {opt.label}
                                        </Button>
                                    ))}
                                </Stack>
                            </Stack>
                            <Box sx={{ height: 400 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart
                                        data={data.chart.map(c => ({
                                            ...c,
                                            value: c.value * multiplier,
                                            invested: c.invested * multiplier
                                        }))}
                                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                                    >
                                        <defs>
                                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={theme.palette.secondary.main} stopOpacity={0.4} />
                                                <stop offset="95%" stopColor={theme.palette.secondary.main} stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorInvested" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.2} />
                                                <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={alpha(theme.palette.divider, 0.5)} />
                                        <XAxis
                                            dataKey="date"
                                            tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
                                            tickFormatter={(str) => {
                                                const d = new Date(str);
                                                if (period === '1d' || period === '1w') {
                                                    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                                                }
                                                return `${d.getDate()}/${d.getMonth() + 1}`;
                                            }}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <YAxis
                                            domain={["auto", "auto"]}
                                            tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
                                            axisLine={false}
                                            tickLine={false}
                                            tickFormatter={(val) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: cc, maximumFractionDigits: 0 }).format(val)}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: theme.palette.background.paper,
                                                borderRadius: "8px",
                                                border: "none",
                                                boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                                            }}
                                            labelStyle={{ color: theme.palette.text.secondary, marginBottom: 4 }}
                                            formatter={(value) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: cc }).format(value)}
                                            labelFormatter={(label) => {
                                                const d = new Date(label);
                                                return d.toLocaleDateString("fr-FR", {
                                                    weekday: "long",
                                                    day: "numeric",
                                                    month: "long",
                                                    year: "numeric",
                                                    hour: (period === '1d' || period === '1w') ? '2-digit' : undefined,
                                                    minute: (period === '1d' || period === '1w') ? '2-digit' : undefined,
                                                });
                                            }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="invested"
                                            name="Investi"
                                            stroke="#8884d8"
                                            strokeWidth={2}
                                            fillOpacity={1}
                                            fill="url(#colorInvested)"
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="value"
                                            name="Valeur"
                                            stroke={theme.palette.secondary.main}
                                            strokeWidth={3}
                                            fillOpacity={1}
                                            fill="url(#colorValue)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </Box>
                        </Box>

                        {/* ── HOLDINGS TABLE ────────────────────────────── */}
                        <Box
                            sx={{
                                p: { xs: 2, md: 3 },
                                borderRadius: "16px",
                                bgcolor: isDark ? alpha("#FFFFFF", 0.03) : "background.paper",
                                border: `1px solid ${theme.palette.divider}`,
                            }}
                        >
                            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
                                <Typography
                                    sx={{
                                        fontSize: "1rem",
                                        fontWeight: 700,
                                        color: "text.primary",
                                    }}
                                >
                                    Actifs Détenus
                                </Typography>
                                {data.investments.length > 0 && (
                                    <Chip
                                        label={data.investments.length}
                                        size="small"
                                        sx={{
                                            bgcolor: isDark ? alpha(theme.palette.secondary.main, 0.15) : alpha(theme.palette.secondary.main, 0.1),
                                            color: theme.palette.secondary.main,
                                            fontWeight: 800,
                                            fontSize: "0.75rem",
                                        }}
                                    />
                                )}
                            </Stack>
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow sx={{ "& th": { color: "text.secondary", fontWeight: 600, fontSize: "0.80rem", borderBottom: `2px solid ${theme.palette.divider}`, pb: 2 } }}>
                                            <TableCell>Actif</TableCell>
                                            <TableCell align="right">Qté</TableCell>
                                            <TableCell align="right">PRU (Investi)</TableCell>
                                            <TableCell align="right">Prix Actuel</TableCell>
                                            <TableCell align="right">Valeur</TableCell>
                                            <TableCell align="right">+/- Value</TableCell>
                                            <TableCell align="center">Actions</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {data.investments.map((inv) => {
                                            const assetSlug = inv.ticker.split('.')[0];
                                            const logoUrl = MANUAL_LOGOS[inv.ticker] || `https://financialmodelingprep.com/image-stock/${assetSlug}.png`;

                                            return (
                                                <TableRow
                                                    key={inv.id}
                                                    sx={{
                                                        "& td": { borderBottom: `1px solid ${theme.palette.divider}`, py: 2, verticalAlign: 'middle', fontFamily: MONO_FONT },
                                                        "&:hover": { bgcolor: isDark ? alpha("#FFFFFF", 0.02) : alpha("#0F172A", 0.02), transition: "background-color 0.2s" }
                                                    }}
                                                >
                                                    <TableCell sx={{ minWidth: 200, fontFamily: "inherit" }}>
                                                        <Stack direction="row" alignItems="center" spacing={2}>
                                                            <Avatar
                                                                src={logoUrl}
                                                                sx={{
                                                                    width: 42,
                                                                    height: 42,
                                                                    bgcolor: isDark ? alpha(theme.palette.secondary.main, 0.1) : alpha(theme.palette.secondary.main, 0.05),
                                                                    color: theme.palette.secondary.main,
                                                                    fontWeight: 800,
                                                                    fontSize: '1.2rem',
                                                                    border: `1px solid ${theme.palette.divider}`,
                                                                    boxShadow: isDark ? 'none' : `0 2px 8px ${alpha(theme.palette.secondary.main, 0.15)}`,
                                                                }}
                                                            >
                                                                {inv.ticker.slice(0, 1)}
                                                            </Avatar>
                                                            <Box>
                                                                <Typography sx={{ fontWeight: 800, fontSize: "0.95rem", color: "text.primary", fontFamily: MONO_FONT }}>
                                                                    {inv.ticker}
                                                                </Typography>
                                                                <Typography sx={{ fontSize: "0.75rem", color: "text.secondary", fontWeight: 500, letterSpacing: "-0.01em", mt: 0.2 }}>
                                                                    {inv.longName && inv.longName !== inv.ticker ? (inv.longName.length > 25 ? inv.longName.slice(0, 25) + '...' : inv.longName) : "Action / ETF"}
                                                                </Typography>
                                                            </Box>
                                                        </Stack>
                                                    </TableCell>
                                                    <TableCell align="right">{inv.quantity.toLocaleString(undefined, { maximumFractionDigits: 4 })}</TableCell>
                                                    <TableCell align="right">{new Intl.NumberFormat("fr-FR", { style: "currency", currency: cc }).format(inv.average_price * multiplier)}</TableCell>
                                                    <TableCell align="right">{new Intl.NumberFormat("fr-FR", { style: "currency", currency: cc }).format((inv.current_price || 0) * multiplier)}</TableCell>
                                                    <TableCell align="right" sx={{ fontWeight: 700, color: "text.primary" }}>
                                                        {new Intl.NumberFormat("fr-FR", { style: "currency", currency: cc }).format((inv.current_value || 0) * multiplier)}
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Typography
                                                            sx={{
                                                                fontFamily: MONO_FONT,
                                                                fontWeight: 700,
                                                                color: inv.profit_loss >= 0 ? "success.main" : "error.main",
                                                            }}
                                                        >
                                                            {inv.profit_loss >= 0 ? "+" : ""}{new Intl.NumberFormat("fr-FR", { style: "currency", currency: cc }).format((inv.profit_loss || 0) * multiplier)}
                                                            {" "} ({(inv.profit_loss_pct || 0).toFixed(2)}%)
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <IconButton size="small" color="error" onClick={() => handleDelete(inv.id)} sx={{ opacity: 0.6, "&:hover": { opacity: 1, bgcolor: alpha(theme.palette.error.main, 0.1) } }}>
                                                            <DeleteIcon fontSize="small" />
                                                        </IconButton>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                        {data.investments.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={7} align="center" sx={{ py: 4, color: "text.secondary" }}>
                                                    Aucun actif dans le portefeuille.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Box>
                    </Box>
                </Fade>
            )}

            {/* ── DIALOG ADD INVESTMENT ─────────────────────── */}
            <Dialog
                open={openDialog}
                onClose={() => setOpenDialog(false)}
                PaperProps={{
                    sx: {
                        borderRadius: "16px",
                        bgcolor: "background.paper",
                        backgroundImage: "none",
                        p: 1,
                        minWidth: 400,
                    },
                }}
            >
                <DialogTitle sx={{ fontWeight: 800 }}>Ajouter un actif</DialogTitle>
                <DialogContent>
                    <Stack spacing={3} sx={{ mt: 1 }}>
                        <TextField
                            label="Ticker (ex: AAPL, TSLA)"
                            variant="outlined"
                            fullWidth
                            value={form.ticker}
                            onChange={(e) => setForm({ ...form, ticker: e.target.value.toUpperCase() })}
                        />
                        <TextField
                            label="Quantité"
                            type="number"
                            variant="outlined"
                            fullWidth
                            value={form.quantity}
                            onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                        />
                        <TextField
                            label="Prix Moyen d'Achat (PRU)"
                            type="number"
                            variant="outlined"
                            fullWidth
                            value={form.average_price}
                            onChange={(e) => setForm({ ...form, average_price: e.target.value })}
                        />
                        <TextField
                            label="Date d'achat (optionnel)"
                            type="date"
                            variant="outlined"
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            value={form.buy_date}
                            onChange={(e) => setForm({ ...form, buy_date: e.target.value })}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <Button onClick={() => setOpenDialog(false)} sx={{ color: "text.secondary" }}>
                        Annuler
                    </Button>
                    <Button onClick={handleAddInvestment} variant="contained" color="secondary" sx={{ borderRadius: "8px" }}>
                        Ajouter
                    </Button>
                </DialogActions>
            </Dialog>
        </Box >
    );
}
