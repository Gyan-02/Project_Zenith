import { describe, expect, it } from "vitest";
import { propagateTle } from "../sgp4.js";
import { parseTleCatalog } from "../tle.parser.js";
import { ISS_TLE } from "./tle.parser.test.js";

describe("propagateTle", () => {
  it("produces finite observer-relative coordinates", () => {
    const object = propagateTle(
      parseTleCatalog(ISS_TLE)[0]!,
      { lat: 25.61, lon: 85.14, elevationM: 53 },
      new Date("2024-06-24T12:30:00.000Z"),
    );
    expect(Object.values(object.position).every(Number.isFinite)).toBe(true);
    expect(object.kind).toBe("satellite");
  });
});
