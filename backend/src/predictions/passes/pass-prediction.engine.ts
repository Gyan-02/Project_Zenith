/**
 * GYA-14 – Pass prediction engine.
 *
 * Algorithm overview:
 *
 * 1. COARSE SCAN
 *    Walk the prediction window in `coarseStepSeconds` steps (default 30 s).
 *    At each sample, call `propagateTle` to get the satellite's altitude.
 *    Track whether the satellite is above/below the elevation threshold.
 *
 * 2. PASS DETECTION
 *    A "candidate pass" begins when altitude transitions from below to above
 *    threshold, and ends when it transitions from above to below.
 *    An "in-progress pass" at t=0 (satellite already above threshold at window
 *    start) is handled by entering the above-state immediately and searching
 *    forward for the set crossing.  The rise is pinned to the window start.
 *
 * 3. CROSSING REFINEMENT
 *    Use bisectCrossing() to narrow rise and set crossings to ≤ 2 s accuracy.
 *
 * 4. PEAK REFINEMENT
 *    Use findPeakElevation() (ternary search) to find the true maximum within
 *    the bracketed interval, accurate to ≤ 2 s.
 *
 * 5. VALIDATION
 *    Discard any pass where:
 *      - rise >= set (negative / zero duration)
 *      - peak < minimumElevationDeg
 *      - any angle is NaN or non-finite
 *
 * 6. VISIBILITY
 *    Delegate to the injected VisibilityClassifier.  Default is conservative
 *    (always false) so we never falsely claim an unobservable pass is visible.
 *
 * 7. BATCH CONCURRENCY
 *    `predictPasses` uses a bounded worker pool (default concurrency 8) so
 *    that a large catalog does not spawn thousands of simultaneous tasks.
 */

import type { ObserverLocation, TleRecord } from "../../providers/celestrak/index.js";
import { propagateTle } from "../../providers/celestrak/index.js";
import { bisectCrossing, findPeakElevation, makeElevationFn } from "./crossing-refinement.js";
import { azimuthToDirection } from "./direction.js";
import {
  CONSERVATIVE_CLASSIFIER,
  type PassPrediction,
  type PassPredictionQuery,
  type PredictPassesOptions,
} from "./pass-prediction.types.js";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_COARSE_STEP_SEC = 30;
const DEFAULT_WINDOW_HOURS = 24;
const MAX_WINDOW_HOURS = 72;
const DEFAULT_MIN_ELEVATION_DEG = 10;
const DEFAULT_CONCURRENCY = 8;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function clampWindow(hours: number | undefined): number {
  const h = hours ?? DEFAULT_WINDOW_HOURS;
  return Math.min(Math.max(h, 0), MAX_WINDOW_HOURS);
}

/**
 * Get the observer-relative azimuth (degrees) at a given epoch.
 * Returns NaN if propagation fails.
 */
function getAzimuth(
  record: TleRecord,
  observer: ObserverLocation,
  epochMs: number,
): number {
  try {
    const obj = propagateTle(record, observer, new Date(epochMs));
    return obj.position.azDeg ?? NaN;
  } catch {
    return NaN;
  }
}

// ---------------------------------------------------------------------------
// Single-TLE predictor
// ---------------------------------------------------------------------------

/**
 * Predict all passes of one satellite over an observer within the query window.
 *
 * @param record   - TLE record for the satellite.
 * @param query    - Observer, window, and threshold parameters.
 * @param options  - Engine options (coarse step, visibility classifier).
 * @returns        - Array of PassPrediction, chronologically ordered.
 */
