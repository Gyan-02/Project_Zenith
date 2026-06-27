/**
 * GYA-14 – Tests for crossing-refinement.ts
 */

import { describe, it, expect, vi } from "vitest";
import { bisectCrossing, findPeakElevation, type ElevationFn } from "../crossing-refinement.js";

// ---------------------------------------------------------------------------
// bisectCrossing
// ---------------------------------------------------------------------------

describe("bisectCrossing", () => {
  it("finds a rising crossing at the correct epoch within tolerance", () => {
    // Elevation rises linearly from -5° at t=0 to +15° at t=20000ms
    // Threshold = 10°; crossing at t=15000ms
    const elevFn: ElevationFn = (ms) => -5 + 20 * (ms / 20_000);
    const crossing = bisectCrossing(elevFn, 0, 20_000, 10, 2_000);
    expect(crossing).toBeGreaterThanOrEqual(15_000 - 2_000);
    expect(crossing).toBeLessThanOrEqual(15_000 + 2_000);
  });

  it("finds a falling crossing at the correct epoch within tolerance", () => {
    // Elevation falls linearly from +15° at t=0 to -5° at t=20000ms
    // Threshold = 10°; crossing at t=5000ms
    const elevFn: ElevationFn = (ms) => 15 - 20 * (ms / 20_000);
    const crossing = bisectCrossing(elevFn, 0, 20_000, 10, 2_000);
    expect(crossing).toBeGreaterThanOrEqual(5_000 - 2_000);
    expect(crossing).toBeLessThanOrEqual(5_000 + 2_000);
  });

  it("terminates within tolerance even for a very fine tolerance", () => {
    const elevFn: ElevationFn = (ms) => ms - 10_000; // crossing at 10000ms
    const crossing = bisectCrossing(elevFn, 0, 20_000, 0, 100);
    expect(Math.abs(crossing - 10_000)).toBeLessThanOrEqual(100);
  });

  it("converges when both endpoints are already within the tolerance", () => {
    const elevFn: ElevationFn = (ms) => ms;
    // lo and hi are already 500ms apart — result should be inside [lo, hi]
    const crossing = bisectCrossing(elevFn, 500, 1_000, 750, 2_000);
    expect(crossing).toBeGreaterThanOrEqual(500);
    expect(crossing).toBeLessThanOrEqual(1_000);
  });
});

// ---------------------------------------------------------------------------
// findPeakElevation
// ---------------------------------------------------------------------------

describe("findPeakElevation", () => {
  it("finds the peak of a parabolic elevation curve within tolerance", () => {
    // Parabola peaking at t=10000ms with elevation = 45°
    // el(t) = 45 - 0.000004 * (t - 10000)^2
    const elevFn: ElevationFn = (ms) => 45 - 4e-6 * Math.pow(ms - 10_000, 2);

    const { epochMs, elevationDeg } = findPeakElevation(elevFn, 0, 20_000, 1_000);
    expect(Math.abs(epochMs - 10_000)).toBeLessThanOrEqual(1_000 + 1_000); // tolerance
    expect(elevationDeg).toBeGreaterThanOrEqual(44); // near 45°
  });

  it("returns a finite elevationDeg", () => {
    const elevFn: ElevationFn = (ms) => Math.sin(ms / 5_000) * 30;
    const { elevationDeg } = findPeakElevation(elevFn, 0, Math.PI * 5_000, 1_000);
    expect(Number.isFinite(elevationDeg)).toBe(true);
  });

  it("respects provided bounds — peak is within [loMs, hiMs]", () => {
    const elevFn: ElevationFn = (ms) => -Math.pow(ms - 10_000, 2);
    const { epochMs } = findPeakElevation(elevFn, 5_000, 15_000, 500);
    expect(epochMs).toBeGreaterThanOrEqual(5_000);
    expect(epochMs).toBeLessThanOrEqual(15_000);
  });
});
