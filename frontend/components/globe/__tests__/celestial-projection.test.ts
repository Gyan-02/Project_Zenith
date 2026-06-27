import { describe, expect, it } from "vitest";
import { altAzToEnu, raDecToAltAz } from "../celestial-projection";

describe("celestial projection", () => {
  it("maps north horizon and zenith to normalized ENU vectors", () => {
    expect(altAzToEnu(0, 0)).toMatchObject({ east: 0, north: 1, up: 0 });
    const zenith = altAzToEnu(90, 120);
    expect(zenith.up).toBeCloseTo(1, 10);
  });

  it("converts RA/Dec into finite local horizon coordinates", () => {
    const result = raDecToAltAz(120, 22, { lat: 25.61, lon: 85.14 }, new Date("2026-06-25T00:00:00Z"));
    expect(result.altDeg).toBeGreaterThanOrEqual(-90);
    expect(result.altDeg).toBeLessThanOrEqual(90);
    expect(result.azDeg).toBeGreaterThanOrEqual(0);
    expect(result.azDeg).toBeLessThan(360);
  });
});
