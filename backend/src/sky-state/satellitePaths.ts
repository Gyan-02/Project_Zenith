import type { SkyObject, ViewerContext } from "../contracts.js";
import { propagateTle, type TleRecord } from "../providers/celestrak/index.js";

export interface SatellitePathSample {
  timeUtc: string;
  altDeg: number;
  azDeg: number;
  distanceKm?: number;
}

export interface SatellitePathOptions {
  beforeMinutes?: number;
  afterMinutes?: number;
  stepMinutes?: number;
  minAltitudeDeg?: number;
}

const DEFAULT_BEFORE_MINUTES = 6;
const DEFAULT_AFTER_MINUTES = 24;
const DEFAULT_STEP_MINUTES = 3;
const DEFAULT_MIN_ALTITUDE_DEG = -6;

function metadataString(object: SkyObject, key: string): string | undefined {
  const value = object.metadata?.[key];
  return typeof value === "string" && value.trim() ? value : undefined;
}

function metadataCatalogNumber(object: SkyObject): string {
  const value = object.metadata?.catalogNumber;
  if (typeof value === "string" && value.trim()) return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return object.id.replace(/^sat-/, "");
}

export function tleRecordFromSkyObject(object: SkyObject): TleRecord | undefined {
  const line1 = metadataString(object, "tleLine1");
  const line2 = metadataString(object, "tleLine2");
  if (!line1 || !line2) return undefined;

  return {
    id: object.id,
    catalogNumber: metadataCatalogNumber(object),
    name: object.name,
    line1,
    line2,
  };
}

export function sampleSatellitePath(
  object: SkyObject,
  location: ViewerContext["location"],
  at: Date,
  options: SatellitePathOptions = {},
): SatellitePathSample[] {
  const record = tleRecordFromSkyObject(object);
  if (!record) return [];

  const beforeMinutes = options.beforeMinutes ?? DEFAULT_BEFORE_MINUTES;
  const afterMinutes = options.afterMinutes ?? DEFAULT_AFTER_MINUTES;
  const stepMinutes = Math.max(1, options.stepMinutes ?? DEFAULT_STEP_MINUTES);
  const minAltitudeDeg = options.minAltitudeDeg ?? DEFAULT_MIN_ALTITUDE_DEG;
  const samples: SatellitePathSample[] = [];

  for (let offsetMinutes = -beforeMinutes; offsetMinutes <= afterMinutes; offsetMinutes += stepMinutes) {
    try {
      const sampleTime = new Date(at.getTime() + offsetMinutes * 60_000);
      const projected = propagateTle(record, location, sampleTime);
      const { altDeg, azDeg, distanceKm } = projected.position;
      if (altDeg === undefined || azDeg === undefined) continue;
      if (altDeg < minAltitudeDeg) continue;

      samples.push({
        timeUtc: sampleTime.toISOString(),
        altDeg,
        azDeg,
        ...(distanceKm !== undefined ? { distanceKm } : {}),
      });
    } catch {
      // A decayed/corrupt TLE sample should not break the entire sky state.
    }
  }

  return samples;
}

export function withSampledSatellitePath(
  object: SkyObject,
  location: ViewerContext["location"],
  at: Date,
  options: SatellitePathOptions = {},
): SkyObject {
  const pathSamples = sampleSatellitePath(object, location, at, options);
  if (pathSamples.length < 2) return object;

  return {
    ...object,
    metadata: {
      ...object.metadata,
      pathMode: "tle-sampled",
      pathSource: "CelesTrak TLE sampled with satellite.js SGP4",
      pathSamples,
    },
  };
}
