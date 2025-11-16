import { useCallback, useState } from "react";
import { isSameDay } from "../utils/calendarEvents";

const useCalendarInteractions = (events) => {
  const [focusInfo, setFocusInfo] = useState({
    open: false,
    date: null,
    trades: [],
    economics: [],
  });
  const [selectedTrade, setSelectedTrade] = useState(null);

  const handleEventClick = useCallback((clickInfo) => {
    if (clickInfo.event.extendedProps.type === "brokerTrade") {
      setSelectedTrade(clickInfo.event.extendedProps.brokerTrade);
    }
  }, []);

  const handleDateClick = useCallback(
    (info) => {
      const trades = [];
      const economics = [];

      for (const event of events) {
        if (isSameDay(event.date, info.date)) {
          if (event.extendedProps.type === "brokerTrade") {
            trades.push(event.extendedProps.brokerTrade);
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
    setSelectedTrade(null);
  }, []);

  const openTradeFromFocus = useCallback((trade) => {
    setFocusInfo((prev) => ({ ...prev, open: false }));
    setSelectedTrade(trade);
  }, []);

  return {
    focusInfo,
    selectedTrade,
    handleEventClick,
    handleDateClick,
    handleFocusClose,
    handleModalClose,
    openTradeFromFocus,
    setSelectedTrade,
  };
};

export default useCalendarInteractions;
