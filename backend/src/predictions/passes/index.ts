/**
 * GYA-14 – Pass prediction module public entry point.
 *
 * ## Example usage (GYA-32 / GYA-36 aggregator)
 *
 * ```ts
 * import { predictPassesForTle, predictPasses, azimuthToDirection } from
 *   "./predictions/passes/index.js";
 * import { parseTleCatalog } from "./providers/celestrak/index.js";
 *
 * // Single satellite:
 * const record = parseTleCatalog(ISS_TLE_STRING)[0]!;
 * const passes = await predictPassesForTle(record, {
 *   observer: { lat: 25.61, lon: 85.14, elevationM: 53 },
 *   startTimeUtc: new Date().toISOString(),
 *   windowHours: 24,
 *   minimumElevationDeg: 10,
 * });
 *
 * // Batch (all active satellites):
 * const catalog = await celestrakProvider.getCatalog();
 * const allPasses = await predictPasses(catalog.records, query, {
 *   concurrency: 8,
 * });
 *
 * // Cardinal direction:
 * const dir = azimuthToDirection(270); // "W"
 * ```
 */

export { predictPassesForTle, predictPasses } from "./pass-prediction.engine.js";
export { azimuthToDirection } from "./direction.js";
export { CONSERVATIVE_CLASSIFIER, makeFixedClassifier, SunPositionClassifier } from "./visibility.js";
export type {
  PassPrediction,
  PassPredictionQuery,
  PassDirection,
  PredictPassesOptions,
  VisibilityClassifier,
} from "./pass-prediction.types.js";
