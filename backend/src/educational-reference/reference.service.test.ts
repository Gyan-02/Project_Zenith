/**
 * GYA-12 – Tests for reference.service.ts
 */

import { describe, expect, it } from "vitest";
import { EducationalReferenceService } from "./reference.service.js";
import type { ReferenceObject } from "./reference.types.js";

// ---------------------------------------------------------------------------
// Fixture dataset — small, self-contained, does not depend on disk I/O
// ---------------------------------------------------------------------------

function makeFact(label: string, value: string) {
  return { label, value };
}

const FIXTURES: ReferenceObject[] = [
  {
    objectId: "saturn",
    name: "Saturn",
    kind: "planet",
    oneLine: "The ringed jewel of the Solar System.",
    whyItMatters: "Saturn's rings are the most spectacular structure visible from a backyard telescope.",
    quickFacts: [
      makeFact("Distance from Sun", "9.5 AU"),
      makeFact("Diameter", "116,460 km"),
      makeFact("Rings", "visible in any telescope above 25×"),
    ],
    observationTips: [
      "Use a telescope at 50× to see the rings clearly.",
      "Look for a yellowish steady star — that is Saturn.",
    ],
    kidFriendlySummary: "Saturn is famous for its beautiful rings.",
    sourceNotes: "NASA Cassini mission.",
  },
  {
    objectId: "iss",
    name: "ISS",
    kind: "satellite",
    oneLine: "A habitable laboratory orbiting Earth at ~400 km altitude.",
    whyItMatters: "The ISS is the largest structure ever assembled in space.",
    quickFacts: [
      makeFact("Altitude", "~400 km"),
      makeFact("Speed", "~27,600 km/h"),
    ],
    observationTips: [
      "It is the brightest satellite — up to magnitude −4.",
      "Use Heavens-Above to predict passes.",
    ],
    kidFriendlySummary: "A giant science lab floating in space.",
    sourceNotes: "NASA ISS program.",
  },
  {
    objectId: "sirius",
    name: "Sirius",
    kind: "star",
    oneLine: "The brightest star in the night sky.",
    whyItMatters: "Sirius is the brightest star and is only 8.6 light-years away.",
    quickFacts: [
      makeFact("Distance", "8.6 light-years"),
      makeFact("Apparent magnitude", "−1.46 (brightest night-sky star)"),
    ],
    observationTips: [
      "Follow Orion's Belt southward to find Sirius.",
      "It twinkles dramatically near the horizon.",
    ],
    kidFriendlySummary: "The brightest star in the whole night sky.",
    sourceNotes: "Hipparcos parallax catalogue.",
  },
  {
    objectId: "polaris",
    name: "Polaris",
    kind: "star",
    oneLine: "The North Star — marks true north.",
    whyItMatters: "Polaris has been the navigator's star for millennia.",
    quickFacts: [
      makeFact("Distance", "433 light-years"),
      makeFact("Type", "Cepheid variable"),
    ],
    observationTips: [
      "Find the Big Dipper's pointer stars to locate Polaris.",
    ],
    kidFriendlySummary: "The star that stays still while all others move.",
    sourceNotes: "Gaia DR3.",
  },
  {
    objectId: "orion",
    name: "Orion",
    kind: "constellation",
    oneLine: "The Hunter — one of the most recognisable constellations.",
    whyItMatters: "Home to the Orion Nebula where stars are being born.",
    quickFacts: [
      makeFact("Orion Nebula", "1,344 light-years away"),
      makeFact("Key stars", "Betelgeuse, Rigel, Bellatrix"),
    ],
    observationTips: [
      "Orion's Belt is three evenly spaced stars — easy to find.",
    ],
    kidFriendlySummary: "One of the most famous star patterns in the sky.",
    sourceNotes: "IAU constellation boundaries.",
  },
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("EducationalReferenceService.getReferenceByObjectId", () => {
  const svc = new EducationalReferenceService(FIXTURES);

  it("returns Saturn by id", () => {
    const result = svc.getReferenceByObjectId("saturn");
    expect(result.found).toBe(true);
    if (result.found) {
      expect(result.name).toBe("Saturn");
      expect(result.kind).toBe("planet");
    }
  });

  it("returns ISS by id", () => {
    const result = svc.getReferenceByObjectId("iss");
    expect(result.found).toBe(true);
    if (result.found) {
      expect(result.name).toBe("ISS");
      expect(result.kind).toBe("satellite");
    }
  });

  it("is case-insensitive", () => {
    expect(svc.getReferenceByObjectId("SATURN").found).toBe(true);
    expect(svc.getReferenceByObjectId("Saturn").found).toBe(true);
  });

  it("returns not-found result for unknown objectId", () => {
    const result = svc.getReferenceByObjectId("pluto");
    expect(result.found).toBe(false);
    expect(result.objectId).toBe("pluto");
  });

  it("returns not-found result for empty string", () => {
    const result = svc.getReferenceByObjectId("");
    expect(result.found).toBe(false);
  });
});

describe("EducationalReferenceService.searchReferences", () => {
  const svc = new EducationalReferenceService(FIXTURES);

  it("finds Sirius from 'brightest star' query", () => {
    const results = svc.searchReferences("brightest star");
    const ids = results.map((r: ReferenceObject) => r.objectId);
    expect(ids).toContain("sirius");
  });

  it("ranks the best match first", () => {
    const results = svc.searchReferences("rings telescope Saturn");
    expect(results[0]!.objectId).toBe("saturn");
  });

  it("finds ISS from 'satellite orbit'", () => {
    const results = svc.searchReferences("satellite orbit");
    const ids = results.map((r: ReferenceObject) => r.objectId);
    expect(ids).toContain("iss");
  });

  it("returns empty array for an empty query", () => {
    expect(svc.searchReferences("")).toHaveLength(0);
    expect(svc.searchReferences("   ")).toHaveLength(0);
  });

  it("returns empty array when no object matches the query", () => {
    const results = svc.searchReferences("xyzzy quux frobozz");
    expect(results).toHaveLength(0);
  });

  it("respects the limit parameter", () => {
    const results = svc.searchReferences("star", 2);
    expect(results.length).toBeLessThanOrEqual(2);
  });

  it("finds Polaris from 'north navigator'", () => {
    const results = svc.searchReferences("north navigator");
    const ids = results.map((r: ReferenceObject) => r.objectId);
    expect(ids).toContain("polaris");
  });
});

describe("EducationalReferenceService.listReferences", () => {
  const svc = new EducationalReferenceService(FIXTURES);

  it("returns all objects when no filter is applied", () => {
    expect(svc.listReferences()).toHaveLength(FIXTURES.length);
  });

  it("filters by kind=star", () => {
    const stars = svc.listReferences({ kind: "star" });
    expect(stars.length).toBe(2); // sirius + polaris
    expect(stars.every((o: ReferenceObject) => o.kind === "star")).toBe(true);
  });

  it("filters by kind=satellite", () => {
    const sats = svc.listReferences({ kind: "satellite" });
    expect(sats.length).toBe(1);
    expect(sats[0]!.objectId).toBe("iss");
  });

  it("returns empty array for a kind with no matching objects", () => {
    const result = svc.listReferences({ kind: "moon" });
    expect(result).toHaveLength(0);
  });
});
