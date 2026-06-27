import {
  degreesToRadians,
  ecfToEci,
  ecfToLookAngles,
  geodeticToEcf,
  gstime,
  radiansToDegrees,
} from "satellite.js";
import type { SkyObject } from "../../contracts.js";
import { CelestrakProvider } from "../celestrak/celestrak.client.js";
import type { ObserverLocation } from "../celestrak/celestrak.types.js";
import { IssParseError, IssUpstreamError } from "./iss.errors.js";

const OPEN_NOTIFY_URL = "http://api.open-notify.org/iss-now.json";
const ISS_TLE_URL = "https://celestrak.org/NORAD/elements/gp.php?CATNR=25544&FORMAT=TLE";

export type IssFallback = (observer: ObserverLocation, at: Date) => Promise<SkyObject>;

export interface IssProviderOptions {
  endpoint?: string;
  fetchImpl?: typeof fetch;
  now?: () => number;
  timeoutMs?: number;
  assumedAltitudeKm?: number;
  fallback?: IssFallback;
}

function normalizeDegrees(value: number): number {
  return ((value % 360) + 360) % 360;
}

function parseNumber(value: unknown, label: string): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) throw new IssParseError(`Invalid ${label} in Open Notify response`);
  return parsed;
}

export class IssProvider {
  private readonly endpoint: string;
  private readonly fetchImpl: typeof fetch;
  private readonly now: () => number;
  private readonly timeoutMs: number;
  private readonly assumedAltitudeKm: number;
  private readonly fallback: IssFallback;

  constructor(options: IssProviderOptions = {}) {
    this.endpoint = options.endpoint ?? OPEN_NOTIFY_URL;
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.now = options.now ?? Date.now;
    this.timeoutMs = options.timeoutMs ?? 1_500;
    this.assumedAltitudeKm = options.assumedAltitudeKm ?? 420;
    this.fallback = options.fallback ?? this.createDefaultFallback();
  }

  private createDefaultFallback(): IssFallback {
    const provider = new CelestrakProvider({
      endpoint: ISS_TLE_URL,
      fetchImpl: this.fetchImpl,
      timeoutMs: this.timeoutMs,
    });
    return async (observer, at) => {
      const result = await provider.getSatellites(observer, at, { limit: 1 });
      const satellite = result.objects[0];
      if (!satellite) throw new IssUpstreamError("ISS TLE could not be propagated");
      return {
        ...satellite,
        id: "iss",
        kind: "iss",
        name: "International Space Station",
        metadata: {
          ...satellite.metadata,
          source: "CelesTrak ISS TLE + satellite.js SGP4 fallback",
          fallback: true,
        },
      };
    };
  }

  async getIss(observer: ObserverLocation, at: Date): Promise<SkyObject> {
    // Open Notify is a real-time-only source; historical/future queries use SGP4.
    if (Math.abs(this.now() - at.getTime()) > 2 * 60 * 1_000) {
      return this.fallback(observer, at);
    }

    try {
      return await this.fetchLive(observer);
    } catch (error) {
      try {
        return await this.fallback(observer, at);
      } catch (fallbackError) {
        throw new IssUpstreamError(
          `Open Notify failed (${error instanceof Error ? error.message : "unknown"}); SGP4 fallback failed (${fallbackError instanceof Error ? fallbackError.message : "unknown"})`,
        );
      }
    }
  }

  private async fetchLive(observer: ObserverLocation): Promise<SkyObject> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await this.fetchImpl(this.endpoint, { signal: controller.signal });
      if (!response.ok) throw new IssUpstreamError(`Open Notify returned HTTP ${response.status}`);
      const body = (await response.json()) as Record<string, unknown>;
      if (body.message !== "success" || typeof body.iss_position !== "object" || !body.iss_position) {
        throw new IssParseError("Open Notify response is missing iss_position");
      }

      const position = body.iss_position as Record<string, unknown>;
      const latitude = parseNumber(position.latitude, "latitude");
      const longitude = parseNumber(position.longitude, "longitude");
      const timestamp = parseNumber(body.timestamp, "timestamp");
      if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        throw new IssParseError("Open Notify coordinates are outside valid ranges");
      }

      const observedAt = new Date(timestamp * 1_000);
      const gmst = gstime(observedAt);
      const ecf = geodeticToEcf({
        longitude: degreesToRadians(longitude),
        latitude: degreesToRadians(latitude),
        height: this.assumedAltitudeKm,
      });
      const eci = ecfToEci(ecf, gmst);
      const radius = Math.sqrt(eci.x ** 2 + eci.y ** 2 + eci.z ** 2);
      const look = ecfToLookAngles(
        {
          longitude: degreesToRadians(observer.lon),
          latitude: degreesToRadians(observer.lat),
          height: (observer.elevationM ?? 0) / 1_000,
        },
        ecf,
      );

      return {
        id: "iss",
        kind: "iss",
        name: "International Space Station",
        position: {
          ra: normalizeDegrees(radiansToDegrees(Math.atan2(eci.y, eci.x))),
          dec: radiansToDegrees(Math.asin(eci.z / radius)),
          altDeg: radiansToDegrees(look.elevation),
          azDeg: normalizeDegrees(radiansToDegrees(look.azimuth)),
          distanceKm: look.rangeSat,
        },
        metadata: {
          source: "Open Notify ISS position",
          observedAt: observedAt.toISOString(),
          subpoint: { latitude, longitude },
          assumedAltitudeKm: this.assumedAltitudeKm,
          altitudeIsAssumed: true,
        },
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}
