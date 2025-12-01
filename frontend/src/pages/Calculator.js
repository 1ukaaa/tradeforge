import CalculateRoundedIcon from "@mui/icons-material/CalculateRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import {
    Box,
    Card,
    Chip,
    Container,
    Divider,
    Grid,
    InputAdornment,
    Stack,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Typography,
    alpha,
    useTheme
} from "@mui/material";
import { useEffect, useState } from "react";

const ASSETS = [
    { id: "ES", name: "ES", tickValue: 12.50 },
    { id: "NQ", name: "NQ", tickValue: 5.00 },
    { id: "CL", name: "CL", tickValue: 10.00 },
    { id: "GC", name: "GC", tickValue: 10.00 },
    { id: "MES", name: "MES", tickValue: 1.25 },
    { id: "MNQ", name: "MNQ", tickValue: 0.50 },
    { id: "MCL", name: "MCL", tickValue: 1.00 },
    { id: "MGC", name: "MGC", tickValue: 1.00 },
];

const Calculator = () => {
    const theme = useTheme();

    // State - Initialized from localStorage if available
    const [capital, setCapital] = useState(() => parseFloat(localStorage.getItem("tf_calc_capital")) || 50000);
    const [riskType, setRiskType] = useState(() => localStorage.getItem("tf_calc_riskType") || "percent");
    const [riskValue, setRiskValue] = useState(() => localStorage.getItem("tf_calc_riskValue") || "1");

    // Volatile State (Reset on reload usually, but we can keep asset)
    const [selectedAssetId, setSelectedAssetId] = useState(() => localStorage.getItem("tf_calc_asset") || "ES");
    const [stopLossTicks, setStopLossTicks] = useState("20");

    // Computed results
    const [results, setResults] = useState({ contracts: 0, actualRisk: 0 });

    // Handle conversion between % and $
    const handleRiskTypeChange = (e, newType) => {
        if (!newType) return;

        const currentVal = parseFloat(String(riskValue).replace(',', '.')) || 0;
        let newVal = 0;

        if (newType === 'amount') {
            // % -> $
            newVal = (capital * currentVal) / 100;
            setRiskValue(newVal.toFixed(2));
        } else {
            // $ -> %
            if (capital > 0) {
                newVal = (currentVal / capital) * 100;
                setRiskValue(newVal.toFixed(2));
            }
        }
        setRiskType(newType);
    };

    // Persist settings
    useEffect(() => {
        localStorage.setItem("tf_calc_capital", capital);
        localStorage.setItem("tf_calc_riskType", riskType);
        localStorage.setItem("tf_calc_riskValue", riskValue);
        localStorage.setItem("tf_calc_asset", selectedAssetId);
    }, [capital, riskType, riskValue, selectedAssetId]);

    useEffect(() => {
        const asset = ASSETS.find((a) => a.id === selectedAssetId);
        if (!asset) return;

        const parsedRisk = parseFloat(String(riskValue).replace(',', '.')) || 0;
        let targetRiskAmount = riskType === "percent" ? (capital * parsedRisk) / 100 : parsedRisk;

        const ticks = parseFloat(stopLossTicks) || 0;
        const riskPerContract = ticks * asset.tickValue;

        if (riskPerContract <= 0) {
            setResults({ contracts: 0, actualRisk: 0 });
            return;
        }

        const contracts = Math.floor(targetRiskAmount / riskPerContract);
        setResults({
            contracts,
            actualRisk: contracts * riskPerContract,
        });
    }, [capital, riskType, riskValue, selectedAssetId, stopLossTicks]);

    const selectedAsset = ASSETS.find((a) => a.id === selectedAssetId);

    return (
        <Container maxWidth="md" sx={{ mt: 4 }}>
            <Box sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                <CalculateRoundedIcon color="primary" />
                <Typography variant="h6" fontWeight="bold">Quick Calculator</Typography>
            </Box>

            <Card
                elevation={0}
                sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', md: 'row' },
                    borderRadius: 4,
                    border: `1px solid ${theme.palette.divider}`,
                    overflow: 'hidden',
                    bgcolor: theme.palette.background.paper
                }}
            >
                {/* LEFT PANEL: INPUTS */}
                <Box sx={{ p: 3, flex: 1.5 }}>

                    {/* 1. ASSET SELECTION (Pills) */}
                    <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                        ACTIF
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ mb: 3, flexWrap: 'wrap', gap: 1 }}>
                        {ASSETS.map((asset) => (
                            <Chip
                                key={asset.id}
                                label={asset.name}
                                onClick={() => setSelectedAssetId(asset.id)}
                                color={selectedAssetId === asset.id ? "primary" : "default"}
                                variant={selectedAssetId === asset.id ? "filled" : "outlined"}
                                sx={{
                                    fontWeight: 'bold',
                                    borderRadius: 2,
                                    border: selectedAssetId !== asset.id ? `1px solid ${theme.palette.divider}` : 'none',
                                    // Force correct text color when selected
                                    ...(selectedAssetId === asset.id && {
                                        color: theme.palette.mode === 'dark' ? theme.palette.common.black : '#fff',
                                        backgroundImage: 'none',
                                    })
                                }}
                            />
                        ))}
                    </Stack>

                    {/* 2. STOP LOSS (Main Input) */}
                    <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                        STOP LOSS (TICKS)
                    </Typography>
                    <TextField
                        fullWidth
                        type="number"
                        value={stopLossTicks}
                        onChange={(e) => setStopLossTicks(e.target.value)}
                        placeholder="20"
                        InputProps={{
                            sx: { fontSize: '1.5rem', fontWeight: 'bold', py: 1 }
                        }}
                        helperText={`Risque par contrat: $${((parseFloat(stopLossTicks) || 0) * (selectedAsset?.tickValue || 0)).toFixed(2)}`}
                    />

                    <Divider sx={{ my: 3 }} />

                    {/* 3. SETTINGS (Compact) */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <SettingsRoundedIcon fontSize="small" color="action" />
                        <Typography variant="caption" fontWeight="bold" color="text.secondary">
                            PARAMÈTRES DU COMPTE
                        </Typography>
                    </Box>

                    <Grid container spacing={2}>
                        <Grid item xs={6}>
                            <TextField
                                label="Capital"
                                size="small"
                                fullWidth
                                value={capital}
                                onChange={(e) => setCapital(parseFloat(e.target.value) || 0)}
                                InputProps={{
                                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                                }}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <TextField
                                    label="Risque"
                                    size="small"
                                    fullWidth
                                    value={riskValue}
                                    onChange={(e) => setRiskValue(e.target.value)}
                                />
                                <ToggleButtonGroup
                                    value={riskType}
                                    exclusive
                                    onChange={handleRiskTypeChange}
                                    size="small"
                                >
                                    <ToggleButton value="percent">%</ToggleButton>
                                    <ToggleButton value="amount">$</ToggleButton>
                                </ToggleButtonGroup>
                            </Box>
                        </Grid>
                    </Grid>
                </Box>

                {/* RIGHT PANEL: RESULT */}
                <Box sx={{
                    flex: 1,
                    background: theme.palette.mode === 'dark'
                        ? alpha(theme.palette.primary.main, 0.1)
                        : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                    color: theme.palette.mode === 'dark' ? theme.palette.primary.main : 'white',
                    p: 4,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    textAlign: 'center',
                    borderLeft: { md: `1px solid ${theme.palette.divider}` },
                    position: 'relative'
                }}>
                    <Typography variant="overline" sx={{ opacity: 0.8, letterSpacing: 2 }}>
                        POSITION
                    </Typography>

                    <Typography variant="h1" fontWeight="800" sx={{ fontSize: '6rem', lineHeight: 1, my: 2 }}>
                        {results.contracts}
                    </Typography>

                    <Typography variant="h5" fontWeight="500" sx={{ opacity: 0.9 }}>
                        CONTRAT{results.contracts > 1 ? 'S' : ''}
                    </Typography>

                    <Box sx={{ mt: 4, p: 2, bgcolor: 'background.paper', borderRadius: 2, width: '100%', maxWidth: 200, boxShadow: 1 }}>
                        <Typography variant="caption" color="text.secondary" display="block">
                            RISQUE RÉEL
                        </Typography>
                        <Typography variant="h6" color="text.primary" fontWeight="bold">
                            ${results.actualRisk.toFixed(2)}
                        </Typography>
                    </Box>
                </Box>
            </Card>
        </Container>
    );
};

export default Calculator;
