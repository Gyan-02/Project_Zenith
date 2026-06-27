/**
 * GYA-28 – Celestial Events frontend types and API helper.
 */

import { apiGetJson } from "./api";

// ---------------------------------------------------------------------------
// Types (mirrors backend CelestialEvent)
// ---------------------------------------------------------------------------

export type CelestialEventType =
  | "meteor_shower"
  | "conjunction"
  | "eclipse"
  | "visibility_window";

export interface EventVisibility {
  rating: "Excellent" | "Good" | "Poor" | "Unknown";
  reason: string;
}

export interface EventPath {
  type: string;
  summary: string;
  bestViewingRegions: string[];
  duration: string;
  visibilityFromObserver: string;
}

export interface CelestialEvent {
  id: string;
  type: CelestialEventType;
  name: string;
  startUtc: string;
  endUtc: string;
  peakUtc?: string;
  summary: string;
  visibility: EventVisibility;
  source: string;
  confidence: "high" | "medium" | "low";
  navigationTarget?: {
    kind: "planet" | "satellite" | "star" | "constellation" | "moon" | "iss";
    id: string;
    label: string;
  };
  metadata?: {
    path?: EventPath;
  };
}

// ---------------------------------------------------------------------------
// API helper
// ---------------------------------------------------------------------------

export interface CelestialEventsParams {
  lat: number;
  lon: number;
  startUtc: string;
  endUtc: string;
  types?: CelestialEventType[];
}

export interface EventsResponse {
  demo?: boolean;
  provenance?: Array<{ source: string; fetchedAt: string }>;
  events: CelestialEvent[];
}

/**
 * Fetch celestial events from the backend.
 * Supports multiple `type` query params via the shared buildQuery array handling.
 */
export async function getCelestialEvents(
  params: CelestialEventsParams,
  signal?: AbortSignal,
): Promise<EventsResponse> {
  const data = await apiGetJson<CelestialEvent[] | EventsResponse>(
    "/api/events",
    {
      lat: params.lat,
      lon: params.lon,
      start: params.startUtc,
      end: params.endUtc,
      ...(params.types && params.types.length > 0 ? { type: params.types } : {}),
    },
    signal,
  );

  if (Array.isArray(data)) {
    return { events: data };
  }
  return data;
}
