/**
 * GYA-18 – Tests for shareUrl.ts
 */

import { describe, expect, it } from "vitest";
import { encodeShareState, decodeShareState, buildShareUrl } from "./shareUrl.js";
import type { ShareSkyState } from "./shareState.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function roundTrip(state: ShareSkyState): ShareSkyState {
  return decodeShareState(encodeShareState(state));
}

// ---------------------------------------------------------------------------
// encodeShareState
// ---------------------------------------------------------------------------

describe("encodeShareState", () => {
  it("returns an empty string for an empty state", () => {
    expect(encodeShareState({})).toBe("");
  });

  it("includes lat/lon when location is set", () => {
    const qs = encodeShareState({ location: { lat: 51.5, lon: -0.1 } });
    const p = new URLSearchParams(qs);
    expect(p.get("lat")).toBe("51.5");
    expect(p.get("lon")).toBe("-0.1");
  });

  it("rounds coordinates to 5 decimal places", () => {
    const qs = encodeShareState({ location: { lat: 48.123456789, lon: 2.987654321 } });
    const p = new URLSearchParams(qs);
    expect(p.get("lat")).toBe("48.12346");
    expect(p.get("lon")).toBe("2.98765");
  });

  it("encodes label when present", () => {
    const qs = encodeShareState({ location: { lat: 0, lon: 0, label: "London" } });
    expect(new URLSearchParams(qs).get("label")).toBe("London");
  });

  it("omits location when not set", () => {
    const qs = encodeShareState({ selectedObjectId: "saturn" });
    const p = new URLSearchParams(qs);
    expect(p.get("lat")).toBeNull();
    expect(p.get("lon")).toBeNull();
  });

  it("encodes timeUtc under key 't'", () => {
    const t = "2026-01-01T00:00:00Z";
    const qs = encodeShareState({ timeUtc: t });
    expect(new URLSearchParams(qs).get("t")).toBe(t);
  });

  it("encodes selectedObjectId under key 'obj'", () => {
    const qs = encodeShareState({ selectedObjectId: "jupiter" });
    expect(new URLSearchParams(qs).get("obj")).toBe("jupiter");
  });

  it("encodes layers as comma-separated enabled keys", () => {
    const qs = encodeShareState({ layers: { planets: true, iss: true } });
    const raw = new URLSearchParams(qs).get("layers");
    expect(raw).toBeTruthy();
    const parts = (raw ?? "").split(",").sort();
    expect(parts).toEqual(["iss", "planets"]);
  });

  it("omits layers param when all layers are false/undefined", () => {
    const qs = encodeShareState({ layers: { planets: false } });
    expect(new URLSearchParams(qs).get("layers")).toBeNull();
  });

  it("omits layers param when layers object is empty", () => {
    const qs = encodeShareState({ layers: {} });
    expect(new URLSearchParams(qs).get("layers")).toBeNull();
  });

  it("encodes culturalTraditionId under 'tradition'", () => {
    const qs = encodeShareState({ culturalTraditionId: "maori" });
    expect(new URLSearchParams(qs).get("tradition")).toBe("maori");
  });

  it("encodes narratorQuery under 'q'", () => {
    const qs = encodeShareState({ narratorQuery: "What is Sirius?" });
    expect(new URLSearchParams(qs).get("q")).toBe("What is Sirius?");
  });
});

// ---------------------------------------------------------------------------
// decodeShareState
// ---------------------------------------------------------------------------

