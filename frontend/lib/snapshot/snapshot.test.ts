/**
 * GYA-33 – Tests for the snapshot export foundation.
 */

import { describe, expect, it } from "vitest";
import {
  createSkySnapshotMetadata,
  buildSnapshotFileName,
  serializeSnapshotMetadata,
} from "./snapshot.js";
import type { CreateSnapshotInput } from "./snapshot.js";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const FIXED_NOW = "2026-08-12T20:30:00.000Z";

const BASE_INPUT: CreateSnapshotInput = {
  location: { lat: 25.61, lon: 85.14, label: "Patna, India" },
  timeUtc: "2026-08-12T20:30:00.000Z",
  visibleLayers: ["planets", "moon", "constellations"],
  nowOverride: FIXED_NOW,
};

// ---------------------------------------------------------------------------
// createSkySnapshotMetadata
// ---------------------------------------------------------------------------

describe("createSkySnapshotMetadata", () => {
  it("always sets project to 'Project Zenith'", () => {
    const m = createSkySnapshotMetadata(BASE_INPUT);
    expect(m.project).toBe("Project Zenith");
  });

  it("copies location and timeUtc", () => {
    const m = createSkySnapshotMetadata(BASE_INPUT);
    expect(m.location.lat).toBe(25.61);
    expect(m.location.lon).toBe(85.14);
    expect(m.timeUtc).toBe("2026-08-12T20:30:00.000Z");
  });

  it("uses nowOverride for generatedAt (deterministic)", () => {
    const m = createSkySnapshotMetadata(BASE_INPUT);
    expect(m.generatedAt).toBe(FIXED_NOW);
  });

  it("generatedAt is a valid ISO string when no override is provided", () => {
    const m = createSkySnapshotMetadata({ ...BASE_INPUT, nowOverride: undefined });
    expect(() => new Date(m.generatedAt).toISOString()).not.toThrow();
  });

  it("omits selectedObject when not provided", () => {
    const m = createSkySnapshotMetadata(BASE_INPUT);
    expect(m.selectedObject).toBeUndefined();
  });

  it("includes selectedObject when provided", () => {
    const m = createSkySnapshotMetadata({
      ...BASE_INPUT,
      selectedObject: { id: "saturn", name: "Saturn" },
    });
    expect(m.selectedObject?.id).toBe("saturn");
    expect(m.selectedObject?.name).toBe("Saturn");
  });

  it("defaults visibleLayers to empty array", () => {
    const m = createSkySnapshotMetadata({ ...BASE_INPUT, visibleLayers: undefined });
    expect(m.visibleLayers).toEqual([]);
  });

  it("omits shareUrl when not provided", () => {
    const m = createSkySnapshotMetadata(BASE_INPUT);
    expect(m.shareUrl).toBeUndefined();
  });

  it("includes shareUrl when provided", () => {
    const m = createSkySnapshotMetadata({ ...BASE_INPUT, shareUrl: "https://zenith.app/s/abc123" });
    expect(m.shareUrl).toBe("https://zenith.app/s/abc123");
  });
});

// ---------------------------------------------------------------------------
// buildSnapshotFileName
// ---------------------------------------------------------------------------

describe("buildSnapshotFileName", () => {
  it("produces a stable slug from label + timeUtc", () => {
    const m = createSkySnapshotMetadata(BASE_INPUT);
    const fileName = buildSnapshotFileName(m);
    expect(fileName).toMatch(/^zenith-patna-india-/);
    expect(fileName).toMatch(/\.json$/);
  });

  it("includes selectedObject id in filename slug", () => {
    const m = createSkySnapshotMetadata({
      ...BASE_INPUT,
      selectedObject: { id: "saturn", name: "Saturn" },
    });
    const fileName = buildSnapshotFileName(m);
    expect(fileName).toContain("saturn");
  });

  it("omits object slug when no selectedObject", () => {
    const m = createSkySnapshotMetadata(BASE_INPUT);
    const fileName = buildSnapshotFileName(m);
    // Should be zenith-patna-india-<date>.json, no extra dash-segment after date
    expect(fileName.split(".json")[0]).not.toMatch(/-[a-z]+-[a-z]+$/);
  });

  it("uses lat/lon slug when label is absent", () => {
    const m = createSkySnapshotMetadata({
      ...BASE_INPUT,
      location: { lat: 25.61, lon: 85.14 },
    });
    const fileName = buildSnapshotFileName(m);
    expect(fileName).toMatch(/zenith-25/);
  });

  it("respects the extension parameter", () => {
    const m = createSkySnapshotMetadata(BASE_INPUT);
    expect(buildSnapshotFileName(m, "png")).toMatch(/\.png$/);
  });

  it("produces no consecutive hyphens in the slug", () => {
    const m = createSkySnapshotMetadata(BASE_INPUT);
    expect(buildSnapshotFileName(m)).not.toMatch(/--/);
  });
});

// ---------------------------------------------------------------------------
// serializeSnapshotMetadata
// ---------------------------------------------------------------------------

describe("serializeSnapshotMetadata", () => {
  it("returns valid JSON", () => {
    const m = createSkySnapshotMetadata(BASE_INPUT);
    expect(() => JSON.parse(serializeSnapshotMetadata(m))).not.toThrow();
  });

  it("round-trips the metadata correctly", () => {
    const m = createSkySnapshotMetadata({
      ...BASE_INPUT,
      selectedObject: { id: "saturn", name: "Saturn" },
      shareUrl: "https://zenith.app/s/xyz",
    });
    const parsed = JSON.parse(serializeSnapshotMetadata(m)) as typeof m;
    expect(parsed.project).toBe("Project Zenith");
    expect(parsed.selectedObject?.id).toBe("saturn");
    expect(parsed.shareUrl).toBe("https://zenith.app/s/xyz");
    expect(parsed.visibleLayers).toEqual(["planets", "moon", "constellations"]);
  });
});
