/**
 * GYA-16 – Integration tests for horizons.client.ts
 *
 * All tests use a mocked fetch function — no real HTTP calls are made.
 */

import { describe, it, expect, vi } from "vitest";
import { fetchPlanetEphemeris, PLANETS } from "../horizons.client.js";
import { HorizonsProviderError } from "../horizons.types.js";
import { HorizonsCache, buildCacheKey, truncateToHour } from "../horizons.cache.js";
import { getSinglePlanet, getPlanets } from "../index.js";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const OBSERVER = { lat: 25.61, lon: 85.14, elevationM: 0 };
const UTC_ISO  = "2026-06-25T00:00:00.000Z";
const MARS     = PLANETS.find((p) => p.id === "mars")!;

/** Build a complete Horizons response envelope for a given planet. */
function makeHorizonsEnvelope(
  planetId: string,
  ra: number,
  dec: number,
  az: number,
  el: number,
  dist: number,
): string {
  const result = `
 OBSERVER TABLE
$$SOE
 2026-Jun-25 00:00 *   ${ra}   ${dec}   -0.01   0.01   ${az}   ${el}   ${dist}
$$EOE
`;
  return JSON.stringify({ signature: { version: "1.2", source: "NASA/JPL Horizons API" }, result });
}

const MARS_RESPONSE = makeHorizonsEnvelope("mars", 85.0, 21.5, 195.0, 15.0, 228_315_000);

// ---------------------------------------------------------------------------
// fetchPlanetEphemeris
// ---------------------------------------------------------------------------

describe("fetchPlanetEphemeris", () => {
  it("returns a PlanetEphemeris with correct shape on success", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(MARS_RESPONSE, { status: 200 }),
    );

    const result = await fetchPlanetEphemeris(MARS, OBSERVER, UTC_ISO, { fetch: mockFetch });

    expect(result.id).toBe("mars");
    expect(result.kind).toBe("planet");
    expect(result.name).toBe("Mars");
    expect(result.source).toBe("NASA Horizons");
    expect(isFinite(result.position.ra)).toBe(true);
    expect(isFinite(result.position.dec)).toBe(true);
    expect(mockFetch).toHaveBeenCalledOnce();
  });

  it("includes alt/az/distance in the response", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(MARS_RESPONSE, { status: 200 }),
    );
    const result = await fetchPlanetEphemeris(MARS, OBSERVER, UTC_ISO, { fetch: mockFetch });

    expect(result.position.altDeg).toBeCloseTo(15.0, 1);
    expect(result.position.azDeg).toBeCloseTo(195.0, 1);
    expect(result.position.distanceKm).toBeCloseTo(228_315_000, -3);
  });

  it("throws HorizonsProviderError with kind='upstream_http' on non-200 status", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response("Service unavailable", { status: 503 }),
    );

    await expect(
      fetchPlanetEphemeris(MARS, OBSERVER, UTC_ISO, { fetch: mockFetch }),
    ).rejects.toSatisfy(
      (err: unknown) => err instanceof HorizonsProviderError && err.kind === "upstream_http",
    );
  });

  it("throws HorizonsProviderError with kind='timeout' when fetch is aborted", async () => {
    const mockFetch = vi.fn().mockImplementation(
      (_url: string, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          const signal = init?.signal as AbortSignal | undefined;
          if (signal) {
            signal.addEventListener("abort", () => {
              const err = new DOMException("The operation was aborted.", "AbortError");
              reject(err);
            });
          }
        }),
    );

    await expect(
      fetchPlanetEphemeris(MARS, OBSERVER, UTC_ISO, { fetch: mockFetch, timeoutMs: 1 }),
    ).rejects.toSatisfy(
      (err: unknown) => err instanceof HorizonsProviderError && err.kind === "timeout",
    );
  });

  it("throws HorizonsProviderError with kind='parse' for malformed response", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response("{}", { status: 200 }),
    );

    await expect(
      fetchPlanetEphemeris(MARS, OBSERVER, UTC_ISO, { fetch: mockFetch }),
    ).rejects.toSatisfy(
      (err: unknown) => err instanceof HorizonsProviderError && err.kind === "parse",
    );
  });
});

// ---------------------------------------------------------------------------
// getSinglePlanet – cache integration
// ---------------------------------------------------------------------------

