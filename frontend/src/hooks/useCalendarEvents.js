import { useEffect, useState } from "react";
import { fetchEconomicEvents } from "../services/economicClient";
import { fetchBrokerPositions } from "../services/brokerClient";
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
        const [brokerTrades, economicEvents] = await Promise.all([
          fetchBrokerPositions(),
          fetchEconomicEvents(),
        ]);
        if (!isMounted) return;
        const tradeEvents = mapBrokerTradesToEvents(brokerTrades, theme);
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
