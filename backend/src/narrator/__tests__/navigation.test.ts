import { describe, expect, it } from "vitest";
import type { SkyState } from "../../contracts.js";
import { resolveNavigationTarget } from "../navigation.js";

const state: SkyState = {
  location: { lat: 25.61, lon: 85.14 },
  timestampUtc: "2026-06-24T12:00:00.000Z",
  planets: [
    {
      id: "saturn",
      kind: "planet",
      name: "Saturn",
      position: { ra: 2, dec: 12, altDeg: 20, azDeg: 110 },
      metadata: { visible: true, source: "test" },
    },
  ],
  satellites: [],
  iss: null,
  moon: { id: "moon", kind: "moon", name: "Moon", position: { ra: 10, dec: 1 } },
  constellations: [],
  meteorShowers: [],
  provenance: [],
};

describe("resolveNavigationTarget", () => {
  it("resolves a narrator target to the scientific scene object", () => {
    expect(
      resolveNavigationTarget(
        { intent: "object_search", confidence: 0.98, targetName: "Saturn", delegated: false },
        state,
      ),
    ).toEqual({ kind: "planet", id: "saturn", label: "Saturn" });
  });
});
