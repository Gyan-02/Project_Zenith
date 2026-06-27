"use client";

import { useCallback, useEffect, useState } from "react";
import { getCelestialEvents, type CelestialEvent, type CelestialEventType } from "../lib/events";

export interface UseCelestialEventsResult {
  events: CelestialEvent[];
  demo?: boolean;
  provenance?: Array<{ source: string; fetchedAt: string }>;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useCelestialEvents(
  location?: { lat: number; lon: number },
  startUtc?: string,
  endUtc?: string,
  types?: CelestialEventType[],
): UseCelestialEventsResult {
  const [events, setEvents] = useState<CelestialEvent[]>([]);
  const [demo, setDemo] = useState<boolean | undefined>(undefined);
  const [provenance, setProvenance] = useState<Array<{ source: string; fetchedAt: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trigger, setTrigger] = useState(0);

  const refresh = useCallback(() => setTrigger((n) => n + 1), []);

  useEffect(() => {
    if (!location || !startUtc || !endUtc) {
      setEvents([]);
      setDemo(undefined);
      setProvenance([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    getCelestialEvents(
      { lat: location.lat, lon: location.lon, startUtc, endUtc, types },
      controller.signal,
    )
      .then((data) => {
        if (!controller.signal.aborted) {
          setEvents(data.events);
          setDemo(data.demo);
          setProvenance(data.provenance ?? []);
        }
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Failed to load events");
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location?.lat, location?.lon, startUtc, endUtc, types?.join(","), trigger]);

  return { events, demo, provenance, isLoading, error, refresh };
}
