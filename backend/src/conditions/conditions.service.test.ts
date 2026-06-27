/**
 * GYA-11 – Tests for conditions.service.ts
 *
 * All tests use injected providers — no live network calls.
 */

import { describe, expect, it, vi } from "vitest";
import { ConditionsService, scoreCloudCover } from "./conditions.service.js";
import type { RawWeatherData, WeatherProvider } from "./conditions.types.js";
import { WeatherProviderError } from "./conditions.types.js";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeRaw(overrides: Partial<RawWeatherData> = {}): RawWeatherData {
  return {
    timestampUnix: 1_750_000_000,
    cloudCoverPct: 10,
    visibilityMeters: 10_000,
    humidityPct: 45,
    temperatureC: 18,
    windSpeedMps: 3.5,
    ...overrides,
  };
}

function makeProvider(raw: RawWeatherData): WeatherProvider {
  return { fetchConditions: vi.fn().mockResolvedValue(raw) };
}

// ---------------------------------------------------------------------------
// scoreCloudCover
// ---------------------------------------------------------------------------

describe("scoreCloudCover", () => {
  it("0% cloud cover → Excellent", () => expect(scoreCloudCover(0)).toBe("Excellent"));
  it("20% cloud cover → Excellent (boundary)", () => expect(scoreCloudCover(20)).toBe("Excellent"));
  it("21% cloud cover → Good (boundary)", () => expect(scoreCloudCover(21)).toBe("Good"));
  it("60% cloud cover → Good (boundary)", () => expect(scoreCloudCover(60)).toBe("Good"));
  it("61% cloud cover → Poor (boundary)", () => expect(scoreCloudCover(61)).toBe("Poor"));
  it("100% cloud cover → Poor", () => expect(scoreCloudCover(100)).toBe("Poor"));
});

// ---------------------------------------------------------------------------
// ConditionsService – happy path
// ---------------------------------------------------------------------------

describe("ConditionsService – happy path", () => {
  it("returns Excellent quality for low cloud cover", async () => {
    const svc = new ConditionsService({ provider: makeProvider(makeRaw({ cloudCoverPct: 5 })) });
    const result = await svc.getConditions({ lat: 51.5, lon: -0.1 });
    expect(result.quality).toBe("Excellent");
    expect(result.unavailable).toBe(false);
    expect(result.cached).toBe(false);
    expect(result.cloudCoverPct).toBe(5);
    expect(result.source).toBe("OpenWeatherMap");
  });

  it("returns Good quality for mid-range cloud cover", async () => {
    const svc = new ConditionsService({ provider: makeProvider(makeRaw({ cloudCoverPct: 40 })) });
    const result = await svc.getConditions({ lat: 0, lon: 0 });
    expect(result.quality).toBe("Good");
  });

  it("returns Poor quality for high cloud cover", async () => {
    const svc = new ConditionsService({ provider: makeProvider(makeRaw({ cloudCoverPct: 90 })) });
    const result = await svc.getConditions({ lat: 0, lon: 0 });
    expect(result.quality).toBe("Poor");
  });

  it("populates all supporting fields", async () => {
    const raw = makeRaw({
      cloudCoverPct: 15,
      visibilityMeters: 8_000,
      humidityPct: 60,
      temperatureC: 12.5,
      windSpeedMps: 2.1,
    });
    const svc = new ConditionsService({ provider: makeProvider(raw) });
    const result = await svc.getConditions({ lat: 48.85, lon: 2.35 });

    expect(result.cloudCoverPct).toBe(15);
    expect(result.visibilityMeters).toBe(8_000);
    expect(result.humidityPct).toBe(60);
    expect(result.temperatureC).toBe(12.5);
    expect(result.windSpeedMps).toBe(2.1);
  });

  it("summary contains the quality word", async () => {
    const svc = new ConditionsService({ provider: makeProvider(makeRaw({ cloudCoverPct: 5 })) });
    const result = await svc.getConditions({ lat: 0, lon: 0 });
    expect(result.summary.toLowerCase()).toContain("excellent");
  });
});

// ---------------------------------------------------------------------------
// ConditionsService – caching
// ---------------------------------------------------------------------------

