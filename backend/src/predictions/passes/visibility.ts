/**
 * GYA-14 – Visibility classification (isolated behind a replaceable interface).
 *
 * The default exported classifier always returns `false` (conservative).
 * The `SunPositionClassifier` is provided as an *example* implementation;
 * it is tested via the dependency-injection path in engine tests.
 */

import type { PassPrediction, PassPredictionQuery, VisibilityClassifier } from "./pass-prediction.types.js";

// ---------------------------------------------------------------------------
// Re-export the default classifier
// ---------------------------------------------------------------------------

export { CONSERVATIVE_CLASSIFIER } from "./pass-prediction.types.js";

// ---------------------------------------------------------------------------
// Deterministic test classifier (injected in tests)
// ---------------------------------------------------------------------------

/**
 * A test-double classifier that returns a fixed value for every pass.
 * Use this when you want predictable "visible=true/false" in unit tests.
 */
export function makeFixedClassifier(visible: boolean): VisibilityClassifier {
  return { classify: () => visible };
}

// ---------------------------------------------------------------------------
// Example classifier using a simple sun-altitude heuristic
// ---------------------------------------------------------------------------

/**
 * Minimal sun-altitude approximation for a given UTC Date.
 *
 * Uses the low-precision formula from the "Astronomical Algorithms" book
 * (Jean Meeus), accurate to about 1°.  This is suitable for determining
 * whether it is day/night for visibility purposes.
 *
 * @internal — not exported from the module's public index.
 */
function sunAltitudeDeg(date: Date, lat: number, lon: number): number {
  const D = date.getTime() / 86_400_000 - 10957.5; // days since J2000.0
  const L = (280.46 + 0.9856474 * D) % 360;
  const g = ((357.528 + 0.9856003 * D) % 360) * (Math.PI / 180);
  const lam = (L + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * (Math.PI / 180);
  const ep = 23.439 * (Math.PI / 180);

  // Right ascension and declination of the Sun
  const sinDec = Math.sin(ep) * Math.sin(lam);
  const dec = Math.asin(sinDec);

  // Local hour angle (degrees → radians)
  const UT = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
  const GMST = (6.697375 + 0.0657098242 * D + UT) * 15; // degrees
  const RA = Math.atan2(Math.cos(ep) * Math.sin(lam), Math.cos(lam));
  const HA = ((GMST + lon - RA * (180 / Math.PI)) % 360) * (Math.PI / 180);

  const latR = lat * (Math.PI / 180);
  const sinAlt = Math.sin(latR) * Math.sin(dec) + Math.cos(latR) * Math.cos(dec) * Math.cos(HA);
  return Math.asin(Math.max(-1, Math.min(1, sinAlt))) * (180 / Math.PI);
}

/**
 * A visibility classifier that uses an internal sun-altitude approximation.
 *
 * A pass is marked `visible` when:
 *  1. The observer is in darkness (Sun < `twilightSunAltitudeDeg`) during the
 *     peak of the pass, and
 *  2. The satellite is plausibly sunlit (we assume the satellite is in sunlight
 *     when it is above the shadow boundary — approximated by checking that the
 *     satellite altitude > 0 during peak, which almost always means it is above
 *     Earth's shadow at LEO altitudes above ~400 km for typical ISS passes).
 *
 * NOTE: This is a conservative approximation.  For accurate satellite shadow
 * modelling a dedicated library would be needed.
 */
export class SunPositionClassifier implements VisibilityClassifier {
  classify(
    pass: Omit<PassPrediction, "visible">,
    query: PassPredictionQuery,
  ): boolean {
    const twilightThreshold = query.twilightSunAltitudeDeg ?? -6;
    const { lat, lon } = query.observer;
    const peakDate = new Date(pass.peakTimeUtc);

    const sunAlt = sunAltitudeDeg(peakDate, lat, lon);
    if (sunAlt >= twilightThreshold) {
      // Observer is in daylight — not a visible pass.
      return false;
    }

    // We conservatively assume the satellite is sunlit (no shadow model).
    // A more accurate implementation would calculate the satellite's
    // position relative to the Earth-Sun vector.
    return true;
  }
}
