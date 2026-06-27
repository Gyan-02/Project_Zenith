/**
 * GYA-16 – Unit tests for horizons.cache.ts
 */

import { describe, it, expect, vi } from "vitest";
import {
  HorizonsCache,
  buildCacheKey,
  truncateToHour,
  CACHE_TTL_MS,
} from "../horizons.cache.js";
import type { PlanetEphemeris } from "../horizons.types.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makePlanet(id: string): PlanetEphemeris {
  return {
    id,
    kind: "planet",
    name: id.charAt(0).toUpperCase() + id.slice(1),
    position: { ra: 90.0, dec: 20.0, altDeg: 30.0, azDeg: 180.0, distanceKm: 1_000_000 },
    observedAt: "2026-06-25T00:00:00.000Z",
    source: "NASA Horizons",
  };
}

// ---------------------------------------------------------------------------
// buildCacheKey
// ---------------------------------------------------------------------------

describe("buildCacheKey", () => {
  it("produces a deterministic string for the same inputs", () => {
    const k1 = buildCacheKey("mars", 25.61, 85.14, "2026-06-25T00:00:00.000Z");
    const k2 = buildCacheKey("mars", 25.61, 85.14, "2026-06-25T00:00:00.000Z");
    expect(k1).toBe(k2);
  });

  it("changes when planetId changes", () => {
    const k1 = buildCacheKey("mars",   25.61, 85.14, "2026-06-25T00:00:00.000Z");
    const k2 = buildCacheKey("venus",  25.61, 85.14, "2026-06-25T00:00:00.000Z");
    expect(k1).not.toBe(k2);
  });

  it("changes when observer latitude changes", () => {
    const k1 = buildCacheKey("mars", 25.61, 85.14, "2026-06-25T00:00:00.000Z");
    const k2 = buildCacheKey("mars", 28.70, 85.14, "2026-06-25T00:00:00.000Z");
    expect(k1).not.toBe(k2);
  });

  it("changes when observer longitude changes", () => {
    const k1 = buildCacheKey("mars", 25.61, 85.14, "2026-06-25T00:00:00.000Z");
    const k2 = buildCacheKey("mars", 25.61, 77.21, "2026-06-25T00:00:00.000Z");
    expect(k1).not.toBe(k2);
  });

  it("changes when the UTC hour changes", () => {
    const k1 = buildCacheKey("mars", 25.61, 85.14, "2026-06-25T00:00:00.000Z");
    const k2 = buildCacheKey("mars", 25.61, 85.14, "2026-06-25T01:00:00.000Z");
    expect(k1).not.toBe(k2);
  });

  it("treats coordinates within 0.004° as the same bucket", () => {
    // 25.612 and 25.613 both round to 25.61 at 2 d.p.
    const k1 = buildCacheKey("mars", 25.612, 85.142, "2026-06-25T00:00:00.000Z");
    const k2 = buildCacheKey("mars", 25.613, 85.143, "2026-06-25T00:00:00.000Z");
    // Both round to 25.61 / 85.14 → same key
    expect(k1).toBe(k2);
  });
});

// ---------------------------------------------------------------------------
// truncateToHour
// ---------------------------------------------------------------------------

describe("truncateToHour", () => {
  it("truncates minutes and seconds to zero", () => {
    expect(truncateToHour("2026-06-25T13:47:22.000Z")).toBe("2026-06-25T13:00:00.000Z");
  });

  it("is stable when already on the hour", () => {
    expect(truncateToHour("2026-06-25T00:00:00.000Z")).toBe("2026-06-25T00:00:00.000Z");
  });
});

// ---------------------------------------------------------------------------
// HorizonsCache
// ---------------------------------------------------------------------------

