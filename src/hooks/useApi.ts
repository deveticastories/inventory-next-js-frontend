"use client";

import { useCallback, useEffect, useState, type DependencyList } from "react";
import { errorMessage } from "@/services/ApiClient";

/**
 * Loads data from a service and re-runs when `deps` change or `reload()` is called.
 * Earlier data stays on screen while a reload is in flight.
 */
export function useApi<T>(load: () => Promise<T>, deps: DependencyList = []) {
  const [state, setState] = useState<{ data?: T; error?: string }>({});
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let live = true;
    load().then(
      (data) => live && setState({ data }),
      (e) => live && setState((s) => ({ ...s, error: errorMessage(e) })),
    );
    return () => {
      live = false;
    };
    // `load` is recreated every render; `deps` says when it really changed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { ...state, reload };
}
