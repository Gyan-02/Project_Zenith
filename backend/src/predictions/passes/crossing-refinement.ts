/**
 * GYA-14 – Crossing refinement via bisection search.
 *
 * Given a coarse scan that has detected a sign change in (elevation − threshold),
 * narrow the exact crossing time to within `toleranceSec` using binary search.
 * This is also used for peak-elevation refinement (ternary search).
 */

import type { ObserverLocation, TleRecord } from "../../providers/celestrak/index.js";
import { propagateTle } from "../../providers/celestrak/index.js";
import { Sgp4PropagationError } from "../../providers/celestrak/index.js";

/**
 * A function that returns the elevation (in degrees) of a satellite at a
 * given Unix epoch millisecond.
 */
export type ElevationFn = (epochMs: number) => number;

/**
 * Build an elevation function for a TLE record and observer from the shared
 * `propagateTle` utility.  Throws `Sgp4PropagationError` on a corrupt TLE;
 * callers should validate before building.
 */
export function makeElevationFn(
  record: TleRecord,
  observer: ObserverLocation,
): ElevationFn {
  return (epochMs: number): number => {
    const result = propagateTle(record, observer, new Date(epochMs));
    const altDeg = result.position.altDeg;
    if (altDeg === undefined || !Number.isFinite(altDeg)) {
      throw new Sgp4PropagationError(
        `propagateTle returned non-finite altDeg for ${record.catalogNumber}`,
      );
    }
    return altDeg;
  };
}

/**
 * Bisection search for a horizon crossing (elevation = threshold).
 *
 * Precondition: `elevFn(loMs) < threshold` and `elevFn(hiMs) >= threshold`
 *               OR the reverse (one side above, one below).
 *
 * Returns the epoch (ms) where the crossing occurs, accurate to `toleranceMs`.
 */
export function bisectCrossing(
  elevFn: ElevationFn,
  loMs: number,
  hiMs: number,
  threshold: number,
  toleranceMs: number = 2_000,
): number {
  let lo = loMs;
  let hi = hiMs;

  const loAbove = elevFn(lo) >= threshold;

  while (hi - lo > toleranceMs) {
    const mid = (lo + hi) / 2;
    const midAbove = elevFn(mid) >= threshold;
    if (midAbove === loAbove) {
      lo = mid;
    } else {
      hi = mid;
    }
  }

  // Return the midpoint of the final interval
  return (lo + hi) / 2;
}

/**
 * Ternary search for the maximum elevation within [loMs, hiMs].
 *
 * The elevation function is assumed to be unimodal (single-humped) over the
 * given interval, which holds for a continuous satellite pass.
 *
 * Returns `{ epochMs, elevationDeg }` for the estimated peak.
 */
export function findPeakElevation(
  elevFn: ElevationFn,
  loMs: number,
  hiMs: number,
  toleranceMs: number = 2_000,
): { epochMs: number; elevationDeg: number } {
  let lo = loMs;
  let hi = hiMs;

  while (hi - lo > toleranceMs) {
    const m1 = lo + (hi - lo) / 3;
    const m2 = hi - (hi - lo) / 3;
    if (elevFn(m1) < elevFn(m2)) {
      lo = m1;
    } else {
      hi = m2;
    }
  }

  const peakMs = (lo + hi) / 2;
  return { epochMs: peakMs, elevationDeg: elevFn(peakMs) };
}
