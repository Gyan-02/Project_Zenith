/**
 * GYA-16 – NASA JPL Horizons HTTP client.
 *
 * Wraps the Horizons REST API (https://ssd.jpl.nasa.gov/api/horizons.api)
 * with:
 *  - Request timeout (default 15 s)
 *  - Typed error categories: timeout / upstream_http / parse
 *  - Injectable `fetch` and `clock` for deterministic unit tests
 *
 * API reference: https://ssd-api.jpl.nasa.gov/doc/horizons.html
 *
 * QUANTITIES used:
 *   1  → Astrometric RA & DEC (ICRF, decimal degrees via ANG_FORMAT=DEG)
 *   4  → Apparent azimuth and elevation (airless)
 *  20  → Observer range (delta) and range-rate
 *       (RANGE_UNITS=KM so delta is already in km)
 *
 * Planet Horizons body IDs (major-body numeric codes):
 *   Mercury 199 | Venus 299 | Mars 499 | Jupiter 599
 *   Saturn  699 | Uranus 799 | Neptune 899
 *
 * Earth (399) is excluded as it is always the observer body.
 *
 * CENTER: we use 'coord@399' (geocentric Earth) and supply SITE_COORD for
 * the observer's geodetic position so altitude/azimuth is topocentric.
 */

import { HorizonsProviderError, type ObserverLocation, type PlanetEphemeris } from "./horizons.types.js";
import { parseHorizonsResponse } from "./horizons.parser.js";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const HORIZONS_API_URL = "https://ssd.jpl.nasa.gov/api/horizons.api";
const DEFAULT_TIMEOUT_MS = 15_000;

export interface Planet {
  id: string;
  name: string;
  horizonsId: string; // Horizons numeric body code
}

/** All non-Earth planets supported by this provider. */
export const PLANETS: Planet[] = [
  { id: "mercury", name: "Mercury", horizonsId: "199" },
  { id: "venus",   name: "Venus",   horizonsId: "299" },
  { id: "mars",    name: "Mars",    horizonsId: "499" },
  { id: "jupiter", name: "Jupiter", horizonsId: "599" },
  { id: "saturn",  name: "Saturn",  horizonsId: "699" },
  { id: "uranus",  name: "Uranus",  horizonsId: "799" },
  { id: "neptune", name: "Neptune", horizonsId: "899" },
];

export type FetchFn = typeof fetch;

export interface HorizonsClientOptions {
  /** Injected fetch function (defaults to global fetch). */
  fetch?: FetchFn;
  /** Request timeout in milliseconds (default 15 000). */
  timeoutMs?: number;
}

// ---------------------------------------------------------------------------
// Public client function
// ---------------------------------------------------------------------------

/**
 * Fetch the ephemeris for a single planet at a given observer location and
 * time from the NASA JPL Horizons API.
 *
 * @param planet     - Planet descriptor (use one of the exported PLANETS).
 * @param observer   - Geodetic observer coordinates.
 * @param utcIso     - Requested UTC time as an ISO-8601 string.
 * @param opts       - Optional overrides (fetch, timeout).
 * @returns          - Normalised PlanetEphemeris.
 * @throws           - HorizonsProviderError on any failure.
 */
export async function fetchPlanetEphemeris(
  planet: Planet,
  observer: ObserverLocation,
  utcIso: string,
  opts: HorizonsClientOptions = {},
): Promise<PlanetEphemeris> {
  const fetchFn = opts.fetch ?? globalThis.fetch;
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  // Compute stop time = start + 2 minutes so Horizons always has at least one
  // row to output (minimum step is 1 min, we request STEP_SIZE=1%20m).
  const startDate = new Date(utcIso);
  const stopDate = new Date(startDate.getTime() + 2 * 60 * 1_000);

  const formatDate = (d: Date): string =>
    d.toISOString().replace("T", " ").replace(/\.\d{3}Z$/, "");

  const elevM = observer.elevationM ?? 0;

  // All comma-containing values must be URL-encoded as '%27val%27' (single
  // quoted) per the Horizons API spec.  Alternatively we can use %2C for commas.
  const params = new URLSearchParams({
    format: "json",
    COMMAND: `'${planet.horizonsId}'`,
    OBJ_DATA: "NO",
    MAKE_EPHEM: "YES",
    EPHEM_TYPE: "OBSERVER",
    CENTER: "coord@399",
    COORD_TYPE: "GEODETIC",
    SITE_COORD: `'${observer.lon},${observer.lat},${elevM}'`,
    START_TIME: `'${formatDate(startDate)}'`,
    STOP_TIME: `'${formatDate(stopDate)}'`,
    STEP_SIZE: "'1 m'",
    QUANTITIES: "'1,4,20'",
    ANG_FORMAT: "DEG",
    RANGE_UNITS: "KM",
    SUPPRESS_RANGE_RATE: "YES",
    CAL_TYPE: "GREGORIAN",
  });

  const url = `${HORIZONS_API_URL}?${params.toString()}`;

  let rawText: string;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    let response: Response;
    try {
      response = await fetchFn(url, { signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }

    if (!response.ok) {
      throw new HorizonsProviderError(
        "upstream_http",
        `Horizons API responded with HTTP ${response.status} ${response.statusText}`,
      );
    }

    rawText = await response.text();
  } catch (err) {
    if (err instanceof HorizonsProviderError) throw err;

    // AbortController fires a DOMException with name "AbortError"
    const isAbort =
      err instanceof Error && (err.name === "AbortError" || err.message.includes("abort"));

    throw new HorizonsProviderError(
      isAbort ? "timeout" : "upstream_http",
      isAbort
        ? `Horizons request timed out after ${timeoutMs} ms.`
        : `Network error fetching Horizons: ${String(err)}`,
      err,
    );
  }

  return parseHorizonsResponse(rawText, planet.id, planet.name, utcIso);
}
