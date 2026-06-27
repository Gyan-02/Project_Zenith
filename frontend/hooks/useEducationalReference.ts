"use client";

/**
 * GYA-26 – useEducationalReference React hook.
 *
 * Fetches the educational reference for the selected sky object.
 * Degrades gracefully when the backend endpoint is not yet mounted.
 * Aborts in-flight requests when objectId changes.
 */

import { useEffect, useState } from "react";
import { getEducationalReference, type EducationalReference } from "../lib/educationalReference";

export interface UseEducationalReferenceResult {
  reference: EducationalReference | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * @param objectId - Lower-case object identifier (e.g. "saturn").
 *                   When undefined/empty the hook stays idle.
 */
export function useEducationalReference(objectId?: string): UseEducationalReferenceResult {
  const [reference, setReference] = useState<EducationalReference | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!objectId) {
      setReference(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    getEducationalReference(objectId, controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) {
          setReference(result);
        }
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Failed to load educational reference");
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [objectId]);

  return { reference, isLoading, error };
}
