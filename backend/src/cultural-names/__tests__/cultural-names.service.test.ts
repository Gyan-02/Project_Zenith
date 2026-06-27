import { describe, expect, it } from "vitest";
import { getNameInTradition, getNamesForObject, getTraditions } from "../cultural-names.service.js";

describe("cultural names service", () => {
  it("returns the planned Brihaspati mapping", () => {
    expect(getNameInTradition("jupiter", "vedic")?.name).toBe("Brihaspati");
  });

  it("returns undefined for an unknown object", () => {
    expect(getNamesForObject("does-not-exist")).toBeUndefined();
  });

  it("exposes all four v1 traditions", () => {
    expect(Object.keys(getTraditions())).toEqual(expect.arrayContaining(["vedic", "chinese", "greek", "arabic"]));
  });
});
