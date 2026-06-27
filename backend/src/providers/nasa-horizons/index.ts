/**
 * GYA-16 – NASA Horizons planetary provider.
 *
 * Public entry point for the GYA-36 aggregator (and any other consumer).
 *
 * ## Capabilities
 *  - Fetches topocentric RA/Dec, altitude, azimuth, and observer range for
 *    Mercury, Venus, Mars, Jupiter, Saturn, Uranus, and Neptune.
 *  - Results are cached for 24 hours per (planet, observer bucket, UTC hour).
 *  - Concurrent identical requests share one in-flight HTTP call.
 *  - On upstream failure, a stale cached entry is returned (tagged `_stale`)
 *    rather than throwing, preventing transient outages from breaking the UI.
 *
 * ## Example usage (GYA-36 aggregator)
 *
 * ```ts
 * import { getPlanets, PLANETS } from "./providers/nasa-horizons/index.js";
 *
 * const planets = await getPlanets(
 *   { lat: 25.61, lon: 85.14 },     // Patna, India
 *   "2026-06-25T00:00:00.000Z",
 * );
 *
 * // Each element is a PlanetEphemeris or a PlanetEphemeris & { _stale: true }
 * for (const p of planets) {
 *   console.log(p.name, p.position.ra, p.position.dec);
 * }
 * ```
 *
 * ## Injecting a custom fetch (e.g. in tests)
 *
 * ```ts
 * const planets = await getPlanets(location, time, {
 *   fetch: myMockFetch,
 *   timeoutMs: 500,
 * });
 * ```
 */

import { HorizonsCache, buildCacheKey, truncateToHour } from "./horizons.cache.js";
import { fetchPlanetEphemeris, PLANETS, type FetchFn } from "./horizons.client.js";
import {
  HorizonsProviderError,
  type ObserverLocation,
  type PlanetEphemeris,
} from "./horizons.types.js";

// ---------------------------------------------------------------------------
// Shared module-level cache (singleton per process)
// ---------------------------------------------------------------------------

const sharedCache = new HorizonsCache();

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface GetPlanetsOptions {
  /** Injected fetch function for tests. Defaults to `globalThis.fetch`. */
  fetch?: FetchFn;
  /** Request timeout in milliseconds. Defaults to 15 000. */
  timeoutMs?: number;
  /** Inject a custom cache instance (for tests). Defaults to the module cache. */
  cache?: HorizonsCache;
}

export type PlanetResult = PlanetEphemeris | (PlanetEphemeris & { _stale: true });

/**
 * Fetch ephemeris for all 7 supported planets for a given observer and time.
 *
 * Results are returned as a settled array: individual planet failures fall
 * back to stale cache data where available; planets with neither fresh nor
 * stale data are omitted from the array (not thrown).
 *
 * @param observer  - Observer geodetic coordinates.
 * @param utcIso    - Requested UTC time as ISO-8601 string.
 * @param opts      - Optional overrides.
 */
export async function getPlanets(
  observer: ObserverLocation,
  utcIso: string,
  opts: GetPlanetsOptions = {},
): Promise<PlanetResult[]> {
  const cache = opts.cache ?? sharedCache;
  const results: PlanetResult[] = [];

  await Promise.all(
    PLANETS.map(async (planet) => {
      try {
        const eph = await getSinglePlanet(planet.id, observer, utcIso, { ...opts, cache });
        results.push(eph);
      } catch {
        // Planet had no stale fallback and fetch failed — skip silently.
        // Callers can observe the missing planet from the array length.
      }
    }),
  );

  return results;
}

/**
 * Fetch ephemeris for a single named planet.
 *
 * @param planetId  - Lower-case planet identifier (e.g. "mars").
 * @param observer  - Observer geodetic coordinates.
 * @param utcIso    - Requested UTC time as ISO-8601 string.
 * @param opts      - Optional overrides.
 * @throws          - HorizonsProviderError if no cached fallback is available.
 */
export async function getSinglePlanet(
  planetId: string,
  observer: ObserverLocation,
  utcIso: string,
  opts: GetPlanetsOptions = {},
): Promise<PlanetResult> {
  const planet = PLANETS.find((p) => p.id === planetId);
  if (!planet) {
    throw new HorizonsProviderError("parse", `Unknown planet id: "${planetId}"`);
  }

  const cache = opts.cache ?? sharedCache;
  const utcHour = truncateToHour(utcIso);
  const key = buildCacheKey(planetId, observer.lat, observer.lon, utcHour);

  // 1. Fresh cache hit → return immediately, no HTTP call.
  const fresh = cache.getFresh(key);
  if (fresh) return fresh;

  // 2. In-flight deduplication → share the existing promise.
  const inFlight = cache.getInFlight(key);
  if (inFlight) {
    try {
      return await inFlight;
    } catch {
      // Fall through to stale / new fetch logic below.
    }
  }

  // 3. Start a new HTTP request; register it as in-flight immediately so
  //    concurrent calls in the same tick share this promise.
  const fetchPromise = fetchPlanetEphemeris(planet, observer, utcIso, {
    fetch: opts.fetch,
    timeoutMs: opts.timeoutMs,
  });
  cache.setInFlight(key, fetchPromise);

  try {
    return await fetchPromise;
    // Note: setInFlight's .then() handler calls cache.set() on success.
  } catch (err) {
    // 4. On failure, return stale entry if available (rather than throwing).
    const stale = cache.getStale(key);
    if (stale) return stale;

    // 5. No fallback → rethrow.
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Re-exports for convenience
// ---------------------------------------------------------------------------

export { PLANETS, type Planet } from "./horizons.client.js";
export { HorizonsCache, buildCacheKey, truncateToHour, CACHE_TTL_MS } from "./horizons.cache.js";
export { HorizonsProviderError, type PlanetEphemeris, type ObserverLocation } from "./horizons.types.js";
