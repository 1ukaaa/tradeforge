import { TextField } from "@mui/material";

const TranscriptEditor = ({ value, onChange, minRows = 10 }) => {
  return (
    <TextField
      hiddenLabel
      multiline
      fullWidth
      minRows={minRows}
      variant="filled"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder=""
      inputProps={{ "aria-label": "Zone d'analyse" }}
      sx={{
        bgcolor: "transparent",
        "& .MuiFilledInput-root": {
          background: "rgba(246,248,255,0.7)",
          borderRadius: 3,
          fontSize: 16,
          fontWeight: 500,
          paddingTop: 8,
          border: "1px solid rgba(24,38,88,0.08)",
          transition: "all 0.2s ease",
          "&:hover": {
            background: "rgba(246,248,255,0.92)",
            borderColor: "rgba(24,38,88,0.16)",
          },
          "&.Mui-focused": {
            background: "#fff",
            borderColor: "rgba(28,98,209,0.35)",
            boxShadow: "0 0 0 3px rgba(28,98,209,0.12)",
          },
        },
        "& .MuiFilledInput-input": {
          padding: "18px 18px 40px 18px",
        },
      }}
    />
  );
};

export default TranscriptEditor;
