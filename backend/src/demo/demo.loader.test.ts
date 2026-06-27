/**
 * GYA-31 – Tests for the demo data loaders.
 */

import { describe, expect, it } from "vitest";
import {
  loadDemoSkyState,
  loadDemoConditions,
  loadDemoEvents,
  loadDemoPasses,
} from "./demo.loader.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isIso(s: unknown): boolean {
  if (typeof s !== "string") return false;
  return !isNaN(Date.parse(s));
}

// ---------------------------------------------------------------------------
// loadDemoSkyState
// ---------------------------------------------------------------------------

describe("loadDemoSkyState", () => {
  it("loads without throwing", () => {
    expect(() => loadDemoSkyState()).not.toThrow();
  });

  it("returns a non-empty sky state", () => {
    const state = loadDemoSkyState();
    expect(state.planets.length).toBeGreaterThan(0);
    expect(state.satellites.length).toBeGreaterThan(0);
    expect(state.constellations.length).toBeGreaterThan(0);
  });

  it("has a valid ISO timestampUtc", () => {
    const { timestampUtc } = loadDemoSkyState();
    expect(isIso(timestampUtc)).toBe(true);
  });

  it("has stable object ids", () => {
    const ids = loadDemoSkyState().planets.map((p) => p.id);
    expect(ids).toContain("saturn");
    expect(ids).toContain("jupiter");
    expect(ids).not.toContain("sirius");
  });

  it("exposes bright stars as first-class sky objects", () => {
    const stars = loadDemoSkyState().stars ?? [];
    const ids = stars.map((star) => star.id);
    expect(ids).toContain("sirius");
    expect(stars.every((star) => star.kind === "star")).toBe(true);
  });

  it("moon has required fields", () => {
    const { moon } = loadDemoSkyState();
    expect(moon.id).toBe("moon");
    expect(moon.kind).toBe("moon");
    expect(typeof moon.position.ra).toBe("number");
  });

  it("constellations each have at least 2 points", () => {
    const { constellations } = loadDemoSkyState();
    for (const c of constellations) {
      expect(c.points.length).toBeGreaterThanOrEqual(2);
    }
  });
});

// ---------------------------------------------------------------------------
// loadDemoConditions
// ---------------------------------------------------------------------------

describe("loadDemoConditions", () => {
  it("loads without throwing", () => {
    expect(() => loadDemoConditions()).not.toThrow();
  });

  it("has a valid ISO observedAt", () => {
    expect(isIso(loadDemoConditions().observedAt)).toBe(true);
  });

  it("has a non-null quality", () => {
    const { quality } = loadDemoConditions();
    expect(["Excellent", "Good", "Poor", "Unknown"]).toContain(quality);
  });

  it("has numeric cloud cover", () => {
    const { cloudCoverPct } = loadDemoConditions();
    expect(typeof cloudCoverPct).toBe("number");
  });
});

// ---------------------------------------------------------------------------
// loadDemoEvents
// ---------------------------------------------------------------------------

describe("loadDemoEvents", () => {
  it("loads without throwing", () => {
    expect(() => loadDemoEvents()).not.toThrow();
  });

  it("returns a non-empty array", () => {
    expect(loadDemoEvents().length).toBeGreaterThan(0);
  });

  it("all events have valid ISO startUtc", () => {
    for (const e of loadDemoEvents()) {
      expect(isIso(e.startUtc)).toBe(true);
    }
  });

  it("includes perseids-2026 with a stable id", () => {
    const ids = loadDemoEvents().map((e) => e.id);
    expect(ids).toContain("perseids-2026");
  });
});

// ---------------------------------------------------------------------------
// loadDemoPasses
// ---------------------------------------------------------------------------

describe("loadDemoPasses", () => {
  it("loads without throwing", () => {
    expect(() => loadDemoPasses()).not.toThrow();
  });

  it("returns a non-empty passes array", () => {
    expect(loadDemoPasses().passes.length).toBeGreaterThan(0);
  });

  it("all passes have valid ISO riseTimeUtc", () => {
    for (const p of loadDemoPasses().passes) {
      expect(isIso(p.riseTimeUtc)).toBe(true);
    }
  });

  it("includes an ISS pass", () => {
    const names = loadDemoPasses().passes.map((p) => p.name ?? "");
    expect(names.some((n) => n.includes("ISS"))).toBe(true);
  });

  it("provenance is non-empty", () => {
    expect(loadDemoPasses().provenance.length).toBeGreaterThan(0);
  });
});
