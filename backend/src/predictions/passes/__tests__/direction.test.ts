/**
 * GYA-14 – Tests for direction.ts
 */

import { describe, it, expect } from "vitest";
import { azimuthToDirection } from "../direction.js";

describe("azimuthToDirection", () => {
  // ---- Cardinal boundaries ------------------------------------------------

  it("maps 0° to N", () => expect(azimuthToDirection(0)).toBe("N"));
  it("maps 360° to N (normalised)", () => expect(azimuthToDirection(360)).toBe("N"));
  it("maps 90° to E", () => expect(azimuthToDirection(90)).toBe("E"));
  it("maps 180° to S", () => expect(azimuthToDirection(180)).toBe("S"));
  it("maps 270° to W", () => expect(azimuthToDirection(270)).toBe("W"));

  // ---- Intercardinal -------------------------------------------------------

  it("maps 45° to NE", () => expect(azimuthToDirection(45)).toBe("NE"));
  it("maps 135° to SE", () => expect(azimuthToDirection(135)).toBe("SE"));
  it("maps 225° to SW", () => expect(azimuthToDirection(225)).toBe("SW"));
  it("maps 315° to NW", () => expect(azimuthToDirection(315)).toBe("NW"));

  // ---- Sector boundaries ---------------------------------------------------

  // Each sector spans 45° centred on the cardinal: N occupies [337.5, 22.5)
  it("maps 22.4° to N (just inside N sector)", () => expect(azimuthToDirection(22.4)).toBe("N"));
  it("maps 22.5° to NE (first point of NE sector)", () => expect(azimuthToDirection(22.5)).toBe("NE"));
  it("maps 337.5° to N (wraps back to N sector at 337.5+22.5=360)", () => expect(azimuthToDirection(337.5)).toBe("N"));
  it("maps 337.4° to NW (just inside NW sector before wrapping)", () => expect(azimuthToDirection(337.4)).toBe("NW"));

  // ---- Normalisation -------------------------------------------------------

  it("normalises negative azimuth -90° → 270° → W", () => expect(azimuthToDirection(-90)).toBe("W"));
  it("normalises negative azimuth -180° → 180° → S", () => expect(azimuthToDirection(-180)).toBe("S"));
  it("normalises > 360° azimuth 450° → 90° → E", () => expect(azimuthToDirection(450)).toBe("E"));
  it("normalises > 360° azimuth 720° → 0° → N", () => expect(azimuthToDirection(720)).toBe("N"));

  // ---- All 8 directions reachable ------------------------------------------

  it("returns all 8 directions for their canonical azimuths", () => {
    const expectedMap: Record<number, string> = {
      0: "N", 45: "NE", 90: "E", 135: "SE",
      180: "S", 225: "SW", 270: "W", 315: "NW",
    };
    for (const [az, dir] of Object.entries(expectedMap)) {
      expect(azimuthToDirection(Number(az))).toBe(dir);
    }
  });
});
