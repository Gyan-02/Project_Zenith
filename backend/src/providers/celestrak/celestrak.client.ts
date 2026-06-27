import type { SkyObject } from "../../contracts.js";
import { CelestrakUpstreamError } from "./celestrak.errors.js";
import type {
  CatalogResult,
  ObserverLocation,
  SatelliteQueryOptions,
  SatelliteResult,
} from "./celestrak.types.js";
import { propagateTle } from "./sgp4.js";
import { parseTleCatalog } from "./tle.parser.js";

const ACTIVE_TLE_URL = "https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=TLE";

export interface CelestrakProviderOptions {
  endpoint?: string;
  fetchImpl?: typeof fetch;
  now?: () => number;
  cacheTtlMs?: number;
  timeoutMs?: number;
}

export class CelestrakProvider {
  private readonly endpoint: string;
  private readonly fetchImpl: typeof fetch;
  private readonly now: () => number;
  private readonly cacheTtlMs: number;
  private readonly timeoutMs: number;
  private cache?: CatalogResult;
  private inFlight?: Promise<CatalogResult>;

  constructor(options: CelestrakProviderOptions = {}) {
    this.endpoint = options.endpoint ?? ACTIVE_TLE_URL;
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.now = options.now ?? Date.now;
    this.cacheTtlMs = options.cacheTtlMs ?? 2 * 60 * 60 * 1_000;
    this.timeoutMs = options.timeoutMs ?? 8_000;
  }

  async getCatalog(): Promise<CatalogResult> {
    const now = this.now();
    if (this.cache && now - Date.parse(this.cache.fetchedAt) < this.cacheTtlMs) {
      return { ...this.cache, stale: false };
    }
    if (this.inFlight) return this.inFlight;

    this.inFlight = this.fetchCatalog(now).finally(() => {
      this.inFlight = undefined;
    });
    return this.inFlight;
  }

  private async fetchCatalog(now: number): Promise<CatalogResult> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await this.fetchImpl(this.endpoint, { signal: controller.signal });
      if (!response.ok) throw new CelestrakUpstreamError(`CelesTrak returned HTTP ${response.status}`);
      const records = parseTleCatalog(await response.text());
      this.cache = { records, stale: false, fetchedAt: new Date(now).toISOString() };
      return this.cache;
    } catch (error) {
      if (this.cache) return { ...this.cache, stale: true };
      if (error instanceof CelestrakUpstreamError) throw error;
      throw new CelestrakUpstreamError(error instanceof Error ? error.message : "CelesTrak request failed");
    } finally {
      clearTimeout(timeout);
    }
  }

  async getSatellites(
    observer: ObserverLocation,
    at: Date,
    options: SatelliteQueryOptions = {},
  ): Promise<SatelliteResult> {
    const catalog = await this.getCatalog();
    const objects: SkyObject[] = [];
    const limit = options.limit ?? catalog.records.length;

    for (const record of catalog.records.slice(0, limit)) {
      try {
        objects.push(propagateTle(record, observer, at, { staleTle: catalog.stale }));
      } catch {
        // One corrupt/decayed TLE must not discard the complete catalog.
      }
    }

    return { objects, stale: catalog.stale, fetchedAt: catalog.fetchedAt };
  }
}
