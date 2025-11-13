import { alpha } from "@mui/material";
import { resultTone } from "./journalUtils";

export const mapTradesToEvents = (entries, theme) => {
  return entries
    .filter((entry) => entry.type === "trade")
    .map((entry) => {
      const meta = entry.metadata || {};
      const title = `${meta.symbol || "Trade"} (${meta.result || "N/A"})`;
      const tone = resultTone(meta.result);
      const color = theme.palette[tone] || theme.palette.info;

      return {
        id: entry.id,
        title,
        date: meta.date || entry.createdAt,
        allDay: true,
        backgroundColor: alpha(color.main, 0.15),
        borderColor: color.main,
        textColor: theme.palette.mode === "dark" ? color.light : color.dark,
        extendedProps: {
          type: "trade",
          impact: "none",
          journalEntry: entry,
        },
      };
    });
};

export const isSameDay = (date1, date2) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};
