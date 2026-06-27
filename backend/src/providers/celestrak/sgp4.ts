import {
  degreesToRadians,
  ecfToLookAngles,
  eciToEcf,
  gstime,
  propagate,
  radiansToDegrees,
  twoline2satrec,
} from "satellite.js";
import type { SkyObject } from "../../contracts.js";
import { Sgp4PropagationError } from "./celestrak.errors.js";
import type { ObserverLocation, TleRecord } from "./celestrak.types.js";

function normalizeDegrees(value: number): number {
  return ((value % 360) + 360) % 360;
}

export function propagateTle(
  record: TleRecord,
  observer: ObserverLocation,
  at: Date,
  metadata: Record<string, unknown> = {},
): SkyObject {
  const satrec = twoline2satrec(record.line1, record.line2);
  const result = propagate(satrec, at);
  if (!result) throw new Sgp4PropagationError(`SGP4 failed for ${record.catalogNumber}`);

  const { x, y, z } = result.position;
  const radius = Math.sqrt(x * x + y * y + z * z);
  if (![x, y, z, radius].every(Number.isFinite) || radius === 0) {
    throw new Sgp4PropagationError(`SGP4 returned invalid coordinates for ${record.catalogNumber}`);
  }

  const gmst = gstime(at);
  const ecf = eciToEcf(result.position, gmst);
  const look = ecfToLookAngles(
    {
      longitude: degreesToRadians(observer.lon),
      latitude: degreesToRadians(observer.lat),
      height: (observer.elevationM ?? 0) / 1_000,
    },
    ecf,
  );

  return {
    id: record.id,
    kind: "satellite",
    name: record.name,
    position: {
      ra: normalizeDegrees(radiansToDegrees(Math.atan2(y, x))),
      dec: radiansToDegrees(Math.asin(z / radius)),
      altDeg: radiansToDegrees(look.elevation),
      azDeg: normalizeDegrees(radiansToDegrees(look.azimuth)),
      distanceKm: look.rangeSat,
    },
    metadata: {
      source: "CelesTrak TLE + satellite.js SGP4",
      catalogNumber: record.catalogNumber,
      tleLine1: record.line1,
      tleLine2: record.line2,
      propagatedAt: at.toISOString(),
      ...metadata,
    },
  };
}
