/**
 * GYA-45 — Tests for demoNarrator.ts
 */

import { describe, expect, it } from "vitest";
import { demoNarrate } from "./demoNarrator.js";
import { NarrationResponseSchema } from "../contracts.js";
import type { NarrateInput } from "./narrate.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const VALID_KINDS = new Set([
  "planet",
  "satellite",
  "star",
  "constellation",
  "moon",
  "iss",
]);

function makeInput(query: string, targetName?: string): NarrateInput {
  return {
    query,
    intent: {
      intent: "object_search",
      confidence: 0.9,
      targetName: targetName ?? null,
      delegated: false,
    },
    skyState: {
      location: { lat: 0, lon: 0 },
      timestampUtc: "2026-06-25T00:00:00.000Z",
      planets: [],
      satellites: [],
      iss: null,
      moon: { id: "moon", kind: "moon", name: "Moon", position: { ra: 0, dec: 0 } },
      constellations: [],
      meteorShowers: [],
      provenance: [],
    },
  };
}

// ---------------------------------------------------------------------------
// Schema compliance
// ---------------------------------------------------------------------------

describe("demoNarrate – schema compliance", () => {
  const INPUTS = [
    makeInput("Show me Saturn", "Saturn"),
    makeInput("What is the Moon?", "Moon"),
    makeInput("Where is the ISS?", "ISS"),
    makeInput("What is visible tonight?"),
    makeInput("Hello world"),
  ];

  for (const input of INPUTS) {
    it(`returns schema-valid response for query "${input.query}"`, () => {
      const result = demoNarrate(input);
      expect(() => NarrationResponseSchema.parse(result)).not.toThrow();
    });
  }
});

// ---------------------------------------------------------------------------
// Trigger matching
// ---------------------------------------------------------------------------

describe("demoNarrate – trigger matching", () => {
  it("matches Saturn by query", () => {
    const result = demoNarrate(makeInput("Show me Saturn"));
    expect(result.text.toLowerCase()).toContain("saturn");
  });

  it("matches Saturn by targetName", () => {
    const result = demoNarrate(makeInput("Tell me more", "Saturn"));
    expect(result.text.toLowerCase()).toContain("saturn");
  });

  it("matches Moon by query", () => {
    const result = demoNarrate(makeInput("What is the Moon?"));
    expect(result.text.toLowerCase()).toContain("moon");
  });

  it("matches ISS by query", () => {
    const result = demoNarrate(makeInput("Where is the ISS?"));
    expect(result.text.toLowerCase()).toContain("space station");
  });

  it("matches 'international space station'", () => {
    const result = demoNarrate(makeInput("Tell me about the international space station"));
    expect(result.navigationTarget?.id).toBe("iss");
  });

  it("matches tonight query", () => {
    const result = demoNarrate(makeInput("What is visible tonight?"));
    expect(result.text.toLowerCase()).toContain("tonight");
  });

  it("falls back gracefully for unmatched query", () => {
    const result = demoNarrate(makeInput("xyzzy quux frobozz"));
    expect(result.text.length).toBeGreaterThan(20);
    expect(() => NarrationResponseSchema.parse(result)).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Navigation targets are valid kinds
// ---------------------------------------------------------------------------

describe("demoNarrate – navigation targets", () => {
  const QUERIES = [
    makeInput("Show Saturn", "Saturn"),
    makeInput("Show Moon", "Moon"),
    makeInput("Show ISS", "ISS"),
  ];

  for (const input of QUERIES) {
    it(`navigation target for "${input.query}" uses a valid kind`, () => {
      const result = demoNarrate(input);
      if (result.navigationTarget) {
        expect(VALID_KINDS.has(result.navigationTarget.kind)).toBe(true);
        expect(result.navigationTarget.id.length).toBeGreaterThan(0);
      }
    });
  }
});
