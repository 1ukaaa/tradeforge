import { alpha } from "@mui/material";

const resolveTradeColor = (trade, theme) => {
  const isWinning = Number(trade.pnl) >= 0;
  const palette = isWinning ? theme.palette.success : theme.palette.error;
  return {
    bg: alpha(palette.main, 0.15),
    border: palette.main,
    text: theme.palette.mode === "dark" ? palette.light : palette.dark,
  };
};

export const mapBrokerTradesToEvents = (trades = [], theme) => {
  return trades.map((trade) => {
    const colors = resolveTradeColor(trade, theme);
    const title = `${trade.symbol || "Trade"} • ${trade.direction === "short" || trade.direction === "SELL" ? "Vente" : "Achat"}`;
    const date = trade.date || trade.closedAt || trade.openedAt;
    return {
      id: trade.id || trade.externalTradeId || `${trade.brokerAccountId}-${date}`,
      title,
      date,
      allDay: true,
      backgroundColor: colors.bg,
      borderColor: colors.border,
      textColor: colors.text,
      extendedProps: {
        type: "brokerTrade",
        brokerTrade: trade,
        impact: "none",
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
