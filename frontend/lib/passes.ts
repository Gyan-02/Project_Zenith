/**
 * GYA-29 – Satellite Pass Prediction frontend types and API helper.
 */

import { apiGetJson } from "./api";

// ---------------------------------------------------------------------------
// Types (mirrors backend PassPrediction / passes router response)
// ---------------------------------------------------------------------------

export interface PassPrediction {
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

export interface PassesResponse {
  location: { lat: number; lon: number; elevationM?: number };
  startUtc: string;
  endUtc: string;
  passes: PassPrediction[];
  provenance: Array<{ source: string; fetchedAt: string }>;
  demo?: boolean;
}

// ---------------------------------------------------------------------------
// API helper
// ---------------------------------------------------------------------------

export interface PassesParams {
  lat: number;
  lon: number;
  elevationM?: number;
  startUtc: string;
  endUtc: string;
  minElevationDeg?: number;
}

export async function getPassPredictions(
  params: PassesParams,
  signal?: AbortSignal,
): Promise<PassesResponse> {
  return apiGetJson<PassesResponse>(
    "/api/passes",
    {
      lat: params.lat,
      lon: params.lon,
      ...(params.elevationM !== undefined ? { elevationM: params.elevationM } : {}),
      start: params.startUtc,
      end: params.endUtc,
      ...(params.minElevationDeg !== undefined ? { minElevationDeg: params.minElevationDeg } : {}),
    },
    signal,
  );
}
