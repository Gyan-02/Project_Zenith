/**
 * GYA-23 – Tests for eventPrediction.service.ts
 */

import { describe, expect, it } from "vitest";
import {
  predictCelestialEvents,
  CelestialEventQueryError,
} from "./eventPrediction.service.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function query(startUtc: string, endUtc: string, extra?: object) {
  return {
    location: { lat: 51.5, lon: -0.1 },
    startUtc,
    endUtc,
    ...extra,
  };
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

describe("predictCelestialEvents – validation", () => {
  it("throws CelestialEventQueryError for an invalid startUtc", () => {
    expect(() =>
      predictCelestialEvents(query("not-a-date", "2026-09-01T00:00:00Z")),
    ).toThrow(CelestialEventQueryError);
  });

  it("throws CelestialEventQueryError for an invalid endUtc", () => {
    expect(() =>
      predictCelestialEvents(query("2026-01-01T00:00:00Z", "INVALID")),
    ).toThrow(CelestialEventQueryError);
  });

  it("throws CelestialEventQueryError when startUtc is after endUtc", () => {
    expect(() =>
      predictCelestialEvents(
        query("2026-12-31T00:00:00Z", "2026-01-01T00:00:00Z"),
      ),
    ).toThrow(CelestialEventQueryError);
  });

  it("does not throw for equal startUtc and endUtc (zero-length window)", () => {
    expect(() =>
      predictCelestialEvents(query("2026-08-12T00:00:00Z", "2026-08-12T00:00:00Z")),
    ).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Meteor shower presence
// ---------------------------------------------------------------------------

describe("predictCelestialEvents – meteor showers", () => {
  it("returns Perseids for an August 2026 window", () => {
    const events = predictCelestialEvents(
      query("2026-08-01T00:00:00Z", "2026-08-31T23:59:59Z"),
    );
    const ids = events.map((e) => e.id);
    expect(ids).toContain("perseids-2026");
  });

  it("returns Perseids for an August 2030 window (no hardcoded year)", () => {
    const events = predictCelestialEvents(
      query("2030-08-01T00:00:00Z", "2030-08-31T23:59:59Z"),
    );
    const ids = events.map((e) => e.id);
    expect(ids).toContain("perseids-2030");
  });

  it("returns Geminids for a December window", () => {
    const events = predictCelestialEvents(
      query("2026-12-01T00:00:00Z", "2026-12-31T23:59:59Z"),
    );
    const ids = events.map((e) => e.id);
    expect(ids).toContain("geminids-2026");
  });

  it("returns Geminids correctly across the correct annual window", () => {
    // Geminids peak Dec 14, window Dec 10–Dec 17
    const events = predictCelestialEvents(
      query("2026-12-10T00:00:00Z", "2026-12-17T23:59:59Z"),
    );
    const gem = events.find((e) => e.id === "geminids-2026");
    expect(gem).toBeDefined();
    expect(gem?.type).toBe("meteor_shower");
    expect(gem?.peakUtc).toContain("2026-12-14");
  });

  it("does NOT return a shower that falls entirely outside the window", () => {
    // Query window is in March — Perseids (August) should not appear
    const events = predictCelestialEvents(
      query("2026-03-01T00:00:00Z", "2026-03-31T23:59:59Z"),
    );
    const ids = events.map((e) => e.id);
    expect(ids).not.toContain("perseids-2026");
  });

  it("handles a multi-year window, returning showers for both years", () => {
    const events = predictCelestialEvents(
      query("2026-08-01T00:00:00Z", "2027-08-31T23:59:59Z"),
    );
    const ids = events.map((e) => e.id);
    expect(ids).toContain("perseids-2026");
    expect(ids).toContain("perseids-2027");
  });

  it("all returned meteor_shower events have required fields", () => {
    const events = predictCelestialEvents(
      query("2026-08-01T00:00:00Z", "2026-08-31T23:59:59Z"),
    );
    for (const evt of events.filter((e) => e.type === "meteor_shower")) {
      expect(evt.id).toBeTruthy();
      expect(evt.name).toBeTruthy();
      expect(evt.startUtc).toBeTruthy();
      expect(evt.endUtc).toBeTruthy();
      expect(evt.peakUtc).toBeTruthy();
      expect(evt.confidence).toMatch(/^(high|medium|low)$/);
    }
  });
});

// ---------------------------------------------------------------------------
// Sorting
// ---------------------------------------------------------------------------

describe("predictCelestialEvents – sorting", () => {
  it("returns events sorted by startUtc ascending over a full year", () => {
    const events = predictCelestialEvents(
      query("2026-01-01T00:00:00Z", "2026-12-31T23:59:59Z"),
    );
    for (let i = 1; i < events.length; i++) {
      expect(events[i]!.startUtc >= events[i - 1]!.startUtc).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// Type filtering
// ---------------------------------------------------------------------------

describe("predictCelestialEvents – type filtering", () => {
  it("filters to meteor_shower only", () => {
    const events = predictCelestialEvents(
      query("2026-01-01T00:00:00Z", "2026-12-31T23:59:59Z", {
        types: ["meteor_shower"],
      }),
    );
    expect(events.length).toBeGreaterThan(0);
    expect(events.every((e) => e.type === "meteor_shower")).toBe(true);
  });

  it("filters to eclipse only", () => {
    // Use a wide window that covers catalog eclipse entries
    const events = predictCelestialEvents(
      query("2025-01-01T00:00:00Z", "2027-12-31T23:59:59Z", {
        types: ["eclipse"],
      }),
    );
    expect(events.length).toBeGreaterThan(0);
    expect(events.every((e) => e.type === "eclipse")).toBe(true);
  });

  it("returns empty array when type filter matches nothing in the window", () => {
    // Tiny window with no events
    const events = predictCelestialEvents(
      query("2050-06-01T00:00:00Z", "2050-06-02T00:00:00Z", {
        types: ["eclipse"],
      }),
    );
    expect(events).toHaveLength(0);
  });

  it("returns all types when types filter is omitted", () => {
    const events = predictCelestialEvents(
      query("2025-01-01T00:00:00Z", "2026-12-31T23:59:59Z"),
    );
    const types = new Set(events.map((e) => e.type));
    expect(types.size).toBeGreaterThan(1);
  });

  it("returns all types when types filter is empty array", () => {
    const all = predictCelestialEvents(
      query("2025-01-01T00:00:00Z", "2026-12-31T23:59:59Z"),
    );
    const filtered = predictCelestialEvents(
      query("2025-01-01T00:00:00Z", "2026-12-31T23:59:59Z", { types: [] }),
    );
    // Empty array = no filter applied = same as omitting types
    expect(filtered.length).toBe(all.length);
  });
});

// ---------------------------------------------------------------------------
// Catalog events
// ---------------------------------------------------------------------------

describe("predictCelestialEvents – static catalog events", () => {
  it("includes the August 2026 solar eclipse in a wide 2026 window", () => {
    const events = predictCelestialEvents(
      query("2026-01-01T00:00:00Z", "2026-12-31T23:59:59Z"),
    );
    const eclipse = events.find((e) => e.id === "solar-eclipse-2026-08-12");
    expect(eclipse).toBeDefined();
    expect(eclipse?.type).toBe("eclipse");
    expect(eclipse?.confidence).toBe("high");
    expect(eclipse?.visibility.rating).toBe("Unknown");
  });

  it("includes Saturn opposition 2025 in a wide 2025 window", () => {
    const events = predictCelestialEvents(
      query("2025-01-01T00:00:00Z", "2025-12-31T23:59:59Z"),
    );
    const opp = events.find((e) => e.id === "saturn-opposition-2025-09-21");
    expect(opp).toBeDefined();
    expect(opp?.type).toBe("visibility_window");
    expect(opp?.navigationTarget?.kind).toBe("planet");
  });
});
