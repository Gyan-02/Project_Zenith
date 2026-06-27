/**
 * GYA-14 – Pass prediction public types.
 */

// ---------------------------------------------------------------------------
// Cardinal direction
// ---------------------------------------------------------------------------

export type PassDirection = "N" | "NE" | "E" | "SE" | "S" | "SW" | "W" | "NW";

// ---------------------------------------------------------------------------
// Core output shape
// ---------------------------------------------------------------------------

export interface PassPrediction {
  /** Satellite catalogue id (e.g. "sat-25544"). */
  objectId: string;
  /** Human-readable name (e.g. "ISS (ZARYA)"). */
  name: string;
  /** ISO-8601 UTC – moment the satellite clears the elevation threshold. */
  riseTimeUtc: string;
  /** ISO-8601 UTC – moment of maximum elevation during the pass. */
  peakTimeUtc: string;
  /** ISO-8601 UTC – moment the satellite drops below the elevation threshold. */
  setTimeUtc: string;
  /** Duration from rise to set in whole seconds. */
  durationSeconds: number;
  /** Maximum elevation reached during the pass, in degrees (≥ minimumElevationDeg). */
  maxElevationDeg: number;
  /** Azimuth at rise, degrees (0–360, East of North). */
  riseAzimuthDeg: number;
  /** Azimuth at set, degrees (0–360, East of North). */
  setAzimuthDeg: number;
  /** Cardinal direction at rise. */
  riseDirection: PassDirection;
  /** Cardinal direction at set. */
  setDirection: PassDirection;
  /**
   * True when the pass is potentially visually observable:
   * the satellite is likely sunlit AND the observer is in astronomical
   * darkness or civil twilight.  Requires an injected VisibilityClassifier;
   * defaults to false when none is provided.
   */
  visible: boolean;
  source: "CelesTrak TLE + satellite.js SGP4";
}

// ---------------------------------------------------------------------------
// Query / configuration
// ---------------------------------------------------------------------------

export interface PassPredictionQuery {
  observer: { lat: number; lon: number; elevationM?: number };
  /** ISO-8601 UTC start of the prediction window. */
  startTimeUtc: string;
  /** Length of the prediction window in hours.  Default 24, maximum 72. */
  windowHours?: number;
  /** Only return passes whose peak elevation reaches this threshold.  Default 10°. */
  minimumElevationDeg?: number;
  /**
   * Sun altitude (degrees) below which the observer is considered to be in
   * civil twilight or darker (negative value).  Default −6°.
   * Used by the VisibilityClassifier; ignored when no classifier is injected.
   */
  twilightSunAltitudeDeg?: number;
}

// ---------------------------------------------------------------------------
// Visibility classifier interface (dependency-injected)
// ---------------------------------------------------------------------------

/**
 * Encapsulates the "is this pass potentially visible?" decision.
 *
 * Implementations may use Sun-position libraries (e.g. SunCalc) or any
 * other heuristic.  The default implementation always returns `false` so
 * that we never falsely claim a pass is visible when the required inputs
 * are unavailable.
 */
export interface VisibilityClassifier {
  /**
   * @param pass         - The completed PassPrediction (visible field not yet set).
   * @param query        - The original query (contains observer + twilight threshold).
   * @returns            - true if the pass is plausibly optically visible.
   */
  classify(
    pass: Omit<PassPrediction, "visible">,
    query: PassPredictionQuery,
  ): boolean;
}

/** Default classifier – always conservatively returns false. */
export const CONSERVATIVE_CLASSIFIER: VisibilityClassifier = {
  classify: () => false,
};

// ---------------------------------------------------------------------------
// Engine options
// ---------------------------------------------------------------------------

export interface PredictPassesOptions {
  /** Coarse scan step in seconds.  Default 30. */
  coarseStepSeconds?: number;
  /** Maximum number of parallel TLE predictions.  Default 8. */
  concurrency?: number;
  /** Inject a custom visibility classifier. */
  visibilityClassifier?: VisibilityClassifier;
}
