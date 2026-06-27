/**
 * GYA-16 – Horizons response parser.
 *
 * Horizons returns a single JSON envelope whose `result` field contains a
 * block of ASCII text.  We parse the `$$SOE` … `$$EOE` section (Start/End
 * Of Ephemeris) which holds one data row per step.
 *
 * Column layout for QUANTITIES='1,4,20':
 *   Date__(UT)__HR:MN   R.A._____(ICRF)_____DEC   dRA*cosD d(DEC)/dt
 *   ...                 Azi_(a-app)_Elev   ...
 *
 * We request ANG_FORMAT=DEG so RA is in decimal degrees (not HH MM SS).
 * We request QUANTITIES=1,4,20:
 *   1  → Astrometric RA & DEC (J2000 ICRF), decimal degrees
 *   4  → Apparent azimuth & elevation
 *  20  → Observer range (delta) and range-rate
 *
 * All numeric values are validated before use.  Any missing or non-finite
 * value throws a typed HorizonsProviderError with kind="parse".
 */

import { HorizonsProviderError, type PlanetEphemeris } from "./horizons.types.js";

// ---------------------------------------------------------------------------
// Raw Horizons API JSON envelope
// ---------------------------------------------------------------------------

interface HorizonsEnvelope {
  signature?: { version: string; source: string };
  result?: string;
  error?: string;
}

// ---------------------------------------------------------------------------
// Internal representation of one parsed ephemeris row
// ---------------------------------------------------------------------------

