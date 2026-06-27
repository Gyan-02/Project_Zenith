import { describe, expect, it } from "vitest";
import { shiftIsoTime } from "../timeMachine";

describe("timeMachine helpers", () => {
  it("shifts ISO time by whole hours", () => {
    expect(shiftIsoTime("2026-06-25T00:00:00.000Z", 2)).toBe("2026-06-25T02:00:00.000Z");
    expect(shiftIsoTime("2026-06-25T00:00:00.000Z", -1)).toBe("2026-06-24T23:00:00.000Z");
  });
});
