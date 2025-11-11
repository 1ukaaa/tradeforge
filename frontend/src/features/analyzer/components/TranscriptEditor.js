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
          background: "rgba(255,255,255,0.03)",
          borderRadius: 3,
          fontSize: 16,
          fontWeight: 500,
          paddingTop: 8,
          border: "1px solid rgba(255,255,255,0.08)",
          color: "text.primary",
          transition: "all 0.2s ease",
          "&:hover": {
            background: "rgba(255,255,255,0.05)",
            borderColor: "rgba(116,246,214,0.35)",
          },
          "&.Mui-focused": {
            background: "rgba(255,255,255,0.06)",
            borderColor: "rgba(116,246,214,0.55)",
            boxShadow: "0 0 0 3px rgba(116,246,214,0.18)",
          },
        },
        "& .MuiFilledInput-input": {
          padding: "18px 18px 40px 18px",
          color: "inherit",
        },
        "& .MuiFilledInput-root:before, & .MuiFilledInput-root:after": {
          borderBottom: "none",
        },
      }}
    />
  );
};

export default TranscriptEditor;
