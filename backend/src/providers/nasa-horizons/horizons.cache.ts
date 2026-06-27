/**
 * GYA-16 – 24-hour in-memory ephemeris cache.
 *
 * Design:
 *  - Each cache cell is keyed by (planetId, observer bucket, time window).
 *  - A "time window" is the UTC date (YYYY-MM-DD) of the requested time,
 *    rounded to the nearest hour, so that two requests within the same hour
 *    for the same planet + observer share a single entry.
 *  - Observer coordinates are rounded to 2 decimal places (≈ 1.1 km) to
 *    ensure nearby requests share the same cache bucket.
 *  - Concurrent requests for the same key share one in-flight Promise;
 *    no redundant HTTP calls are made.
 *  - Entries expire after 24 hours (CACHE_TTL_MS).
 *  - If an upstream call fails and a stale entry exists, the stale entry is
 *    returned with `stale: true`; no coordinates are invented.
 */

import type { CacheEntry, PlanetEphemeris } from "./horizons.types.js";

/** Time-to-live for cache entries: 24 hours. */
export const CACHE_TTL_MS = 24 * 60 * 60 * 1_000;

interface InFlightEntry {
  promise: Promise<PlanetEphemeris>;
}

/**
 * Builds a deterministic cache key from planet, observer, and time window.
 *
 * @param planetId  - Lower-case planet identifier.
 * @param lat       - Observer latitude.
 * @param lon       - Observer longitude.
 * @param utcHour   - UTC timestamp truncated to the nearest hour as an ISO string.
 */
export function buildCacheKey(
  planetId: string,
  lat: number,
  lon: number,
  utcHour: string,
): string {
  const latR = Math.round(lat * 100) / 100;
  const lonR = Math.round(lon * 100) / 100;
  return `${planetId}|${latR}|${lonR}|${utcHour}`;
}

/**
 * Truncates an ISO-8601 UTC timestamp to the nearest hour.
 *
 * @example truncateToHour("2026-06-25T13:47:22.000Z") → "2026-06-25T13:00:00.000Z"
 */
export function truncateToHour(isoUtc: string): string {
  const d = new Date(isoUtc);
  d.setUTCMinutes(0, 0, 0);
  return d.toISOString();
}

/** Milliseconds since epoch; injectable for tests. */
export type Clock = () => number;

export class HorizonsCache {
  private readonly entries = new Map<string, CacheEntry>();
  private readonly inFlight = new Map<string, InFlightEntry>();
  private readonly ttlMs: number;
  private readonly clock: Clock;

  constructor(ttlMs: number = CACHE_TTL_MS, clock: Clock = Date.now) {
    this.ttlMs = ttlMs;
    this.clock = clock;
  }

  /** Check if a valid (non-stale) entry exists without marking it stale. */
  isFresh(key: string): boolean {
    const entry = this.entries.get(key);
    if (!entry) return false;
    return this.clock() - entry.fetchedAt < this.ttlMs;
  }

  /** Return a fresh entry, or undefined if absent/expired. */
  getFresh(key: string): PlanetEphemeris | undefined {
    const entry = this.entries.get(key);
    if (!entry) return undefined;
    if (this.clock() - entry.fetchedAt >= this.ttlMs) return undefined;
    return entry.ephemeris;
  }

  /** Return a stale entry (expired but present), tagged with `stale: true`. */
  getStale(key: string): (PlanetEphemeris & { _stale: true }) | undefined {
    const entry = this.entries.get(key);
    if (!entry) return undefined;
    return { ...entry.ephemeris, _stale: true };
  }

  /** Store an entry in the cache, replacing any existing entry for this key. */
  set(key: string, ephemeris: PlanetEphemeris): void {
    this.entries.set(key, {
      ephemeris,
      fetchedAt: this.clock(),
    });
  }

  /** Return the in-flight Promise for this key, if one exists. */
  getInFlight(key: string): Promise<PlanetEphemeris> | undefined {
    return this.inFlight.get(key)?.promise;
  }

  /** Register an in-flight Promise for deduplication. */
  setInFlight(key: string, promise: Promise<PlanetEphemeris>): void {
    this.inFlight.set(key, { promise });
    // When the promise resolves or rejects, clean up the in-flight slot.
    promise.then(
      (result) => {
        this.set(key, result);
        this.inFlight.delete(key);
      },
      () => {
        this.inFlight.delete(key);
      },
    );
  }

  /** Exposed for testing: how many entries are currently in the cache. */
  get size(): number {
    return this.entries.size;
  }

  /** Exposed for testing: how many in-flight requests are active. */
  get inFlightSize(): number {
    return this.inFlight.size;
  }

  /** Remove all entries (used in tests). */
  clear(): void {
    this.entries.clear();
    this.inFlight.clear();
  }
}