describe("decodeShareState", () => {
  it("returns empty object for empty string", () => {
    expect(decodeShareState("")).toEqual({});
  });

  it("returns empty object for unknown-only params", () => {
    expect(decodeShareState("?unknown=1&foo=bar")).toEqual({});
  });

  it("accepts a leading '?' in the string", () => {
    const result = decodeShareState("?obj=saturn");
    expect(result.selectedObjectId).toBe("saturn");
  });

  it("accepts a URLSearchParams directly", () => {
    const result = decodeShareState(new URLSearchParams("obj=saturn"));
    expect(result.selectedObjectId).toBe("saturn");
  });

  it("ignores unknown params", () => {
    const result = decodeShareState("unknown=1&obj=mars&foo=bar");
    expect(result.selectedObjectId).toBe("mars");
    expect(Object.keys(result)).toEqual(["selectedObjectId"]);
  });

  it("sanitises out-of-range lat values", () => {
    const result = decodeShareState("lat=999&lon=0");
    expect(result.location).toBeUndefined();
  });

  it("sanitises out-of-range lon values", () => {
    const result = decodeShareState("lat=51&lon=999");
    expect(result.location).toBeUndefined();
  });

  it("sanitises non-numeric lat/lon", () => {
    const result = decodeShareState("lat=abc&lon=xyz");
    expect(result.location).toBeUndefined();
  });

  it("ignores label when lat/lon are missing", () => {
    const result = decodeShareState("label=London");
    expect(result.location).toBeUndefined();
  });

  it("decodes layers correctly", () => {
    const result = decodeShareState("layers=planets%2Ciss");
    expect(result.layers?.planets).toBe(true);
    expect(result.layers?.iss).toBe(true);
    expect(result.layers?.satellites).toBeUndefined();
  });

  it("ignores unknown layer keys in the layers param", () => {
    // "ufo" is not a known layer key
    const result = decodeShareState("layers=planets%2Cufo");
    expect(result.layers?.planets).toBe(true);
    expect((result.layers as Record<string, unknown>)?.ufo).toBeUndefined();
  });

  it("returns undefined layers when layers param is empty string", () => {
    const result = decodeShareState("layers=");
    expect(result.layers).toBeUndefined();
  });

  it("does not throw for completely malformed input", () => {
    // Passing bizarre strings should never throw
    expect(() => decodeShareState("%%%invalid%%%")).not.toThrow();
    expect(() => decodeShareState("=&=&=")).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Round-trip: encode → decode
// ---------------------------------------------------------------------------

describe("encodeShareState / decodeShareState round-trip", () => {
  it("round-trips location", () => {
    const state: ShareSkyState = { location: { lat: 48.85, lon: 2.35, label: "Paris" } };
    const rt = roundTrip(state);
    expect(rt.location?.lat).toBe(48.85);
    expect(rt.location?.lon).toBe(2.35);
    expect(rt.location?.label).toBe("Paris");
  });

  it("round-trips all fields together", () => {
    const state: ShareSkyState = {
      location: { lat: 40.7128, lon: -74.006, label: "New York" },
      timeUtc: "2026-06-01T21:00:00Z",
      selectedObjectId: "saturn",
      layers: { planets: true, iss: true, constellations: true },
      culturalTraditionId: "maori",
      narratorQuery: "Tell me about Saturn's rings",
    };
    const rt = roundTrip(state);
    expect(rt.location?.lat).toBe(40.7128);
    expect(rt.location?.lon).toBe(-74.006);
    expect(rt.location?.label).toBe("New York");
    expect(rt.timeUtc).toBe("2026-06-01T21:00:00Z");
    expect(rt.selectedObjectId).toBe("saturn");
    expect(rt.layers?.planets).toBe(true);
    expect(rt.layers?.iss).toBe(true);
    expect(rt.layers?.constellations).toBe(true);
    expect(rt.culturalTraditionId).toBe("maori");
    expect(rt.narratorQuery).toBe("Tell me about Saturn's rings");
  });

  it("round-trips unicode label", () => {
    const state: ShareSkyState = { location: { lat: 35.68, lon: 139.69, label: "東京 Tokyo" } };
    const rt = roundTrip(state);
    expect(rt.location?.label).toBe("東京 Tokyo");
  });

  it("round-trips unicode narrator query", () => {
    const state: ShareSkyState = { narratorQuery: "¿Qué es Sirio? 🌟" };
    const rt = roundTrip(state);
    expect(rt.narratorQuery).toBe("¿Qué es Sirio? 🌟");
  });

  it("empty state produces an empty query string", () => {
    expect(encodeShareState({})).toBe("");
  });

  it("layer encoding is stable (order-independent)", () => {
    const a = encodeShareState({ layers: { planets: true, iss: true } });
    const b = encodeShareState({ layers: { iss: true, planets: true } });
    // Both should decode to the same state
    const da = decodeShareState(a);
    const db = decodeShareState(b);
    expect(da.layers?.planets).toBe(true);
    expect(da.layers?.iss).toBe(true);
    expect(db.layers?.planets).toBe(true);
    expect(db.layers?.iss).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// buildShareUrl
// ---------------------------------------------------------------------------

describe("buildShareUrl", () => {
  it("appends query string with '?'", () => {
    const url = buildShareUrl("https://zenith.app", { selectedObjectId: "mars" });
    expect(url.startsWith("https://zenith.app?")).toBe(true);
    expect(url).toContain("obj=mars");
  });

  it("returns base URL unchanged for an empty state", () => {
    const url = buildShareUrl("https://zenith.app", {});
    expect(url).toBe("https://zenith.app");
  });

  it("appends with '&' when base URL already has query params", () => {
    const url = buildShareUrl("https://zenith.app?demo=1", { selectedObjectId: "jupiter" });
    expect(url).toContain("?demo=1&");
    expect(url).toContain("obj=jupiter");
  });

  it("produces a valid URL", () => {
    const url = buildShareUrl("https://zenith.app", {
      location: { lat: 51.5, lon: -0.1 },
      selectedObjectId: "sirius",
    });
    expect(() => new URL(url)).not.toThrow();
  });
});
