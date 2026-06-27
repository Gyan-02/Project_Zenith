"use client";

import { useCallback, useEffect, useState } from "react";
import { getObservingConditions, type ObservingConditionsResponse } from "../lib/conditions";

export interface UseObservingConditionsResult {
  conditions: ObservingConditionsResponse | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useObservingConditions(
  location?: { lat: number; lon: number },
  timeUtc?: string,
): UseObservingConditionsResult {
  const [conditions, setConditions] = useState<ObservingConditionsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trigger, setTrigger] = useState(0);

  const refresh = useCallback(() => setTrigger((n) => n + 1), []);

  useEffect(() => {
    if (!location) {
      setConditions(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    getObservingConditions({ lat: location.lat, lon: location.lon, timeUtc }, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setConditions(data);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Failed to load conditions");
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location?.lat, location?.lon, timeUtc, trigger]);

  return { conditions, isLoading, error, refresh };
}