describe("ConditionsService – caching", () => {
  it("caches the result and reuses it on a second call within the TTL", async () => {
    const fetchConditions = vi.fn().mockResolvedValue(makeRaw());
    const provider: WeatherProvider = { fetchConditions };
    const svc = new ConditionsService({ provider, cacheTtlMs: 60_000 });

    await svc.getConditions({ lat: 51.5, lon: -0.1 });
    const second = await svc.getConditions({ lat: 51.5, lon: -0.1 });

    expect(fetchConditions).toHaveBeenCalledOnce();
    expect(second.cached).toBe(true);
  });

  it("fetches again after the TTL expires", async () => {
    let now = 1_000_000;
    const fetchConditions = vi.fn().mockResolvedValue(makeRaw());
    const svc = new ConditionsService({
      provider: { fetchConditions },
      cacheTtlMs: 500,
      now: () => now,
    });

    await svc.getConditions({ lat: 51.5, lon: -0.1 });
    now += 600; // advance past TTL
    const second = await svc.getConditions({ lat: 51.5, lon: -0.1 });

    expect(fetchConditions).toHaveBeenCalledTimes(2);
    expect(second.cached).toBe(false);
  });

  it("cache key changes when location changes", async () => {
    const fetchConditions = vi.fn().mockResolvedValue(makeRaw());
    const svc = new ConditionsService({ provider: { fetchConditions }, cacheTtlMs: 60_000 });

    await svc.getConditions({ lat: 51.5, lon: -0.1 });
    await svc.getConditions({ lat: 48.8, lon: 2.3 }); // different location

    expect(fetchConditions).toHaveBeenCalledTimes(2);
  });

  it("clearCache forces a fresh fetch", async () => {
    const fetchConditions = vi.fn().mockResolvedValue(makeRaw());
    const svc = new ConditionsService({ provider: { fetchConditions }, cacheTtlMs: 60_000 });

    await svc.getConditions({ lat: 51.5, lon: -0.1 });
    svc.clearCache();
    await svc.getConditions({ lat: 51.5, lon: -0.1 });

    expect(fetchConditions).toHaveBeenCalledTimes(2);
  });
});

// ---------------------------------------------------------------------------
// ConditionsService – missing API key / provider unavailable
// ---------------------------------------------------------------------------

describe("ConditionsService – provider unavailable", () => {
  it("returns an unavailable result when the API key is missing", async () => {
    const provider: WeatherProvider = {
      fetchConditions: vi.fn().mockRejectedValue(
        new WeatherProviderError("missing_api_key", "No key configured"),
      ),
    };
    const svc = new ConditionsService({ provider });
    const result = await svc.getConditions({ lat: 51.5, lon: -0.1 });

    expect(result.unavailable).toBe(true);
    expect(result.quality).toBe("Unknown");
    expect(result.cloudCoverPct).toBeNull();
    expect(result.summary).toMatch(/unavailable/i);
    expect(result.summary).toMatch(/api key/i);
  });

  it("returns an unavailable result on upstream HTTP failure", async () => {
    const provider: WeatherProvider = {
      fetchConditions: vi.fn().mockRejectedValue(
        new WeatherProviderError("upstream_http", "HTTP 503"),
      ),
    };
    const svc = new ConditionsService({ provider });
    const result = await svc.getConditions({ lat: 0, lon: 0 });

    expect(result.unavailable).toBe(true);
    expect(result.quality).toBe("Unknown");
    expect(result.cloudCoverPct).toBeNull();
    expect(result.visibilityMeters).toBeNull();
  });

  it("returns an unavailable result on timeout", async () => {
    const provider: WeatherProvider = {
      fetchConditions: vi.fn().mockRejectedValue(
        new WeatherProviderError("timeout", "Request timed out"),
      ),
    };
    const svc = new ConditionsService({ provider });
    const result = await svc.getConditions({ lat: 0, lon: 0 });

    expect(result.unavailable).toBe(true);
  });

  it("does not throw — always returns a typed result", async () => {
    const provider: WeatherProvider = {
      fetchConditions: vi.fn().mockRejectedValue(new Error("unexpected")),
    };
    const svc = new ConditionsService({ provider });
    await expect(svc.getConditions({ lat: 0, lon: 0 })).resolves.toMatchObject({
      unavailable: true,
    });
  });
});
