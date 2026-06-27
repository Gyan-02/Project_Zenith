import { describe, expect, it, vi } from "vitest";
import { CelestrakProvider } from "../celestrak.client.js";
import { ISS_TLE } from "./tle.parser.test.js";

describe("CelestrakProvider", () => {
  it("caches the catalog and coalesces identical requests", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response(ISS_TLE, { status: 200 }));
    const provider = new CelestrakProvider({ fetchImpl, now: () => 1_700_000_000_000 });
    const [first, second] = await Promise.all([provider.getCatalog(), provider.getCatalog()]);
    await provider.getCatalog();
    expect(fetchImpl).toHaveBeenCalledOnce();
    expect(first.records).toEqual(second.records);
  });

  it("uses an explicitly stale catalog after an upstream failure", async () => {
    let now = 1_700_000_000_000;
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(new Response(ISS_TLE, { status: 200 }))
      .mockRejectedValueOnce(new Error("offline"));
    const provider = new CelestrakProvider({ fetchImpl, now: () => now, cacheTtlMs: 10 });
    await provider.getCatalog();
    now += 20;
    await expect(provider.getCatalog()).resolves.toMatchObject({ stale: true });
  });
});
