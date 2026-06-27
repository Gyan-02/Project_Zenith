/**
 * GYA-32 – Tests for buildConstellationSegments.
 */

import { describe, expect, it } from "vitest";
import { buildConstellationSegments } from "../constellation-lines.js";
import type { SkyStateWithConstellations, ConstellationInput } from "../constellation-lines.js";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const FIXED_DATE = new Date("2026-08-12T20:30:00.000Z");
const OBSERVER   = { lat: 25.61, lon: 85.14 };

const ORION: ConstellationInput = {
  id: "orion",
  name: "Orion",
  points: [
    { ra: 88.8, dec: 7.4 },
    { ra: 81.3, dec: 6.35 },
    { ra: 84.1, dec: -1.2 },
    { ra: 83.2, dec: -2.6 },
  ],
};

const SCORPIUS: ConstellationInput = {
  id: "scorpius",
  name: "Scorpius",
  points: [
    { ra: 247.4, dec: -26.4 },
    { ra: 252.2, dec: -25.6 },
    { ra: 255.0, dec: -29.2 },
  ],
};

function makeState(constellations: ConstellationInput[]): SkyStateWithConstellations {
  return { constellations, location: OBSERVER };
}

// ---------------------------------------------------------------------------
// Segment count
// ---------------------------------------------------------------------------

describe("buildConstellationSegments – segment count", () => {
  it("creates N-1 segments for a constellation with N points", () => {
    const segments = buildConstellationSegments(makeState([ORION]), FIXED_DATE);
    // Orion has 4 points → 3 segments
    expect(segments.filter((s) => s.constellationId === "orion")).toHaveLength(3);
  });

  it("creates segments for multiple constellations", () => {
    const segments = buildConstellationSegments(makeState([ORION, SCORPIUS]), FIXED_DATE);
    const orionSegs    = segments.filter((s) => s.constellationId === "orion");
    const scorpiusSegs = segments.filter((s) => s.constellationId === "scorpius");
    expect(orionSegs).toHaveLength(3);
    expect(scorpiusSegs).toHaveLength(2);
  });

  it("returns an empty array when no constellations", () => {
    expect(buildConstellationSegments(makeState([]), FIXED_DATE)).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Invalid / edge inputs
// ---------------------------------------------------------------------------

describe("buildConstellationSegments – invalid inputs", () => {
  it("skips a constellation with only 1 point", () => {
    const state = makeState([{ id: "one", name: "Single Star", points: [{ ra: 90, dec: 0 }] }]);
    expect(buildConstellationSegments(state, FIXED_DATE)).toHaveLength(0);
  });

  it("skips a constellation with empty points array", () => {
    const state = makeState([{ id: "empty", name: "Empty", points: [] }]);
    expect(buildConstellationSegments(state, FIXED_DATE)).toHaveLength(0);
  });

  it("handles state without a location field (uses default observer)", () => {
    const state: SkyStateWithConstellations = { constellations: [ORION] };
    // Should not throw
    expect(() => buildConstellationSegments(state, FIXED_DATE)).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// ID stability
// ---------------------------------------------------------------------------

describe("buildConstellationSegments – id stability", () => {
  it("segment ids follow the pattern <constellationId>-seg-<index>", () => {
    const segs = buildConstellationSegments(makeState([ORION]), FIXED_DATE);
    expect(segs[0]!.id).toBe("orion-seg-0");
    expect(segs[1]!.id).toBe("orion-seg-1");
    expect(segs[2]!.id).toBe("orion-seg-2");
  });

  it("constellationId and name are propagated to every segment", () => {
    const segs = buildConstellationSegments(makeState([ORION]), FIXED_DATE);
    for (const seg of segs) {
      expect(seg.constellationId).toBe("orion");
      expect(seg.name).toBe("Orion");
    }
  });
});

// ---------------------------------------------------------------------------
// Alt/Az output validity
// ---------------------------------------------------------------------------

describe("buildConstellationSegments – alt/az output", () => {
  it("all start and end alt/az values are finite numbers", () => {
    const segs = buildConstellationSegments(makeState([ORION, SCORPIUS]), FIXED_DATE);
    expect(segs.length).toBeGreaterThan(0);
    for (const seg of segs) {
      expect(Number.isFinite(seg.start.altDeg)).toBe(true);
      expect(Number.isFinite(seg.start.azDeg)).toBe(true);
      expect(Number.isFinite(seg.end.altDeg)).toBe(true);
      expect(Number.isFinite(seg.end.azDeg)).toBe(true);
    }
  });

  it("azDeg values are in [0, 360)", () => {
    const segs = buildConstellationSegments(makeState([ORION]), FIXED_DATE);
    for (const seg of segs) {
      expect(seg.start.azDeg).toBeGreaterThanOrEqual(0);
      expect(seg.start.azDeg).toBeLessThan(360);
      expect(seg.end.azDeg).toBeGreaterThanOrEqual(0);
      expect(seg.end.azDeg).toBeLessThan(360);
    }
  });

  it("produces deterministic output for the same date", () => {
    const a = buildConstellationSegments(makeState([ORION]), FIXED_DATE);
    const b = buildConstellationSegments(makeState([ORION]), FIXED_DATE);
    expect(a).toEqual(b);
  });
});
