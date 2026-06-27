import { describe, expect, it, vi } from "vitest";
import type { SkyObject } from "../../../contracts.js";
import { IssProvider } from "../iss.provider.js";

const NOW = 1_719_230_400_000;
const observer = { lat: 25.61, lon: 85.14, elevationM: 53 };
const fallbackObject: SkyObject = {
  id: "iss",
  kind: "iss",
  name: "International Space Station",
  position: { ra: 10, dec: 4, altDeg: 20, azDeg: 80, distanceKm: 900 },
  metadata: { source: "test fallback" },
};

describe("IssProvider", () => {
  it("normalizes a live Open Notify response", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          message: "success",
          timestamp: NOW / 1_000,
          iss_position: { latitude: "12.4", longitude: "77.5" },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    const provider = new IssProvider({ fetchImpl, now: () => NOW, fallback: vi.fn() });
    const result = await provider.getIss(observer, new Date(NOW));
    expect(result.kind).toBe("iss");
    expect(Object.values(result.position).every(Number.isFinite)).toBe(true);
    expect(result.metadata?.altitudeIsAssumed).toBe(true);
  });

  it("uses SGP4 fallback when Open Notify fails", async () => {
    const fallback = vi.fn().mockResolvedValue(fallbackObject);
    const provider = new IssProvider({
      fetchImpl: vi.fn().mockRejectedValue(new Error("offline")),
      now: () => NOW,
      fallback,
    });
    await expect(provider.getIss(observer, new Date(NOW))).resolves.toEqual(fallbackObject);
    expect(fallback).toHaveBeenCalledOnce();
  });

  it("skips the real-time API for historical queries", async () => {
    const fetchImpl = vi.fn();
    const fallback = vi.fn().mockResolvedValue(fallbackObject);
    const provider = new IssProvider({ fetchImpl, now: () => NOW, fallback });
    await provider.getIss(observer, new Date(NOW - 10 * 60 * 1_000));
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(fallback).toHaveBeenCalledOnce();
  });
});
