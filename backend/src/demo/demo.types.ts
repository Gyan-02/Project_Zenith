/**
 * GYA-31 – Demo data type definitions.
 *
 * These types describe the shape of the fixture JSON files under data/demo/.
 * They mirror the backend contracts so the demo pack can be used as a drop-in
 * replacement for live service responses.
 */

// ---------------------------------------------------------------------------
// Re-use backend types where available
// ---------------------------------------------------------------------------

export type { SkyState, ConstellationLine, SkyObject } from "../contracts.js";

// ---------------------------------------------------------------------------
// Demo-specific loader result types
// ---------------------------------------------------------------------------

export interface DemoConditions {
  location: { lat: number; lon: number };
  observedAt: string;
  quality: "Excellent" | "Good" | "Poor" | "Unknown";
  summary: string;
  cloudCoverPct: number | null;
  visibilityMeters: number | null;
  humidityPct: number | null;
  temperatureC: number | null;
  windSpeedMps: number | null;
  cached: boolean;
  unavailable: boolean;
  source: string;
}

export interface DemoEventVisibility {
  rating: "Excellent" | "Good" | "Poor" | "Unknown";
  reason: string;
}

export interface DemoCelestialEvent {
  id: string;
  type: "meteor_shower" | "conjunction" | "eclipse" | "visibility_window";
  name: string;
  startUtc: string;
  endUtc: string;
  peakUtc?: string;
  summary: string;
  visibility: DemoEventVisibility;
  source: string;
  confidence: "high" | "medium" | "low";
}

export interface DemoPassPrediction {
  objectId: string;
  name?: string;
  riseTimeUtc: string;
  peakTimeUtc: string;
  setTimeUtc: string;
  durationSeconds: number;
  maxElevationDeg: number;
  riseAzimuthDeg?: number;
  setAzimuthDeg?: number;
  riseDirection?: string;
  setDirection?: string;
  visible?: boolean;
  source?: string;
}

export interface DemoPassesResponse {
  location: { lat: number; lon: number; elevationM?: number };
  startUtc: string;
  endUtc: string;
  passes: DemoPassPrediction[];
  provenance: Array<{ source: string; fetchedAt: string }>;
}
