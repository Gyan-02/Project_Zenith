"use client";

import { useCallback, useEffect, useState } from "react";
import { getPassPredictions, type PassPrediction, type PassesResponse } from "../lib/passes";

export interface UsePassPredictionsResult {
  passes: PassPrediction[];
  provenance: PassesResponse["provenance"];
  demo?: boolean;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

export function usePassPredictions(
  location?: { lat: number; lon: number; elevationM?: number },
  startUtc?: string,
  endUtc?: string,
  minElevationDeg?: number,
): UsePassPredictionsResult {
  const [passes, setPasses] = useState<PassPrediction[]>([]);
  const [provenance, setProvenance] = useState<PassesResponse["provenance"]>([]);
  const [demo, setDemo] = useState<boolean | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trigger, setTrigger] = useState(0);

  const refresh = useCallback(() => setTrigger((n) => n + 1), []);

  useEffect(() => {
    if (!location || !startUtc || !endUtc) {
      setPasses([]);
      setProvenance([]);
      setDemo(undefined);
      setIsLoading(false);
      setError(null);
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    getPassPredictions(
      {
        lat: location.lat,
        lon: location.lon,
        elevationM: location.elevationM,
        startUtc,
        endUtc,
        minElevationDeg,
      },
      controller.signal,
    )
      .then((data) => {
        if (!controller.signal.aborted) {
          setPasses(data.passes);
          setProvenance(data.provenance);
          setDemo(data.demo);
        }
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Failed to load pass predictions");
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location?.lat, location?.lon, location?.elevationM, startUtc, endUtc, minElevationDeg, trigger]);

  return { passes, provenance, demo, isLoading, error, refresh };
}
