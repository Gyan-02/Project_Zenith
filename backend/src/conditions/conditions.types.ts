/**
 * GYA-11 – Observing Conditions module types.
 *
 * Owned exclusively by backend/src/conditions/.
 * Not imported into contracts.ts — kept standalone so it can evolve
 * independently until GYA-36 wires it into the sky-state pipeline.
 */

// ---------------------------------------------------------------------------
// Inputs
// ---------------------------------------------------------------------------

export interface ObservingConditionsRequest {
  /** Decimal degrees, −90 to +90. */
  lat: number;
  /** Decimal degrees, −180 to +180. */
  lon: number;
  /**
   * Optional ISO-8601 UTC timestamp.
   * When omitted the service uses the current time.
   */
  timeUtc?: string;
}

// ---------------------------------------------------------------------------
// Quality rating
// ---------------------------------------------------------------------------

/**
 * Observing quality derived from cloud cover:
 *  - Excellent : 0–20 %
 *  - Good      : 21–60 %
 *  - Poor      : 61–100 %
 *  - Unknown   : data unavailable
 */
export type ObservingQuality = "Excellent" | "Good" | "Poor" | "Unknown";

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------

export interface ObservingConditionsResponse {
  /** Rounded location used for the look-up (matches the cache key). */
  location: { lat: number; lon: number };
  /** ISO-8601 UTC timestamp the conditions were observed/forecast at. */
  observedAt: string;
  quality: ObservingQuality;
  /** One-sentence human-readable verdict. */
  summary: string;
  /** Cloud cover percentage (0–100). Null when unavailable. */
  cloudCoverPct: number | null;
  /** Horizontal visibility in metres. Null when unavailable. */
  visibilityMeters: number | null;
  /** Relative humidity percentage (0–100). Null when unavailable. */
  humidityPct: number | null;
  /** Air temperature in Celsius. Null when unavailable. */
  temperatureC: number | null;
  /** Wind speed in metres per second. Null when unavailable. */
  windSpeedMps: number | null;
  /** True when the result came from the in-memory cache. */
  cached: boolean;
  /** True when the upstream provider was unavailable and no data is present. */
  unavailable: boolean;
  source: "OpenWeatherMap";
}

// ---------------------------------------------------------------------------
// Provider interface (dependency-injected)
// ---------------------------------------------------------------------------

/**
 * Raw weather data fetched from the upstream API.
 * All numeric fields are already in SI units.
 */
export interface RawWeatherData {
  /** UTC unix timestamp (seconds). */
  timestampUnix: number;
  cloudCoverPct: number;
  visibilityMeters: number | null;
  humidityPct: number;
  temperatureC: number;
  windSpeedMps: number;
}

export interface WeatherProvider {
  /**
   * Fetch current conditions for the given location.
   *
   * @throws  WeatherProviderError when the upstream call fails.
   */
  fetchConditions(lat: number, lon: number): Promise<RawWeatherData>;
}

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export type WeatherProviderErrorKind =
  | "missing_api_key"
  | "upstream_http"
  | "parse"
  | "timeout";

export class WeatherProviderError extends Error {
  override name = "WeatherProviderError";
  constructor(
    public readonly kind: WeatherProviderErrorKind,
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
  }
}
