// frontend/src/components/EditEntryForm.js
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  Grid,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { useMemo } from "react";
import {
  TIMEFRAME_OPTIONS,
  normalizeTimeframes,
} from "../utils/timeframeUtils";
import { getCurrencySymbol } from "../utils/accountUtils";

const RESULT_OPTIONS = [
  { value: "TP", label: "TP" },
  { value: "SL", label: "SL" },
  { value: "BE", label: "BE" },
  { value: "N/A", label: "N/A" },
];
const SYMBOL_SUGGESTIONS = ["EURUSD", "NAS100", "US30", "DAX", "UKOIL", "BTCUSD", "ETHUSD"];

// --- Composant Principal ---

const EditEntryForm = ({
  entry,
  accountOptions = [],
  brokerTrades = [],
  onDataChange,
  onImageDelete,
  onImageClick,
  onSetMainImage,
}) => {
  
  // --- Handlers ---

  const handleMetaChange = (field) => (event) => {
    onDataChange({
      ...entry,
      metadata: { ...entry.metadata, [field]: event.target.value },
    });
  };
  
  const handleSymbolChange = (event, newValue) => {
     onDataChange({
      ...entry,
      metadata: { ...entry.metadata, symbol: newValue || "" },
    });
  };
  
  const handleResultChange = (event, newValue) => {
    if (newValue) { 
      onDataChange({
        ...entry,
        metadata: { ...entry.metadata, result: newValue },
      });
    }
  };

  const handleContentChange = (event) => {
    onDataChange({ ...entry, content: event.target.value });
  };

  const handleTagsChange = (event, newValue) => {
    onDataChange({
      ...entry,
      metadata: {
        ...entry.metadata,
        tags: newValue.map((value) =>
          typeof value === "string" ? value : value.inputValue
        ),
      },
    });
  };

  const handleAccountChange = (event) => {
    const account = accountOptions.find((acc) => acc.id === event.target.value);
    onDataChange({
      ...entry,
      metadata: {
        ...entry.metadata,
        accountId: account?.id,
        accountName: account?.name,
        pnlCurrency: account?.currency || entry.metadata.pnlCurrency,
        brokerTradeId: undefined,
        brokerTradeLabel: undefined,
      },
    });
  };

  const handleBrokerTradeChange = (_, newTrade) => {
    if (!newTrade) {
      onDataChange({
        ...entry,
        metadata: {
          ...entry.metadata,
          brokerTradeId: undefined,
          brokerTradeLabel: undefined,
        },
      });
      return;
    }
    onDataChange({
      ...entry,
      metadata: {
        ...entry.metadata,
        brokerTradeId: newTrade.id,
        brokerTradeLabel: formatBrokerTradeOption(newTrade),
        accountId: newTrade.brokerAccountId,
        accountName: newTrade.accountName,
        pnlAmount: newTrade.pnl,
        pnlCurrency: newTrade.currency,
        symbol: entry.metadata.symbol || newTrade.symbol,
      },
    });
  };

  const handleTimeframeChange = (event, newTimeframes) => {
    const normalized = normalizeTimeframes(newTimeframes || []);
    onDataChange({
      ...entry,
      metadata: { ...entry.metadata, timeframe: normalized },
    });
  };

  const images = entry.metadata.images || [];
  const metadataDateInput = (entry.metadata?.date || "").split("T")[0];
  const selectedAccount = accountOptions.find(
    (acc) => acc.id === entry.metadata.accountId
  ) || (accountOptions.length === 1 ? accountOptions[0] : null);
  const showAccountFields = entry.type === "trade" && accountOptions.length > 0;
  const availableBrokerTrades = useMemo(() => {
    if (!brokerTrades.length) return [];
    if (!selectedAccount) return brokerTrades;
    return brokerTrades.filter((trade) => trade.brokerAccountId === selectedAccount.id);
  }, [brokerTrades, selectedAccount]);
  const selectedBrokerTrade = useMemo(() => {
    if (!entry.metadata.brokerTradeId) return null;
    return (
      availableBrokerTrades.find(
        (trade) =>
          trade.id === entry.metadata.brokerTradeId ||
          (Array.isArray(trade.fillIds) && trade.fillIds.includes(entry.metadata.brokerTradeId))
      ) || null
    );
  }, [availableBrokerTrades, entry.metadata.brokerTradeId]);

  // --- Rendu ---

  return (
    <Stack spacing={2.5}>
      <TextField
        label="Titre de l'analyse"
        variant="outlined"
        size="small"
        fullWidth
        value={entry.metadata.title || ""}
        onChange={handleMetaChange("title")}
      />

      <TextField
        label="Date de l'entrée"
        type="date"
        size="small"
        value={metadataDateInput}
        onChange={handleMetaChange("date")}
        InputLabelProps={{
          shrink: true,
        }}
      />
      
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        
        <Autocomplete
          freeSolo
          options={SYMBOL_SUGGESTIONS}
          value={entry.metadata.symbol || ""}
          onInputChange={(e, val) => handleSymbolChange(e, val)}
          onChange={handleSymbolChange}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Symbole"
              variant="outlined"
              size="small"
            />
          )}
          sx={{ flex: 1 }}
        />

        {entry.type === "trade" && (
          <>
            <Stack spacing={1} sx={{flex: 1}}>
              <Typography variant="body2" color="text.secondary" sx={{fontSize: '0.75rem', ml: '2px'}}>
                Résultat
              </Typography>
              <ToggleButtonGroup
                value={entry.metadata.result || "N/A"}
                exclusive
                onChange={handleResultChange}
                size="small"
                fullWidth
              >
                {RESULT_OPTIONS.map((opt) => (
                  <ToggleButton key={opt.value} value={opt.value} sx={{flex: 1}}>
                    {opt.label}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Stack>

            <TextField
              label="Note / Verdict (ex: +1.5R, Erreur)"
              variant="outlined"
              size="small"
              value={entry.metadata.grade || ""}
              onChange={handleMetaChange("grade")}
              sx={{ flex: 1 }}
            />
          </>
        )}
      </Stack>

      {showAccountFields && (
        <Stack spacing={2}>
          <TextField
            select
            label="Compte associé"
            value={entry.metadata.accountId || selectedAccount?.id || ""}
            onChange={handleAccountChange}
            size="small"
            fullWidth
          >
            {accountOptions.map((account) => (
              <MenuItem key={account.id} value={account.id}>
                {account.name}
              </MenuItem>
            ))}
          </TextField>
          {availableBrokerTrades.length > 0 && (
            <Autocomplete
              options={availableBrokerTrades}
              value={selectedBrokerTrade}
              onChange={handleBrokerTradeChange}
              getOptionLabel={formatBrokerTradeOption}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Associer une position importée"
                  size="small"
                  helperText="Sélectionnez la position importée correspondante"
                />
              )}
            />
          )}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              label="Gain / Perte"
              type="number"
              size="small"
              value={entry.metadata.pnlAmount ?? ""}
              onChange={handleMetaChange("pnlAmount")}
              helperText="Positif = gain, négatif = perte"
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Box sx={{ pr: 0.5, fontWeight: 500, color: "text.secondary" }}>
                      {getCurrencySymbol(entry.metadata.pnlCurrency || selectedAccount?.currency)}
                    </Box>
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              label="% net"
              type="number"
              size="small"
              value={entry.metadata.pnlPercent ?? ""}
              onChange={handleMetaChange("pnlPercent")}
              helperText="Par rapport au capital du compte"
              fullWidth
            />
          </Stack>
        </Stack>
      )}

      <Stack spacing={1}>
        <Typography variant="body2" color="text.secondary">
          Timeframe(s)
        </Typography>
        <ToggleButtonGroup
          value={entry.metadata.timeframe || []}
          onChange={handleTimeframeChange}
          size="small"
          sx={{ flexWrap: "wrap" }}
        >
          {TIMEFRAME_OPTIONS.map((tf) => (
            <ToggleButton key={tf} value={tf}>
              {tf}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Stack>
      
      <Stack spacing={1}>
        <Typography variant="body2" color="text.secondary" sx={{fontSize: '0.75rem', ml: '2px'}}>
          Images (la première est l'image principale)
        </Typography>
        
        <Grid container spacing={1.5} wrap="nowrap" sx={{ overflowX: 'auto', pb: 1.5, pt: 0.5 }}>
          {images.map((image, index) => (
            <Grid item key={index} sx={{ flexShrink: 0, minWidth: 140 }}>
              <Paper
                variant="outlined"
                sx={{
                  position: 'relative',
                  overflow: 'hidden',
                  height: 120,
                  bgcolor: index === 0 ? 'action.selected' : 'action.hover',
                  borderWidth: 2,
                  borderColor: index === 0 ? 'primary.main' : 'divider',
                }}
              >
                <Box
                  component="img"
                  src={image.src}
                  alt={`Aperçu ${index + 1}`}
                  onClick={() => onImageClick(image.src)}
                  sx={{
                    maxHeight: "100%",
                    width: "auto",
                    maxWidth: "100%",
                    objectFit: "contain",
                    cursor: 'zoom-in',
                    display: 'block',
                    margin: '0 auto',
                    height: '100%',
                  }}
                />
                
                <Button
                  size="small"
                  variant="contained"
                  color="error"
                  onClick={(e) => { e.stopPropagation(); onImageDelete(index); }}
                  sx={{ 
                    position: 'absolute', 
                    top: 4, 
                    right: 4, 
                    minWidth: 0, 
                    width: 24, 
                    height: 24, 
                    p: 0,
                    lineHeight: 0,
                    fontSize: '1.1rem',
                  }}
                >
                  &times;
                </Button>
                
                {index > 0 && (
                  <Button
                    size="small"
                    variant="contained"
                    title="Mettre en image principale"
                    color="primary"
                    onClick={(e) => { e.stopPropagation(); onSetMainImage(index); }}
                    sx={{ 
                      position: 'absolute', 
                      bottom: 4, 
                      left: 4,
                      minWidth: 0, 
                      width: 24, 
                      height: 24, 
                      p: 0,
                    }}
                  >
                    <StarBorderIcon sx={{ fontSize: 16 }} />
                  </Button>
                )}
                
                {index === 0 && (
                  <Box
                    title="Image principale"
                    sx={{
                      position: 'absolute',
                      bottom: 4,
                      left: 4,
                      color: 'primary.main',
                      bgcolor: 'rgba(255,255,255,0.8)',
                      borderRadius: '50%',
                      display: 'flex',
                      p: 0.25
                    }}
                  >
                    <StarIcon sx={{ fontSize: 16 }} />
                  </Box>
                )}
              </Paper>
            </Grid>
          ))}
        </Grid>

        <Paper
          variant="outlined"
          sx={{
            p: images.length > 0 ? 2 : 4,
            textAlign: 'center',
            borderStyle: 'dashed',
            borderColor: 'divider',
            bgcolor: 'action.hover'
          }}
        >
          <Typography color="text.secondary">
            Collez vos images (Ctrl+V) n'importe où dans cette fenêtre.
          </Typography>
        </Paper>
      </Stack>

      <Autocomplete
        multiple
        freeSolo
        options={[]}
        value={entry.metadata.tags || []}
        onChange={handleTagsChange}
        renderTags={(value, getTagProps) =>
          value.map((option, index) => (
            <Chip
              variant="outlined"
              label={option}
              size="small"
              {...getTagProps({ index })}
            />
          ))
        }
        renderInput={(params) => (
          <TextField
            {...params}
            variant="outlined"
            label="Tags"
            size="small"
            placeholder="Ajouter des tags..."
          />
        )}
      />
      <TextField
        label="Contenu de l'analyse (Markdown)"
        variant="outlined"
        size="small"
        fullWidth
        multiline
        minRows={10}
        value={entry.content || ""}
        onChange={handleContentChange}
        InputProps={{
          sx: { fontFamily: `"JetBrains Mono","Fira Code",monospace` },
        }}
      />
    </Stack>
  );
};

const formatBrokerTradeOption = (trade) => {
  if (!trade) return "";
  const date = trade.closedAt || trade.openedAt;
  const dateLabel = date
    ? new Date(date).toLocaleString("fr-FR", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";
  const legsLabel = trade.fillsCount > 1 ? ` (${trade.fillsCount} ordres)` : "";
  const pnlValue = Number(trade.pnl);
  const pnlLabel = Number.isFinite(pnlValue)
    ? ` • ${pnlValue >= 0 ? "+" : "-"}${Math.abs(pnlValue).toFixed(2)} ${trade.currency || ""}`
    : "";
  return `${trade.symbol || "Trade"} • ${trade.direction || ""}${legsLabel} • ${dateLabel}${pnlLabel}`;
};

export default EditEntryForm;
