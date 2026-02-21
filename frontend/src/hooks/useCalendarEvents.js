import { useEffect, useState } from "react";
import { fetchBrokerPositions } from "../services/brokerClient";
import { fetchEconomicEvents } from "../services/economicClient";
import { fetchJournalEntries } from "../services/journalClient";
import { mapBrokerTradesToEvents } from "../utils/calendarEvents";

const useCalendarEvents = (theme) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;
    const loadEvents = async () => {
      setLoading(true);
      setError("");
      try {
        const [brokerTrades, economicEvents, journalEntries] = await Promise.all([
          fetchBrokerPositions(),
          fetchEconomicEvents(),
          fetchJournalEntries(),
        ]);
        if (!isMounted) return;

        // Link broker trades to journal entries if they exist
        const linkedTrades = brokerTrades.map(trade => {
          const entry = journalEntries.find(e => String(e.trade_id) === String(trade.id || trade._id));
          if (entry) {
            return { ...trade, journalEntryId: entry._id || entry.id };
          }
          return trade;
        });

        const tradeEvents = mapBrokerTradesToEvents(linkedTrades, theme);
        setEvents([...tradeEvents, ...economicEvents]);
      } catch (err) {
        if (!isMounted) return;
        setError(err.message || "Une erreur est survenue.");
      } finally {
        if (!isMounted) return;
        setLoading(false);
      }
    };

    loadEvents();
    return () => {
      isMounted = false;
    };
  }, [theme]);

  return { events, setEvents, loading, error };
};

export default useCalendarEvents;