export async function predictPassesForTle(
  record: TleRecord,
  query: PassPredictionQuery,
  options: PredictPassesOptions = {},
): Promise<PassPrediction[]> {
  const coarseStepMs =
    (options.coarseStepSeconds ?? DEFAULT_COARSE_STEP_SEC) * 1_000;
  const windowHours = clampWindow(query.windowHours);
  const minElevDeg = query.minimumElevationDeg ?? DEFAULT_MIN_ELEVATION_DEG;
  const classifier = options.visibilityClassifier ?? CONSERVATIVE_CLASSIFIER;

  const startMs = Date.parse(query.startTimeUtc);
  const endMs = startMs + windowHours * 3_600_000;

  // Build the elevation function for this TLE + observer pair.
  // Throws Sgp4PropagationError for corrupt/decayed TLEs.
  const elevFn = makeElevationFn(record, {
    lat: query.observer.lat,
    lon: query.observer.lon,
    elevationM: query.observer.elevationM,
  });

  const passes: PassPrediction[] = [];

  // ---- Coarse scan --------------------------------------------------------

  // Detect whether we are already in a pass at window start.
  let prevAlt: number;
  try {
    prevAlt = elevFn(startMs);
  } catch {
    // Propagation already failed at t=0 — this TLE is decayed.
    return [];
  }

  let aboveThreshold = prevAlt >= minElevDeg;

  // If the satellite is already above threshold at the window start, we are
  // mid-pass.  Record the window start as the "rise" time for this partial pass.
  let passStartMs: number = aboveThreshold ? startMs : NaN;
  let inProgressAtStart = aboveThreshold;

  let t = startMs + coarseStepMs;

  while (t <= endMs) {
    let currentAlt: number;
    try {
      currentAlt = elevFn(t);
    } catch {
      // Propagation failed mid-scan; treat as below horizon.
      currentAlt = -90;
    }

    const nowAbove = currentAlt >= minElevDeg;

    if (!aboveThreshold && nowAbove) {
      // Rising edge detected.
      // Refine rise crossing between (t - coarseStep) and t.
      let riseMs: number;
      try {
        riseMs = bisectCrossing(elevFn, t - coarseStepMs, t, minElevDeg, 1_000);
      } catch {
        riseMs = t - coarseStepMs / 2;
      }
      passStartMs = riseMs;
      inProgressAtStart = false;
    } else if (aboveThreshold && !nowAbove) {
      // Falling edge detected.
      // Refine set crossing between (t - coarseStep) and t.
      let setMs: number;
      try {
        setMs = bisectCrossing(elevFn, t - coarseStepMs, t, minElevDeg, 1_000);
      } catch {
        setMs = t - coarseStepMs / 2;
      }

      // Determine the bracket for peak search.
      const riseMs = passStartMs;
      if (!isFinite(riseMs) || setMs <= riseMs) {
        // Degenerate pass — skip.
        aboveThreshold = nowAbove;
        t += coarseStepMs;
        continue;
      }

      // Refine peak elevation.
      let peakMs: number;
      let maxElevDeg: number;
      try {
        const peak = findPeakElevation(elevFn, riseMs, setMs, 1_000);
        peakMs = peak.epochMs;
        maxElevDeg = peak.elevationDeg;
      } catch {
        peakMs = (riseMs + setMs) / 2;
        maxElevDeg = minElevDeg; // fallback
      }

      // Guard: peak must meet threshold, times must be ordered.
      if (maxElevDeg < minElevDeg || peakMs < riseMs || peakMs > setMs) {
        aboveThreshold = nowAbove;
        t += coarseStepMs;
        continue;
      }

      const durationSeconds = Math.round((setMs - riseMs) / 1_000);
      if (durationSeconds <= 0) {
        aboveThreshold = nowAbove;
        t += coarseStepMs;
        continue;
      }

      // Azimuth at rise and set.
      const riseAzimuthDeg = getAzimuth(record, { lat: query.observer.lat, lon: query.observer.lon, elevationM: query.observer.elevationM }, riseMs);
      const setAzimuthDeg  = getAzimuth(record, { lat: query.observer.lat, lon: query.observer.lon, elevationM: query.observer.elevationM }, setMs);

      if (!Number.isFinite(riseAzimuthDeg) || !Number.isFinite(setAzimuthDeg)) {
        aboveThreshold = nowAbove;
        t += coarseStepMs;
        continue;
      }

      const riseTimeUtc = new Date(riseMs).toISOString();
      const peakTimeUtc = new Date(peakMs).toISOString();
      const setTimeUtc  = new Date(setMs).toISOString();

      const passWithoutVisible: Omit<PassPrediction, "visible"> = {
        objectId: record.id,
        name: record.name,
        riseTimeUtc,
        peakTimeUtc,
        setTimeUtc,
        durationSeconds,
        maxElevationDeg: Math.round(maxElevDeg * 10) / 10,
        riseAzimuthDeg: Math.round(riseAzimuthDeg * 10) / 10,
        setAzimuthDeg:  Math.round(setAzimuthDeg * 10) / 10,
        riseDirection: azimuthToDirection(riseAzimuthDeg),
        setDirection:  azimuthToDirection(setAzimuthDeg),
        source: "CelesTrak TLE + satellite.js SGP4",
      };

      const visible = classifier.classify(passWithoutVisible, query);

      passes.push({ ...passWithoutVisible, visible });
      passStartMs = NaN;
      inProgressAtStart = false;
    }

    aboveThreshold = nowAbove;
    t += coarseStepMs;
  }

  // Handle a pass that started within (or before) the window but did not set
  // before the window closes.  We do NOT produce a partial pass without a
  // defined set time — per requirement 8 (no set-before-rise).
  // If inProgressAtStart and no set crossing found, the satellite simply never
  // set within the window.

  return passes;
}

// ---------------------------------------------------------------------------
// Batch predictor
// ---------------------------------------------------------------------------

/**
 * Predict passes for multiple TLE records using bounded concurrency.
 *
 * One malformed/decayed TLE is silently skipped; valid predictions continue.
 *
 * @param records  - Array of TLE records.
 * @param query    - Shared observer/window/threshold configuration.
 * @param options  - Engine options including concurrency limit.
 * @returns        - Map from objectId → PassPrediction[] (ordered by rise time).
 */
export async function predictPasses(
  records: TleRecord[],
  query: PassPredictionQuery,
  options: PredictPassesOptions = {},
): Promise<Map<string, PassPrediction[]>> {
  const concurrency = options.concurrency ?? DEFAULT_CONCURRENCY;
  const result = new Map<string, PassPrediction[]>();

  // Bounded concurrency using a semaphore-style worker pool.
  const queue = [...records];
  const workers = Array.from({ length: Math.min(concurrency, queue.length) }, () =>
    runWorker(queue, query, options, result),
  );
  await Promise.all(workers);

  return result;
}

async function runWorker(
  queue: TleRecord[],
  query: PassPredictionQuery,
  options: PredictPassesOptions,
  result: Map<string, PassPrediction[]>,
): Promise<void> {
  while (queue.length > 0) {
    const record = queue.shift();
    if (!record) break;

    try {
      const passes = await predictPassesForTle(record, query, options);
      if (passes.length > 0) {
        result.set(record.id, passes);
      }
    } catch {
      // Malformed/decayed TLE — skip this record, continue with the rest.
    }
  }
}
