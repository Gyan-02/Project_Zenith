import { describe, expect, it } from "vitest";
import type { SkyObject } from "../contracts.js";
import { parseTleCatalog } from "../providers/celestrak/index.js";
import { sampleSatellitePath, tleRecordFromSkyObject, withSampledSatellitePath } from "./satellitePaths.js";

const ISS_TLE = `ISS (ZARYA)
1 25544U 98067A   24176.51887731  .00016908  00000+0  30210-3 0  9999
2 25544  51.6393 246.1087 0005680 307.7215 151.8781 15.50034804459547`;

const [record] = parseTleCatalog(ISS_TLE);

const issLikeObject: SkyObject = {
  id: record!.id,
  kind: "satellite",
  name: record!.name,
  position: { ra: 0, dec: 0, altDeg: 42, azDeg: 100 },
  metadata: {
    catalogNumber: record!.catalogNumber,
    tleLine1: record!.line1,
    tleLine2: record!.line2,
  },
};

describe("satellite path sampling", () => {
  it("extracts a TLE record from a sky object", () => {
    expect(tleRecordFromSkyObject(issLikeObject)).toMatchObject({
      id: "sat-25544",
      catalogNumber: "25544",
      name: "ISS (ZARYA)",
    });
  });

  it("samples finite path points from TLE metadata", () => {
    const samples = sampleSatellitePath(
      issLikeObject,
      { lat: 25.61, lon: 85.14, elevationM: 53 },
      new Date("2024-06-24T12:30:00.000Z"),
      { beforeMinutes: 0, afterMinutes: 12, stepMinutes: 3, minAltitudeDeg: -90 },
    );

    expect(samples.length).toBeGreaterThanOrEqual(2);
    expect(samples.every((sample) => Number.isFinite(sample.altDeg) && Number.isFinite(sample.azDeg))).toBe(true);
  });

  it("attaches sampled path metadata when enough samples exist", () => {
    const object = withSampledSatellitePath(
      issLikeObject,
      { lat: 25.61, lon: 85.14, elevationM: 53 },
      new Date("2024-06-24T12:30:00.000Z"),
      { beforeMinutes: 0, afterMinutes: 12, stepMinutes: 3, minAltitudeDeg: -90 },
    );

    expect(object.metadata?.pathMode).toBe("tle-sampled");
    expect(object.metadata?.pathSource).toContain("CelesTrak TLE");
    expect(object.metadata?.pathSamples).toEqual(expect.arrayContaining([expect.objectContaining({ timeUtc: expect.any(String) })]));
  });
});
