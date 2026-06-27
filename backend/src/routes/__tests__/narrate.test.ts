import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { createApp } from "../../app.js";
import { NarrationResponseSchema, type SkyState } from "../../contracts.js";
import { GeminiUpstreamError, KnowledgeBaseError } from "../../errors.js";
import type { NarrationDependencies } from "../narrate.js";

const skyState: SkyState = {
  location: { lat: 13.08, lon: 80.27, label: "Chennai" },
  timestampUtc: "2026-06-24T12:00:00.000Z",
  planets: [
    {
      id: "saturn",
      kind: "planet",
      name: "Saturn",
      position: { ra: 2, dec: 12, altDeg: 31, azDeg: 120, distanceKm: 1_300_000_000 },
      metadata: { visible: true, source: "test ephemeris" },
    },
  ],
  satellites: [],
  iss: null,
  moon: {
    id: "moon",
    kind: "moon",
    name: "Moon",
    position: { ra: 10, dec: -2 },
  },
  constellations: [],
  meteorShowers: [],
  provenance: [{ source: "test ephemeris", fetchedAt: "2026-06-24T12:00:00.000Z" }],
};

function dependencies(): NarrationDependencies {
  return {
    getSkyState: vi.fn().mockResolvedValue(skyState),
    parseIntent: vi.fn().mockResolvedValue({
      intent: "object_search",
      confidence: 0.99,
      targetName: "Saturn",
      delegated: false,
    }),
    narrate: vi.fn().mockResolvedValue({
      text: "Saturn is visible in the supplied sky-state.",
      navigationTarget: { kind: "planet", id: "saturn", label: "Saturn" },
      citations: [{ title: "Saturn overview", source: "NASA" }],
    }),
  };
}

const validBody = {
  query: "Show Saturn",
  location: { lat: 13.08, lon: 80.27, label: "Chennai" },
  timeIso: "2026-06-24T12:00:00.000Z",
};

describe("POST /api/narrate", () => {
  it("returns a contract-valid NarrationResponse", async () => {
    const deps = dependencies();
    const response = await request(createApp(deps)).post("/api/narrate").send(validBody).expect(200);
    expect(() => NarrationResponseSchema.parse(response.body)).not.toThrow();
    expect(deps.getSkyState).toHaveBeenCalledOnce();
    expect(deps.parseIntent).toHaveBeenCalledWith("Show Saturn", {});
    expect(deps.narrate).toHaveBeenCalledOnce();
  });

  it("returns 400 with a descriptive error when query is missing", async () => {
    const { query: _query, ...invalidBody } = validBody;
    const response = await request(createApp(dependencies())).post("/api/narrate").send(invalidBody).expect(400);
    expect(response.body.error).toBe("Invalid narration request");
    expect(response.body.issues).toEqual(expect.arrayContaining([expect.objectContaining({ path: "query" })]));
  });

  it("maps Gemini failures to 502", async () => {
    const deps = dependencies();
    deps.narrate = vi.fn().mockRejectedValue(new GeminiUpstreamError("provider down"));
    await request(createApp(deps)).post("/api/narrate").send(validBody).expect(502);
  });

  it("maps knowledge-base failures to 503", async () => {
    const deps = dependencies();
    deps.narrate = vi.fn().mockRejectedValue(new KnowledgeBaseError("chroma down"));
    await request(createApp(deps)).post("/api/narrate").send(validBody).expect(503);
  });
});
