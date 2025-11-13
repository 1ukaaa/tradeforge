import { useCallback, useState } from "react";
import { isSameDay } from "../utils/calendarEvents";

const useCalendarInteractions = (events) => {
  const [focusInfo, setFocusInfo] = useState({
    open: false,
    date: null,
    trades: [],
    economics: [],
  });
  const [selectedEntry, setSelectedEntry] = useState(null);

  const handleEventClick = useCallback((clickInfo) => {
    if (clickInfo.event.extendedProps.type === "trade") {
      setSelectedEntry(clickInfo.event.extendedProps.journalEntry);
    }
  }, []);

  const handleDateClick = useCallback(
    (info) => {
      const trades = [];
      const economics = [];

      for (const event of events) {
        if (isSameDay(event.date, info.date)) {
          if (event.extendedProps.type === "trade") {
            trades.push(event.extendedProps.journalEntry);
          } else if (event.extendedProps.type === "economic") {
            economics.push(event);
          }
        }
      }
      setFocusInfo({
        open: true,
        date: info.date,
        trades,
        economics,
      });
    },
    [events]
  );

  const handleFocusClose = useCallback(() => {
    setFocusInfo((prev) => ({ ...prev, open: false }));
  }, []);

  const handleModalClose = useCallback(() => {
    setSelectedEntry(null);
  }, []);

  const openTradeFromFocus = useCallback((trade) => {
    setFocusInfo((prev) => ({ ...prev, open: false }));
    setSelectedEntry(trade);
  }, []);

  return {
    focusInfo,
    selectedEntry,
    handleEventClick,
    handleDateClick,
    handleFocusClose,
    handleModalClose,
    openTradeFromFocus,
    setSelectedEntry,
  };
};

export default useCalendarInteractions;
