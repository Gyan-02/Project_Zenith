/**
 * GYA-16 – NASA Horizons provider types.
 *
 * These types are provider-owned and deliberately kept separate from the
 * shared `contracts.ts` so the provider can evolve independently. The
 * GYA-36 aggregator will map these into the shared SkyObject shape.
 */

// ---------------------------------------------------------------------------
// Observer / input types
// ---------------------------------------------------------------------------

export interface ObserverLocation {
  /** Geodetic latitude in decimal degrees (positive = North). */
  lat: number;
  /** Geodetic longitude in decimal degrees (positive = East). */
  lon: number;
  /** Elevation above sea level in metres. Defaults to 0 when omitted. */
  elevationM?: number;
}

// ---------------------------------------------------------------------------
// Output / normalised types
// ---------------------------------------------------------------------------

/**
 * Normalised planetary ephemeris returned by the Horizons provider.
 * Compatible with the planned Zenith sky-state shape; additional fields
 * (altDeg, azDeg, distanceKm) are optional.
 */
export interface PlanetEphemeris {
  /** Lower-case planet identifier, e.g. "mars". */
  id: string;
  kind: "planet";
  /** Display name, e.g. "Mars". */
  name: string;
  position: {
    /** Right ascension in decimal degrees (J2000 ICRF). */
    ra: number;
    /** Declination in decimal degrees (J2000 ICRF). */
    dec: number;
    /** Apparent altitude above horizon in degrees (optional). */
    altDeg?: number;
    /** Azimuth in degrees, measured East of North (optional). */
    azDeg?: number;
    /** Observer-to-planet distance in kilometres (optional). */
    distanceKm?: number;
  };
  /** ISO-8601 UTC timestamp the ephemeris was computed for. */
  observedAt: string;
  source: "NASA Horizons";
}

// ---------------------------------------------------------------------------
// Cache types
// ---------------------------------------------------------------------------

export interface CacheEntry {
  ephemeris: PlanetEphemeris;
  /** Wall-clock time (ms since epoch) when the entry was fetched. */
  fetchedAt: number;
  /** Whether this entry is from a stale fallback after an upstream failure. */
  stale?: boolean;
}

// ---------------------------------------------------------------------------
// Error types
// ---------------------------------------------------------------------------

export type HorizonsErrorKind = "timeout" | "upstream_http" | "parse";

export class HorizonsProviderError extends Error {
  override name = "HorizonsProviderError";
  constructor(
    public readonly kind: HorizonsErrorKind,
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
  }
}