describe("getSinglePlanet cache integration", () => {
  it("returns a fresh cached result without making a second HTTP call", async () => {
    const cache = new HorizonsCache();
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(MARS_RESPONSE, { status: 200 }),
    );

    const opts = { fetch: mockFetch, cache };

    const r1 = await getSinglePlanet("mars", OBSERVER, UTC_ISO, opts);
    // Wait for cache to be populated (in-flight .then runs)
    await Promise.resolve();
    const r2 = await getSinglePlanet("mars", OBSERVER, UTC_ISO, opts);

    expect(r1.id).toBe("mars");
    expect(r2.id).toBe("mars");
    // Only one HTTP call despite two getSinglePlanet calls
    expect(mockFetch).toHaveBeenCalledOnce();
  });

  it("performs exactly one HTTP call for two simultaneous identical requests", async () => {
    const cache = new HorizonsCache();
    let resolveFirst!: (v: Response) => void;
    const slowResponse = new Promise<Response>((res) => { resolveFirst = res; });

    const mockFetch = vi.fn().mockReturnValue(slowResponse);

    const opts = { fetch: mockFetch, cache };

    const promise1 = getSinglePlanet("mars", OBSERVER, UTC_ISO, opts);
    const promise2 = getSinglePlanet("mars", OBSERVER, UTC_ISO, opts);

    resolveFirst(new Response(MARS_RESPONSE, { status: 200 }));

    const [r1, r2] = await Promise.all([promise1, promise2]);

    expect(r1.id).toBe("mars");
    expect(r2.id).toBe("mars");
    expect(mockFetch).toHaveBeenCalledOnce();
  });

  it("returns stale cache entry with _stale flag when upstream fails", async () => {
    let now = 0;
    const clock = () => now;
    const cache = new HorizonsCache(1_000, clock); // 1s TTL

    // Populate cache with a fresh entry
    const mockFetchSuccess = vi.fn().mockResolvedValue(
      new Response(MARS_RESPONSE, { status: 200 }),
    );
    await getSinglePlanet("mars", OBSERVER, UTC_ISO, { fetch: mockFetchSuccess, cache });
    await Promise.resolve();

    // Expire the entry
    now = 2_000;

    // Next fetch fails
    const mockFetchFail = vi.fn().mockRejectedValue(new Error("network down"));

    const result = await getSinglePlanet("mars", OBSERVER, UTC_ISO, {
      fetch: mockFetchFail,
      cache,
    });

    expect(result.id).toBe("mars");
    expect((result as { _stale?: boolean })._stale).toBe(true);
  });

  it("throws when no stale entry and upstream fails", async () => {
    const cache = new HorizonsCache();
    const mockFetch = vi.fn().mockRejectedValue(new Error("network down"));

    await expect(
      getSinglePlanet("mars", OBSERVER, UTC_ISO, { fetch: mockFetch, cache }),
    ).rejects.toThrow();
  });

  it("cache key changes when observer location changes", async () => {
    const cache = new HorizonsCache();
    // Use mockImplementation to return a fresh Response body each call.
    const mockFetch = vi.fn().mockImplementation(() =>
      Promise.resolve(new Response(MARS_RESPONSE, { status: 200 })),
    );

    const opts = { fetch: mockFetch, cache };

    await getSinglePlanet("mars", { lat: 25.61, lon: 85.14 }, UTC_ISO, opts);
    await Promise.resolve();
    await getSinglePlanet("mars", { lat: 12.97, lon: 77.59 }, UTC_ISO, opts); // Bangalore
    await Promise.resolve();

    // Two different observer locations → two HTTP calls
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});

// ---------------------------------------------------------------------------
// getPlanets – multi-planet
// ---------------------------------------------------------------------------

describe("getPlanets", () => {
  it("returns results for all 7 supported planets", async () => {
    const cache = new HorizonsCache();
    const mockFetch = vi.fn().mockImplementation(() =>
      Promise.resolve(new Response(MARS_RESPONSE, { status: 200 })),
    );

    const results = await getPlanets(OBSERVER, UTC_ISO, { fetch: mockFetch, cache });

    expect(results.length).toBe(7);
    expect(mockFetch).toHaveBeenCalledTimes(7);
  });

  it("omits a planet if upstream fails and no stale entry exists", async () => {
    const cache = new HorizonsCache();
    let callCount = 0;
    const mockFetch = vi.fn().mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.reject(new Error("fail first planet"));
      }
      return Promise.resolve(new Response(MARS_RESPONSE, { status: 200 }));
    });

    const results = await getPlanets(OBSERVER, UTC_ISO, { fetch: mockFetch, cache });

    // 6 planets succeed, 1 is omitted
    expect(results.length).toBe(6);
  });
});

// ---------------------------------------------------------------------------
// PLANETS registry
// ---------------------------------------------------------------------------

describe("PLANETS registry", () => {
  it("contains exactly 7 planets", () => {
    expect(PLANETS).toHaveLength(7);
  });

  it("does not include Earth", () => {
    expect(PLANETS.every((p) => p.id !== "earth")).toBe(true);
  });

  it("contains all expected bodies", () => {
    const ids = PLANETS.map((p) => p.id);
    expect(ids).toContain("mercury");
    expect(ids).toContain("venus");
    expect(ids).toContain("mars");
    expect(ids).toContain("jupiter");
    expect(ids).toContain("saturn");
    expect(ids).toContain("uranus");
    expect(ids).toContain("neptune");
  });
});