interface ParsedRow {
  /** UTC datetime string parsed from the table header, e.g. "2026-Jun-25 00:00" */
  datetime: string;
  /** RA in decimal degrees */
  ra: number;
  /** DEC in decimal degrees */
  dec: number;
  /** Azimuth in degrees (East of North / North-East convention per Horizons) */
  azDeg?: number;
  /** Elevation/altitude in degrees */
  altDeg?: number;
  /** Observer-to-body range in km */
  distanceKm?: number;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Parse a raw Horizons JSON response into a PlanetEphemeris.
 *
 * @param raw         - Raw JSON text from the Horizons API.
 * @param planetId    - Lower-case planet id (e.g. "mars").
 * @param planetName  - Display name (e.g. "Mars").
 * @param requestedAt - ISO-8601 UTC string representing the requested time
 *                      (used as a fallback if no table row is parsed).
 */
export function parseHorizonsResponse(
  raw: string,
  planetId: string,
  planetName: string,
  requestedAt: string,
): PlanetEphemeris {
  let envelope: HorizonsEnvelope;
  try {
    envelope = JSON.parse(raw) as HorizonsEnvelope;
  } catch (err) {
    throw new HorizonsProviderError("parse", "Horizons response is not valid JSON.", err);
  }

  if (envelope.error) {
    throw new HorizonsProviderError(
      "parse",
      `Horizons API returned an error: ${envelope.error}`,
    );
  }

  const resultText = envelope.result;
  if (!resultText || typeof resultText !== "string") {
    throw new HorizonsProviderError("parse", "Horizons response contains no result field.");
  }

  const row = extractFirstRow(resultText);

  return {
    id: planetId,
    kind: "planet",
    name: planetName,
    position: {
      ra: row.ra,
      dec: row.dec,
      ...(row.altDeg !== undefined ? { altDeg: row.altDeg } : {}),
      ...(row.azDeg !== undefined ? { azDeg: row.azDeg } : {}),
      ...(row.distanceKm !== undefined ? { distanceKm: row.distanceKm } : {}),
    },
    observedAt: isoFromHorizonsDate(row.datetime) ?? requestedAt,
    source: "NASA Horizons",
  };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Locate the $$SOE…$$EOE block and parse the first data row.
 * Throws HorizonsProviderError on any structural problem.
 */
function extractFirstRow(text: string): ParsedRow {
  const soeIdx = text.indexOf("$$SOE");
  const eoeIdx = text.indexOf("$$EOE");

  if (soeIdx === -1 || eoeIdx === -1 || soeIdx >= eoeIdx) {
    throw new HorizonsProviderError(
      "parse",
      "Horizons result text missing $$SOE/$$EOE markers — no ephemeris data.",
    );
  }

  const block = text.slice(soeIdx + "$$SOE".length, eoeIdx).trim();
  if (!block) {
    throw new HorizonsProviderError("parse", "Horizons ephemeris block is empty.");
  }

  // Each data row is a single long line.  Split and skip blank lines.
  const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) {
    throw new HorizonsProviderError("parse", "No data lines found in Horizons ephemeris block.");
  }

  const firstLine = lines[0];
  if (!firstLine) {
    throw new HorizonsProviderError("parse", "First ephemeris line is unexpectedly empty.");
  }
  return parseLine(firstLine);
}

/**
 * Parse a single Horizons observer-table line.
 *
 * Horizons with QUANTITIES='1,4,20' and ANG_FORMAT=DEG outputs rows like:
 *
 *   2026-Jun-25 00:00 *   85.123456   21.987654  -0.5432   0.1234  195.234  15.678  228315000.12
 *
 * Format:
 *   - First 17 chars: date/time "YYYY-Mon-DD HH:MM"
 *   - Char 18: single visibility flag character (* / C / N / etc.) or space
 *   - Then space-separated numeric tokens:
 *       [0] RA (deg)
 *       [1] DEC (deg)
 *       [2] dRA*cosD  (arcsec/h)  – skip
 *       [3] d(DEC)/dt (arcsec/h)  – skip
 *       [4] Azi (deg)
 *       [5] Elev (deg)
 *       [6] delta (km when RANGE_UNITS=KM)
 *       [7] deldot (km/s, suppressed when SUPPRESS_RANGE_RATE=YES → absent)
 *
 * Strategy: use a regex to find the date prefix, then split everything
 * after it on whitespace, ignoring the single-char visibility flag token.
 */
function parseLine(line: string): ParsedRow {
  // Match the date prefix: "YYYY-Mon-DD HH:MM" (possibly preceded by a space)
  const dateMatch = line.match(/(\d{4}-[A-Za-z]{3}-\d{2}\s+\d{2}:\d{2})/);
  if (!dateMatch || !dateMatch[1]) {
    throw new HorizonsProviderError("parse", `Cannot find date in line: "${line}"`);
  }
  const datetime = dateMatch[1].trim();

  // Everything after the 17-char date + 1-char flag = start at char 18
  // The visibility flag is a single non-digit char; skip it by filtering tokens.
  const afterDate = line.slice(line.indexOf(dateMatch[1]) + dateMatch[1].length).trim();

  // The first token may be a visibility flag (a single non-numeric character).
  // Split on whitespace and discard any token that can't be parsed as a number.
  const rawTokens = afterDate.split(/\s+/).filter(Boolean);

  // Collect the numeric tokens in order (skip visibility flags / non-numbers)
  const numTokens: string[] = [];
  for (const tok of rawTokens) {
    // Accept tokens that look like floats (including negative)
    if (/^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(tok)) {
      numTokens.push(tok);
    }
    // Stop accumulating non-numeric tokens after we have at least one numeric
    // (handles the single visibility char that might appear before the numbers).
    // But we do not break here — we keep all numeric tokens.
  }

  // Index mapping (see column description above):
  const ra = safeFloat(numTokens[0]);
  const dec = safeFloat(numTokens[1]);

  if (ra === null || !isFinite(ra)) {
    throw new HorizonsProviderError("parse", `Could not parse RA from line: "${line}"`);
  }
  if (dec === null || !isFinite(dec) || dec < -90 || dec > 90) {
    throw new HorizonsProviderError("parse", `Could not parse DEC from line: "${line}"`);
  }

  // Indices 2,3 are dRA*cosD and d(DEC)/dt — skip.
  const azDeg      = safeFinite(numTokens[4]);
  const altDeg     = safeFinite(numTokens[5]);
  const distanceKm = safeFinite(numTokens[6]);

  return {
    datetime,
    ra,
    dec,
    ...(azDeg !== null ? { azDeg } : {}),
    ...(altDeg !== null ? { altDeg } : {}),
    ...(distanceKm !== null ? { distanceKm } : {}),
  };
}

/** Parse a float; return null on failure. */
function safeFloat(token: string | undefined): number | null {
  if (token === undefined || token === "n.a.") return null;
  const n = parseFloat(token);
  return isNaN(n) ? null : n;
}

/** Parse a finite float; return null if missing, NaN, or non-finite. */
function safeFinite(token: string | undefined): number | null {
  const n = safeFloat(token);
  return n !== null && isFinite(n) ? n : null;
}

/**
 * Convert a Horizons calendar date string like "2026-Jun-25 00:00" to an
 * ISO-8601 UTC string.  Returns null if parsing fails.
 */
function isoFromHorizonsDate(horizonsDate: string): string | null {
  // "2026-Jun-25 00:00" → replace month abbreviation with number
  const MONTHS: Record<string, string> = {
    Jan: "01", Feb: "02", Mar: "03", Apr: "04",
    May: "05", Jun: "06", Jul: "07", Aug: "08",
    Sep: "09", Oct: "10", Nov: "11", Dec: "12",
  };

  const match = horizonsDate.match(/^(\d{4})-([A-Za-z]{3})-(\d{2})\s+(\d{2}):(\d{2})$/);
  if (!match) return null;

  const [, year, mon, day, hh, mm] = match;
  const monthNum = mon ? MONTHS[mon] : undefined;
  if (!monthNum) return null;

  return `${year}-${monthNum}-${day}T${hh}:${mm}:00.000Z`;
}
