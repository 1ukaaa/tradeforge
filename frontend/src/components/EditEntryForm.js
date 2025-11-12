// frontend/src/components/EditEntryForm.js
import {
    Autocomplete,
    Chip,
    Stack,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Typography,
} from "@mui/material";

// Options fixes pour le sélecteur de Timeframe
const TIMEFRAME_OPTIONS = ["W1", "D1", "H4", "H1", "M15", "M5"];

const EditEntryForm = ({ entry, onDataChange }) => {
  const handleMetaChange = (field) => (event) => {
    onDataChange({
      ...entry,
      metadata: { ...entry.metadata, [field]: event.target.value },
    });
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

  const handleTimeframeChange = (event, newTimeframes) => {
    onDataChange({
      ...entry,
      metadata: { ...entry.metadata, timeframe: newTimeframes },
    });
  };

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
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <TextField
          label="Symbole(s)"
          variant="outlined"
          size="small"
          value={entry.metadata.symbol || ""}
          onChange={handleMetaChange("symbol")}
          sx={{ flex: 1 }}
        />
        {/* Champs conditionnels pour les trades */}
        {entry.type === "trade" && (
          <>
            <TextField
              label="Résultat (ex: TP, SL, BE)"
              variant="outlined"
              size="small"
              value={entry.metadata.result || ""}
              onChange={handleMetaChange("result")}
              sx={{ flex: 1 }}
            />
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

      <Stack spacing={1}>
        <Typography variant="body2" color="text.secondary">
          Timeframe(s)
        </Typography>
        <ToggleButtonGroup
          value={entry.metadata.timeframe || []} // Reçoit déjà un tableau
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

export default EditEntryForm;