describe("HorizonsCache", () => {
  it("returns undefined for a key that has never been set", () => {
    const cache = new HorizonsCache();
    expect(cache.getFresh("nonexistent")).toBeUndefined();
  });

  it("returns a fresh entry immediately after set()", () => {
    const cache = new HorizonsCache();
    const key = "mars|25.61|85.14|2026-06-25T00:00:00.000Z";
    cache.set(key, makePlanet("mars"));
    expect(cache.getFresh(key)).toBeDefined();
  });

  it("returns undefined for an entry that has expired", () => {
    let now = 0;
    const clock = () => now;
    const cache = new HorizonsCache(1_000, clock); // 1 s TTL

    const key = "mars|25.61|85.14|2026-06-25T00:00:00.000Z";
    cache.set(key, makePlanet("mars"));

    now = 1_001; // 1 s later — expired
    expect(cache.getFresh(key)).toBeUndefined();
  });

  it("getStale returns an expired entry tagged _stale", () => {
    let now = 0;
    const clock = () => now;
    const cache = new HorizonsCache(1_000, clock);

    const key = "mars|25.61|85.14|2026-06-25T00:00:00.000Z";
    cache.set(key, makePlanet("mars"));

    now = 2_000; // expired
    const stale = cache.getStale(key);
    expect(stale).toBeDefined();
    expect((stale as { _stale?: boolean })?._stale).toBe(true);
  });

  it("getStale returns undefined when no entry exists", () => {
    const cache = new HorizonsCache();
    expect(cache.getStale("nonexistent")).toBeUndefined();
  });

  it("isFresh() returns true for a fresh entry", () => {
    const cache = new HorizonsCache();
    const key = "key1";
    cache.set(key, makePlanet("jupiter"));
    expect(cache.isFresh(key)).toBe(true);
  });

  it("isFresh() returns false for an expired entry", () => {
    let now = 0;
    const clock = () => now;
    const cache = new HorizonsCache(500, clock);
    const key = "key1";
    cache.set(key, makePlanet("jupiter"));
    now = 600;
    expect(cache.isFresh(key)).toBe(false);
  });

  it("isFresh() returns false when the key is absent", () => {
    const cache = new HorizonsCache();
    expect(cache.isFresh("missing")).toBe(false);
  });

  // ---- In-flight deduplication ----

  it("getInFlight returns undefined when no in-flight request exists", () => {
    const cache = new HorizonsCache();
    expect(cache.getInFlight("key")).toBeUndefined();
  });

  it("setInFlight stores a promise that resolves to the planet", async () => {
    const cache = new HorizonsCache();
    const planet = makePlanet("saturn");
    const promise = Promise.resolve(planet);

    cache.setInFlight("key2", promise);
    const result = await cache.getInFlight("key2");
    expect(result?.id).toBe("saturn");
  });

  it("cleans up the in-flight slot after resolution", async () => {
    const cache = new HorizonsCache();
    const planet = makePlanet("saturn");
    const promise = Promise.resolve(planet);

    cache.setInFlight("key3", promise);
    await promise; // let microtasks settle
    // Give the .then() handler time to delete the entry
    await Promise.resolve();
    expect(cache.getInFlight("key3")).toBeUndefined();
  });

  it("cleans up the in-flight slot after rejection", async () => {
    const cache = new HorizonsCache();
    const promise = Promise.reject(new Error("upstream failure"));
    // Prevent unhandled rejection warning
    promise.catch(() => {});

    cache.setInFlight("key4", promise);
    await promise.catch(() => {});
    await Promise.resolve();
    expect(cache.getInFlight("key4")).toBeUndefined();
  });

  it("stores the result in the cache after in-flight promise resolves", async () => {
    const cache = new HorizonsCache();
    const planet = makePlanet("venus");
    const promise = Promise.resolve(planet);

    cache.setInFlight("key5", promise);
    await promise;
    await Promise.resolve(); // let .then() handler run
    expect(cache.getFresh("key5")?.id).toBe("venus");
  });

  it("clear() removes all entries", () => {
    const cache = new HorizonsCache();
    cache.set("a", makePlanet("mars"));
    cache.set("b", makePlanet("venus"));
    expect(cache.size).toBe(2);
    cache.clear();
    expect(cache.size).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Deduplication integration scenario
// ---------------------------------------------------------------------------

describe("concurrent request deduplication", () => {
  it("two simultaneous requests share one promise and result in one fetch call", async () => {
    const cache = new HorizonsCache();
    const planet = makePlanet("neptune");

    let fetchCount = 0;
    const slowFetch = new Promise<PlanetEphemeris>((resolve) => {
      fetchCount++;
      setTimeout(() => resolve(planet), 10);
    });

    cache.setInFlight("neptune-key", slowFetch);

    // Both awaiters share the same promise
    const [r1, r2] = await Promise.all([
      cache.getInFlight("neptune-key"),
      cache.getInFlight("neptune-key"),
    ]);

    expect(r1?.id).toBe("neptune");
    expect(r2?.id).toBe("neptune");
    expect(fetchCount).toBe(1); // only one actual fetch
  });
});
