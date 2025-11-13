import { useEffect, useState } from "react";
import { fetchEconomicEvents } from "../services/economicClient";
import { fetchJournalEntries } from "../services/journalClient";
import { mapTradesToEvents } from "../utils/calendarEvents";

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
        const [journalEntries, economicEvents] = await Promise.all([
          fetchJournalEntries(),
          fetchEconomicEvents(),
        ]);
        if (!isMounted) return;
        const tradeEvents = mapTradesToEvents(journalEntries, theme);
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
