// frontend/src/components/FilterBarPopover.js
import FilterListIcon from "@mui/icons-material/FilterList";
import ViewListIcon from "@mui/icons-material/ViewList";
import ViewModuleIcon from "@mui/icons-material/ViewModule";
import ViewQuiltIcon from "@mui/icons-material/ViewQuilt";
import ViewStreamIcon from "@mui/icons-material/ViewStream";
import { Button, Divider, IconButton, Paper, Popover, Stack, TextField, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import { useState } from "react";

const FilterBarPopover = ({ filters, onFilterChange, onViewChange, onReset }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const handleOpen = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);
  const open = Boolean(anchorEl);

  const handleFieldChange = (field) => (event) => {
    onFilterChange({ ...filters, [field]: event.target.value });
  };
  const handleTypeChange = (_, value) => {
    if (value) onFilterChange({ ...filters, filterType: value });
  };

  return (
    <>
      <Paper variant="outlined" sx={{ p: 1.5, display: "flex", gap: 1, alignItems: "center" }}>
        <TextField
          label="Rechercher..." variant="outlined" size="small"
          value={filters.searchQuery} onChange={handleFieldChange("searchQuery")}
          sx={{ flex: 1 }}
        />
        <IconButton onClick={handleOpen} color={filters.startDate || filters.endDate || filters.filterType !== 'all' ? 'primary' : 'default'}>
          <FilterListIcon />
        </IconButton>
        <ToggleButtonGroup value={filters.viewMode} exclusive size="small" onChange={onViewChange}>
          <ToggleButton value="inspector" title="Vue Inspecteur"><ViewListIcon /></ToggleButton>
          <ToggleButton value="focus" title="Vue Focus"><ViewStreamIcon /></ToggleButton>
          <ToggleButton value="overlay" title="Vue Superposée"><ViewQuiltIcon /></ToggleButton>
          <ToggleButton value="polaroid" title="Vue Grille"><ViewModuleIcon /></ToggleButton>
        </ToggleButtonGroup>
      </Paper>
      <Popover
        open={open} anchorEl={anchorEl} onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{ sx: { p: 2, mt: 1, width: 320 } }}
      >
        <Stack spacing={2}>
          <Typography variant="subtitle2">Filtrer par Type</Typography>
          <ToggleButtonGroup value={filters.filterType} exclusive fullWidth size="small" onChange={handleTypeChange}>
            <ToggleButton value="all">Tous</ToggleButton>
            <ToggleButton value="trade">Trades</ToggleButton>
            <ToggleButton value="analyse">Analyses</ToggleButton>
          </ToggleButtonGroup>
          <Divider />
          <Typography variant="subtitle2">Filtrer par Date</Typography>
          <TextField
            label="Date début" type="date" size="small"
            value={filters.startDate} onChange={handleFieldChange("startDate")}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Date fin" type="date" size="small"
            value={filters.endDate} onChange={handleFieldChange("endDate")}
            InputLabelProps={{ shrink: true }}
          />
          <Divider />
          <Button variant="text" size="small" onClick={() => { onReset(); handleClose(); }}>
            Réinitialiser tous les filtres
          </Button>
        </Stack>
      </Popover>
    </>
  );
};
export default FilterBarPopover;