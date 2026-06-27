/**
 * GYA-16 – Unit tests for horizons.parser.ts
 */

import { describe, it, expect } from "vitest";
import { parseHorizonsResponse } from "../horizons.parser.js";
import { HorizonsProviderError } from "../horizons.types.js";

// ---------------------------------------------------------------------------
// Fixture: representative Horizons response text for Mars
// (columns: date, vis, RA_deg, DEC_deg, dRA*cosD, d(DEC)/dt, Azi, Elev, delta)
// ---------------------------------------------------------------------------

const HORIZONS_RESULT_MARS = `
 Revised: Jul 31, 2013              Mars                             499 / 499

 PHYSICAL DATA (updated 2019-Oct-29):
  Vol. mean radius (km) = 3389.92+-0.04   Density (g cm^-3)= 3.933(5+-4)

 OBSERVER TABLE

 Date__(UT)__HR:MN     R.A._____(ICRF)_____DEC    dRA*cosD d(DEC)/dt  Azi_(a-appr)_Elev       delta
*******************************************************************************
$$SOE
 2026-Jun-25 00:00 *    85.123456   21.987654   -0.5432   0.1234   195.234   15.678   228315000.123
 2026-Jun-25 00:01      85.123789   21.987891   -0.5433   0.1235   195.240   15.680   228315010.456
$$EOE
`;

const ENVELOPE_MARS = JSON.stringify({
  signature: { version: "1.2", source: "NASA/JPL Horizons API" },
  result: HORIZONS_RESULT_MARS,
});

// ---------------------------------------------------------------------------
// Fixture: response with no $$SOE marker
// ---------------------------------------------------------------------------

const ENVELOPE_NO_SOE = JSON.stringify({
  signature: { version: "1.2", source: "NASA/JPL Horizons API" },
  result: "Something went wrong, no ephemeris here.",
});

// ---------------------------------------------------------------------------
// Fixture: Horizons error response
// ---------------------------------------------------------------------------

const ENVELOPE_ERROR = JSON.stringify({
  signature: { version: "1.2", source: "NASA/JPL Horizons API" },
  error: "No ephemeris found for requested body.",
  result: "Error: No ephemeris found for requested body.",
});

// ---------------------------------------------------------------------------
// Fixture: empty $$SOE block
// ---------------------------------------------------------------------------

const ENVELOPE_EMPTY_SOE = JSON.stringify({
  signature: { version: "1.2", source: "NASA/JPL Horizons API" },
  result: "$$SOE\n$$EOE\n",
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("parseHorizonsResponse", () => {
  it("parses a representative mocked Horizons response into normalised shape", () => {
    const result = parseHorizonsResponse(ENVELOPE_MARS, "mars", "Mars", "2026-06-25T00:00:00.000Z");

    expect(result.id).toBe("mars");
    expect(result.kind).toBe("planet");
    expect(result.name).toBe("Mars");
    expect(result.source).toBe("NASA Horizons");
    expect(result.observedAt).toBe("2026-06-25T00:00:00.000Z");
  });

  it("produces finite RA and DEC numbers", () => {
    const result = parseHorizonsResponse(ENVELOPE_MARS, "mars", "Mars", "2026-06-25T00:00:00.000Z");
    expect(isFinite(result.position.ra)).toBe(true);
    expect(isFinite(result.position.dec)).toBe(true);
  });

  it("parses RA value correctly", () => {
    const result = parseHorizonsResponse(ENVELOPE_MARS, "mars", "Mars", "2026-06-25T00:00:00.000Z");
    expect(result.position.ra).toBeCloseTo(85.123456, 4);
  });

  it("parses DEC value correctly", () => {
    const result = parseHorizonsResponse(ENVELOPE_MARS, "mars", "Mars", "2026-06-25T00:00:00.000Z");
    expect(result.position.dec).toBeCloseTo(21.987654, 4);
  });

  it("parses optional altDeg as a finite number", () => {
    const result = parseHorizonsResponse(ENVELOPE_MARS, "mars", "Mars", "2026-06-25T00:00:00.000Z");
    expect(result.position.altDeg).toBeDefined();
    expect(isFinite(result.position.altDeg!)).toBe(true);
    expect(result.position.altDeg).toBeCloseTo(15.678, 2);
  });

  it("parses optional azDeg as a finite number", () => {
    const result = parseHorizonsResponse(ENVELOPE_MARS, "mars", "Mars", "2026-06-25T00:00:00.000Z");
    expect(result.position.azDeg).toBeDefined();
    expect(isFinite(result.position.azDeg!)).toBe(true);
    expect(result.position.azDeg).toBeCloseTo(195.234, 2);
  });

  it("parses optional distanceKm as a finite number", () => {
    const result = parseHorizonsResponse(ENVELOPE_MARS, "mars", "Mars", "2026-06-25T00:00:00.000Z");
    expect(result.position.distanceKm).toBeDefined();
    expect(isFinite(result.position.distanceKm!)).toBe(true);
    expect(result.position.distanceKm).toBeCloseTo(228315000.123, 0);
  });

  it("throws HorizonsProviderError with kind='parse' when $$SOE is missing", () => {
    expect(() =>
      parseHorizonsResponse(ENVELOPE_NO_SOE, "mars", "Mars", "2026-06-25T00:00:00.000Z"),
    ).toThrowError(HorizonsProviderError);

    try {
      parseHorizonsResponse(ENVELOPE_NO_SOE, "mars", "Mars", "2026-06-25T00:00:00.000Z");
    } catch (err) {
      expect(err).toBeInstanceOf(HorizonsProviderError);
      expect((err as HorizonsProviderError).kind).toBe("parse");
    }
  });

  it("throws HorizonsProviderError when the API returns an error field", () => {
    expect(() =>
      parseHorizonsResponse(ENVELOPE_ERROR, "mars", "Mars", "2026-06-25T00:00:00.000Z"),
    ).toThrowError(HorizonsProviderError);
  });

  it("throws HorizonsProviderError when the $$SOE block is empty", () => {
    expect(() =>
      parseHorizonsResponse(ENVELOPE_EMPTY_SOE, "mars", "Mars", "2026-06-25T00:00:00.000Z"),
    ).toThrowError(HorizonsProviderError);
  });

  it("throws HorizonsProviderError when response is not valid JSON", () => {
    expect(() =>
      parseHorizonsResponse("not-json-at-all", "mars", "Mars", "2026-06-25T00:00:00.000Z"),
    ).toThrowError(HorizonsProviderError);
  });

  it("uses the requestedAt fallback for observedAt when date cannot be parsed", () => {
    // The line contains a syntactically valid date-looking string but with
    // an invalid month abbreviation ("Xyz") so isoFromHorizonsDate returns null.
    const badMonthLine = " 2026-Xyz-25 00:00 *    45.0  10.0  0.0  0.0  180.0  30.0  100000.0";
    const envelope = JSON.stringify({
      result: `$$SOE\n${badMonthLine}\n$$EOE\n`,
    });
    const result = parseHorizonsResponse(envelope, "venus", "Venus", "2026-06-25T00:00:00.000Z");
    expect(result.observedAt).toBe("2026-06-25T00:00:00.000Z");
  });
});
