import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchBrokerSummary } from "../services/brokerClient";

const EMPTY_ARRAY = [];
const initialState = {
  loading: true,
  error: "",
  summary: null,
};

const buildAccountsMap = (accounts) => {
  if (!accounts.length) return new Map();
  return new Map(accounts.map((account) => [account.id, account]));
};

const groupTradesByAccount = (trades) => {
  if (!trades.length) return new Map();
  const grouped = new Map();
  trades.forEach((trade) => {
    if (!grouped.has(trade.brokerAccountId)) {
      grouped.set(trade.brokerAccountId, [trade]);
      return;
    }
    grouped.get(trade.brokerAccountId).push(trade);
  });
  return grouped;
};

export const useDashboardSummary = () => {
  const abortRef = useRef(null);
  const [state, setState] = useState(initialState);

  const loadSummary = useCallback(async () => {
    abortRef.current?.abort?.();
    const controller = new AbortController();
    abortRef.current = controller;
    setState((prev) => ({ ...prev, loading: true, error: "" }));

    try {
      const summary = await fetchBrokerSummary({ signal: controller.signal });
      setState({ loading: false, error: "", summary });
      return summary;
    } catch (error) {
      if (error?.name === "AbortError") {
        return null;
      }
      setState((prev) => ({
        loading: false,
        summary: prev.summary,
        error: error?.message || "Impossible de charger le dashboard.",
      }));
      return null;
    }
  }, []);

  useEffect(() => {
    loadSummary();
    return () => {
      abortRef.current?.abort?.();
    };
  }, [loadSummary]);

  const derived = useMemo(() => {
    const summary = state.summary;
    const accounts = summary?.accounts || EMPTY_ARRAY;
    const aggregate = summary?.aggregate || null;
    const trades = summary?.trades || EMPTY_ARRAY;
    const accountsMap = buildAccountsMap(accounts);
    const tradesByAccount = groupTradesByAccount(trades);
    return {
      accounts,
      aggregate,
      trades,
      accountsMap,
      tradesByAccount,
    };
  }, [state.summary]);

  return {
    loading: state.loading,
    error: state.error,
    summary: state.summary,
    refresh: loadSummary,
    ...derived,
  };
};

export default useDashboardSummary;
