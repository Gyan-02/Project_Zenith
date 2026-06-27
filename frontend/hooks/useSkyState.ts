"use client";

import { useCallback, useEffect, useState } from "react";
import { getApiBaseUrl } from "../lib/api/baseUrl";
import { getDemoSkyStateFallback } from "../lib/demoFallback";
import { isDemoActive, resolvePath } from "../lib/demoMode";
import { SkyStateSchema, type SkyState } from "../lib/skyState";

export interface SkyStateLocation {
  lat: number;
  lon: number;
  elevationM?: number;
}

export function useSkyState(location: SkyStateLocation, timeIso: string, refreshMs = 0) {
  const [state, setState] = useState<SkyState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        lat: String(location.lat),
        lon: String(location.lon),
        time: timeIso,
      });
      if (location.elevationM !== undefined) params.set("elevationM", String(location.elevationM));
      const base = getApiBaseUrl();
      const path = resolvePath("/sky-state");
      const response = await fetch(
        `${base}${path}?${params}`,
        { signal },
      );
      if (!response.ok) throw new Error(`Sky-state request failed (${response.status})`);
      setState(SkyStateSchema.parse(await response.json()));
      setError(null);
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === "AbortError") return;
      if (isDemoActive()) {
        setState(getDemoSkyStateFallback(location, timeIso));
        setError(null);
        return;
      }
      setError(caught instanceof Error ? caught.message : "Sky-state is unavailable");
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, [location.elevationM, location.lat, location.lon, timeIso]);

  useEffect(() => {
    const controller = new AbortController();
    void refresh(controller.signal);
    const interval = refreshMs > 0 ? window.setInterval(() => void refresh(), refreshMs) : undefined;
    return () => {
      controller.abort();
      if (interval !== undefined) window.clearInterval(interval);
    };
  }, [refresh, refreshMs]);

  return { state, isLoading, error, refresh: () => refresh() };
}
