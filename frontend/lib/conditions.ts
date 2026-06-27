/**
 * GYA-27 – Observing Conditions frontend API helper and types.
 *
 * Mirrors the backend ObservingConditionsResponse shape from GYA-11.
 * Uses the shared apiGetJson helper from GYA-30.
 */

import { apiGetJson } from "./api";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ObservingQuality = "Excellent" | "Good" | "Poor" | "Unknown";

export interface ObservingConditionsResponse {
  location: { lat: number; lon: number };
  observedAt: string;
  quality: ObservingQuality;
  summary: string;
  cloudCoverPct: number | null;
  visibilityMeters: number | null;
  humidityPct: number | null;
  temperatureC: number | null;
  windSpeedMps: number | null;
  cached: boolean;
  unavailable: boolean;
  source: "OpenWeatherMap";
  /** Present and true when the response comes from a demo fixture. */
  demo?: boolean;
}

// ---------------------------------------------------------------------------
// API helper
// ---------------------------------------------------------------------------

export interface ConditionsParams {
  lat: number;
  lon: number;
  timeUtc?: string;
}

/**
 * Fetch observing conditions for a location.
 * Always resolves — the backend degrades gracefully when the provider is unavailable.
 *
 * @throws ApiError on non-OK responses (e.g. 400 bad params).
 */
export async function getObservingConditions(
  params: ConditionsParams,
  signal?: AbortSignal,
): Promise<ObservingConditionsResponse> {
  return apiGetJson<ObservingConditionsResponse>(
    "/api/conditions",
    {
      lat: params.lat,
      lon: params.lon,
      ...(params.timeUtc ? { time: params.timeUtc } : {}),
    },
    signal,
  );
}
