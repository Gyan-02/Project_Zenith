import { describe, expect, it } from "vitest";
import { TleParseError } from "../celestrak.errors.js";
import { parseTleCatalog } from "../tle.parser.js";

export const ISS_TLE = `ISS (ZARYA)
1 25544U 98067A   24176.51887731  .00016908  00000+0  30210-3 0  9999
2 25544  51.6393 246.1087 0005680 307.7215 151.8781 15.50034804459547`;

describe("parseTleCatalog", () => {
  it("parses named three-line CelesTrak records", () => {
    expect(parseTleCatalog(ISS_TLE)).toEqual([
      expect.objectContaining({ id: "sat-25544", catalogNumber: "25544", name: "ISS (ZARYA)" }),
    ]);
  });

  it("rejects malformed records", () => {
    expect(() => parseTleCatalog("ISS\nnot tle")).toThrow(TleParseError);
  });
});
