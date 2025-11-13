import { useMemo, useState } from "react";

const useCalendarFilters = (events) => {
  const [typeFilter, setTypeFilter] = useState({
    trade: true,
    economic: true,
  });
  const [impactFilter, setImpactFilter] = useState({
    high: true,
    medium: true,
    low: false,
    holiday: true,
  });

  const handleTypeChange = (event) => {
    setTypeFilter((prev) => ({
      ...prev,
      [event.target.name]: event.target.checked,
    }));
  };

  const handleImpactChange = (event) => {
    setImpactFilter((prev) => ({
      ...prev,
      [event.target.name]: event.target.checked,
    }));
  };

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const props = event.extendedProps || {};
      if (props.type === "trade") {
        return typeFilter.trade;
      }
      if (props.type === "economic") {
        if (!typeFilter.economic) return false;
        return impactFilter[props.impact] === true;
      }
      return false;
    });
  }, [events, typeFilter, impactFilter]);

  return {
    typeFilter,
    impactFilter,
    handleTypeChange,
    handleImpactChange,
    filteredEvents,
  };
};

export default useCalendarFilters;
