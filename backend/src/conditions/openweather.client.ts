/**
 * GYA-11 – OpenWeatherMap current-conditions client.
 *
 * Uses the OpenWeatherMap "Current weather data" endpoint (free tier).
 * API key is read from OPENWEATHER_API_KEY environment variable.
 *
 * The client is dependency-injectable (accepts a custom `fetch` and optional
 * `apiKey` override) so tests never make live network calls.
 *
 * If the API key is missing the client throws a WeatherProviderError with
 * kind "missing_api_key" so the service can degrade gracefully.
 */

import type { RawWeatherData, WeatherProvider } from "./conditions.types.js";
import { WeatherProviderError } from "./conditions.types.js";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const OWM_BASE_URL = "https://api.openweathermap.org/data/2.5/weather";
const DEFAULT_TIMEOUT_MS = 5_000;

// ---------------------------------------------------------------------------
// Response shape (subset of OWM v2.5 JSON)
// ---------------------------------------------------------------------------

interface OwmResponse {
  dt?: number;
  clouds?: { all?: number };
  visibility?: number;
  main?: {
    humidity?: number;
    temp?: number;
  };
  wind?: { speed?: number };
}

// ---------------------------------------------------------------------------
// Client options
// ---------------------------------------------------------------------------

export interface OpenWeatherClientOptions {
  /** Override the API key (useful in tests). */
  apiKey?: string;
  /** Inject a custom fetch implementation (for tests). */
  fetchImpl?: typeof fetch;
  /** Request timeout in ms. Default 5 000. */
  timeoutMs?: number;
}

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

export class OpenWeatherClient implements WeatherProvider {
  private readonly apiKey: string | undefined;
  private readonly fetchImpl: typeof fetch;
  private readonly timeoutMs: number;

  constructor(options: OpenWeatherClientOptions = {}) {
    this.apiKey =
      options.apiKey ?? process.env.OPENWEATHER_API_KEY;
    this.fetchImpl = options.fetchImpl ?? globalThis.fetch;
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  }

  async fetchConditions(lat: number, lon: number): Promise<RawWeatherData> {
    if (!this.apiKey) {
      throw new WeatherProviderError(
        "missing_api_key",
        "OPENWEATHER_API_KEY is not set — weather conditions are unavailable.",
      );
    }

    const url = new URL(OWM_BASE_URL);
    url.searchParams.set("lat", String(lat));
    url.searchParams.set("lon", String(lon));
    url.searchParams.set("units", "metric");
    url.searchParams.set("appid", this.apiKey);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    let response: Response;
    try {
      response = await this.fetchImpl(url.toString(), {
        signal: controller.signal,
      });
    } catch (err) {
      const isAbort =
        err instanceof Error && err.name === "AbortError";
      throw new WeatherProviderError(
        isAbort ? "timeout" : "upstream_http",
        isAbort
          ? `OpenWeatherMap request timed out after ${this.timeoutMs} ms`
          : `OpenWeatherMap fetch failed: ${String(err)}`,
        err,
      );
    } finally {
      clearTimeout(timer);
    }

    if (!response.ok) {
      throw new WeatherProviderError(
        "upstream_http",
        `OpenWeatherMap returned HTTP ${response.status} for (${lat}, ${lon})`,
      );
    }

    let body: OwmResponse;
    try {
      body = (await response.json()) as OwmResponse;
    } catch (err) {
      throw new WeatherProviderError(
        "parse",
        "Failed to parse OpenWeatherMap JSON response",
        err,
      );
    }

    return parseOwmResponse(body, lat, lon);
  }
}

// ---------------------------------------------------------------------------
// Parser
// ---------------------------------------------------------------------------

function parseOwmResponse(
  body: OwmResponse,
  lat: number,
  lon: number,
): RawWeatherData {
  const cloudCoverPct = body.clouds?.all;
  const humidityPct = body.main?.humidity;
  const temperatureC = body.main?.temp;
  const windSpeedMps = body.wind?.speed;

  if (
    typeof cloudCoverPct !== "number" ||
    typeof humidityPct !== "number" ||
    typeof temperatureC !== "number" ||
    typeof windSpeedMps !== "number"
  ) {
    throw new WeatherProviderError(
      "parse",
      `OpenWeatherMap response for (${lat}, ${lon}) is missing required fields`,
    );
  }

  return {
    timestampUnix: typeof body.dt === "number" ? body.dt : Math.floor(Date.now() / 1000),
    cloudCoverPct,
    visibilityMeters: typeof body.visibility === "number" ? body.visibility : null,
    humidityPct,
    temperatureC,
    windSpeedMps,
  };
}
