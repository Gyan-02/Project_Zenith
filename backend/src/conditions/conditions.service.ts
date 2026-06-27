/**
 * GYA-11 – Observing Conditions service.
 *
 * Wraps the WeatherProvider with:
 *  - Quality scoring (cloud cover → Excellent / Good / Poor / Unknown)
 *  - In-memory cache keyed by rounded lat/lon and hour (TTL 10 min)
 *  - Graceful degradation when the provider is unavailable
 */

import { OpenWeatherClient } from "./openweather.client.js";
import type {
  ObservingConditionsRequest,
  ObservingConditionsResponse,
  ObservingQuality,
  WeatherProvider,
} from "./conditions.types.js";
import { WeatherProviderError } from "./conditions.types.js";

// ---------------------------------------------------------------------------
// Quality scoring
// ---------------------------------------------------------------------------

/** Derive ObservingQuality from cloud cover percentage. */
export function scoreCloudCover(cloudCoverPct: number): ObservingQuality {
  if (cloudCoverPct <= 20) return "Excellent";
  if (cloudCoverPct <= 60) return "Good";
  return "Poor";
}

function buildSummary(quality: ObservingQuality, cloudCoverPct: number | null): string {
  switch (quality) {
    case "Excellent":
      return `Excellent viewing: low cloud cover (${cloudCoverPct ?? "?"}%).`;
    case "Good":
      return `Good viewing: partial cloud cover (${cloudCoverPct ?? "?"}%).`;
    case "Poor":
      return `Poor viewing: heavy cloud cover (${cloudCoverPct ?? "?"}%).`;
    default:
      return "Observing conditions are currently unavailable.";
  }
}

// ---------------------------------------------------------------------------
// Cache
// ---------------------------------------------------------------------------

/** Precision to which lat/lon are rounded for the cache key. */
const CACHE_COORD_PRECISION = 1; // 0.1° ≈ 11 km

const CACHE_TTL_MS = 10 * 60 * 1_000; // 10 minutes

interface CacheEntry {
  response: ObservingConditionsResponse;
  expiresAt: number;
}

function buildCacheKey(lat: number, lon: number, hourUtc: number): string {
  const factor = Math.pow(10, CACHE_COORD_PRECISION);
  const rLat = Math.round(lat * factor) / factor;
  const rLon = Math.round(lon * factor) / factor;
  return `${rLat}:${rLon}:${hourUtc}`;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export interface ConditionsServiceOptions {
  /** Override the weather provider (default: OpenWeatherClient). */
  provider?: WeatherProvider;
  /** Override the cache TTL in ms (useful for tests). */
  cacheTtlMs?: number;
  /** Clock override — returns current ms since epoch. */
  now?: () => number;
}

export class ConditionsService {
  private readonly provider: WeatherProvider;
  private readonly cacheTtlMs: number;
  private readonly now: () => number;
  private readonly cache = new Map<string, CacheEntry>();

  constructor(options: ConditionsServiceOptions = {}) {
    this.provider = options.provider ?? new OpenWeatherClient();
    this.cacheTtlMs = options.cacheTtlMs ?? CACHE_TTL_MS;
    this.now = options.now ?? (() => Date.now());
  }

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  async getConditions(
    request: ObservingConditionsRequest,
  ): Promise<ObservingConditionsResponse> {
    const { lat, lon } = request;
    const nowMs = this.now();
    const hourUtc = Math.floor(nowMs / 3_600_000);

    const cacheKey = buildCacheKey(lat, lon, hourUtc);
    const cached = this.cache.get(cacheKey);

    if (cached && nowMs < cached.expiresAt) {
      return { ...cached.response, cached: true };
    }

    // Fetch fresh data
    try {
      const raw = await this.provider.fetchConditions(lat, lon);
      const quality = scoreCloudCover(raw.cloudCoverPct);
      const response: ObservingConditionsResponse = {
        location: {
          lat: roundCoord(lat),
          lon: roundCoord(lon),
        },
        observedAt: new Date(raw.timestampUnix * 1_000).toISOString(),
        quality,
        summary: buildSummary(quality, raw.cloudCoverPct),
        cloudCoverPct: raw.cloudCoverPct,
        visibilityMeters: raw.visibilityMeters,
        humidityPct: raw.humidityPct,
        temperatureC: raw.temperatureC,
        windSpeedMps: raw.windSpeedMps,
        cached: false,
        unavailable: false,
        source: "OpenWeatherMap",
      };

      this.cache.set(cacheKey, {
        response,
        expiresAt: nowMs + this.cacheTtlMs,
      });

      return response;
    } catch (err) {
      // Graceful degradation — return a typed unavailable result
      const isMissingKey =
        err instanceof WeatherProviderError && err.kind === "missing_api_key";

      return {
        location: { lat: roundCoord(lat), lon: roundCoord(lon) },
        observedAt: new Date(nowMs).toISOString(),
        quality: "Unknown",
        summary: isMissingKey
          ? "Observing conditions unavailable: weather API key not configured."
          : "Observing conditions temporarily unavailable.",
        cloudCoverPct: null,
        visibilityMeters: null,
        humidityPct: null,
        temperatureC: null,
        windSpeedMps: null,
        cached: false,
        unavailable: true,
        source: "OpenWeatherMap",
      };
    }
  }

  /** Manually clear the cache (useful for tests). */
  clearCache(): void {
    this.cache.clear();
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function roundCoord(value: number): number {
  const factor = Math.pow(10, CACHE_COORD_PRECISION);
  return Math.round(value * factor) / factor;
}
