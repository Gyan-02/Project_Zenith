import { describe, expect, it, vi } from "vitest";
import type { SkyObject } from "../../contracts.js";
import { createSkyStateService } from "../skyState.js";

const planet: SkyObject = {
  id: "saturn",
  kind: "planet",
  name: "Saturn",
  position: { ra: 2, dec: 12 },
  metadata: { source: "test planets" },
};
const satellite: SkyObject = {
  id: "sat-1",
  kind: "satellite",
  name: "Test satellite",
  position: { ra: 4, dec: -3 },
};

describe("createSkyStateService", () => {
  it("composes providers into the planned SkyState contract", async () => {
    const service = createSkyStateService({
      getPlanets: vi.fn().mockResolvedValue([planet]),
      getSatellites: vi.fn().mockResolvedValue({
        objects: [satellite],
        stale: false,
        fetchedAt: "2026-06-25T00:00:00.000Z",
      }),
      getIss: vi.fn().mockResolvedValue({ ...satellite, id: "iss", kind: "iss", name: "ISS" }),
      now: () => new Date("2026-06-25T00:00:00.000Z"),
    });
    const state = await service({
      location: { lat: 25.61, lon: 85.14 },
      timeIso: "2026-06-25T00:00:00.000Z",
    });
    expect(state).toMatchObject({
      planets: [{ id: "saturn" }],
      stars: expect.arrayContaining([expect.objectContaining({ id: "sirius", kind: "star" })]),
      satellites: [{ id: "sat-1" }],
      iss: { id: "iss" },
      location: { lat: 25.61, lon: 85.14 },
    });
  });

  it("degrades failed satellite layers without losing successful providers", async () => {
    const service = createSkyStateService({
      getPlanets: vi.fn().mockResolvedValue([planet]),
      getSatellites: vi.fn().mockRejectedValue(new Error("CelesTrak down")),
      getIss: vi.fn().mockRejectedValue(new Error("ISS down")),
    });
    const state = await service({ location: { lat: 0, lon: 0 }, timeIso: "2026-06-25T00:00:00.000Z" });
    expect(state.planets).toHaveLength(1);
    expect(state.stars?.length).toBeGreaterThan(0);
    expect(state.satellites).toEqual([]);
    expect(state.iss).toBeNull();
  });
});
