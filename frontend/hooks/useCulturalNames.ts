"use client";

/**
 * GYA-19 – useCulturalNames React hook.
 *
 * Fetches cultural names for the selected sky object.
 * Aborts in-flight requests when objectId changes.
 */

import { useEffect, useState } from "react";
import { getCulturalNamesForObject, type CulturalObjectEntry } from "../lib/culturalNames";

export interface UseCulturalNamesResult {
  data: CulturalObjectEntry | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * @param objectId - Lower-case object identifier (e.g. "jupiter").
 *                   When undefined/empty the hook stays idle.
 */
export function useCulturalNames(objectId?: string): UseCulturalNamesResult {
  const [data, setData] = useState<CulturalObjectEntry | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!objectId) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    getCulturalNamesForObject(objectId, controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) {
          setData(result);
        }
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Failed to load cultural names");
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [objectId]);

  return { data, isLoading, error };
}
