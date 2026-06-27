/**
 * GYA-25 – Satellite Pass Prediction API router.
 *
 * Wraps the existing pass-prediction engine in an Express route factory.
 * Do NOT mount this in app.ts yet — wiring is deferred.
 *
 * Mounting note (for future GYA-36 ticket):
 *   import { createPassesRouter } from "./routes/passes.js";
 *   app.use("/api/passes", createPassesRouter());
 *
 * Endpoint shape:
 *   GET /api/passes
 *     ?lat=25.61
 *     &lon=85.14
 *     &elevationM=53          (optional)
 *     &start=2026-06-25T00:00:00Z
 *     &end=2026-06-26T00:00:00Z
 *     &minElevationDeg=10    (optional, default 10)
 */

import { Router, type Request, type Response } from "express";
import { z } from "zod";
import type { PassPrediction, PassPredictionQuery } from "../predictions/passes/index.js";
import { CelestrakProvider, CelestrakUpstreamError, type TleRecord } from "../providers/celestrak/index.js";

// ---------------------------------------------------------------------------
// Dependency-injection interface
// (allows tests to supply a fake predictor without live CelesTrak calls)
// ---------------------------------------------------------------------------

export interface PassesDependencies {
  /**
   * Given a query, returns a map of objectId → PassPrediction[].
   * In production this will call CelesTrak + SGP4; in tests it is mocked.
   */
  predict(query: PassPredictionQuery): Promise<Map<string, PassPrediction[]>>;
}

// ---------------------------------------------------------------------------
// Default production predictor (lazy-loaded to avoid import cost in tests)
// ---------------------------------------------------------------------------

const ACTIVE_TLE_ENDPOINT = "https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=TLE";
const STATIONS_TLE_ENDPOINT = "https://celestrak.org/NORAD/elements/gp.php?GROUP=stations&FORMAT=TLE";
const PASS_TLE_TIMEOUT_MS = Number(process.env.CELESTRAK_TIMEOUT_MS ?? 20_000);

const activeCatalogProvider = new CelestrakProvider({ endpoint: ACTIVE_TLE_ENDPOINT, timeoutMs: PASS_TLE_TIMEOUT_MS });
const stationsCatalogProvider = new CelestrakProvider({ endpoint: STATIONS_TLE_ENDPOINT, timeoutMs: PASS_TLE_TIMEOUT_MS });

async function getLivePassCatalog(): Promise<{ records: TleRecord[]; source: string; fetchedAt: string; stale: boolean }> {
  try {
    const catalog = await stationsCatalogProvider.getCatalog();
    return {
      records: catalog.records,
      source: catalog.stale ? "CelesTrak stations TLE stale cache" : "CelesTrak stations TLE catalog",
      fetchedAt: catalog.fetchedAt,
      stale: catalog.stale,
    };
  } catch (error) {
    if (!(error instanceof CelestrakUpstreamError)) throw error;
    const fallbackCatalog = await activeCatalogProvider.getCatalog();
    return {
      records: fallbackCatalog.records,
      source: fallbackCatalog.stale
        ? "CelesTrak active TLE stale cache"
        : "CelesTrak active TLE catalog fallback",
      fetchedAt: fallbackCatalog.fetchedAt,
      stale: fallbackCatalog.stale,
    };
  }
}

async function defaultPredict(query: PassPredictionQuery): Promise<Map<string, PassPrediction[]>> {
  // Dynamic import keeps the test bundle lightweight
  const { predictPasses } = await import("../predictions/passes/index.js");
  const catalog = await getLivePassCatalog();
  return predictPasses(catalog.records, query);
}

// ---------------------------------------------------------------------------
// Validation schema
// ---------------------------------------------------------------------------

const PassesQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
  elevationM: z.coerce.number().finite().optional(),
  start: z.string().datetime({ offset: true }),
  end: z.string().datetime({ offset: true }),
  minElevationDeg: z.coerce.number().min(0).max(90).optional(),
});

// ---------------------------------------------------------------------------
// Router factory
// ---------------------------------------------------------------------------

export function createPassesRouter(deps?: PassesDependencies): Router {
  const predict = deps?.predict ?? defaultPredict;
  const router = Router();

  router.get("/", async (req: Request, res: Response) => {
    const parsed = PassesQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({
        error: "Invalid passes query",
        issues: parsed.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      });
      return;
    }

    const { lat, lon, elevationM, start, end, minElevationDeg } = parsed.data;

    // Business-rule validation: start must be before end
    if (new Date(start) >= new Date(end)) {
      res.status(400).json({ error: "start must be before end" });
      return;
    }

    const query: PassPredictionQuery = {
      observer: { lat, lon, ...(elevationM !== undefined ? { elevationM } : {}) },
      startTimeUtc: start,
      windowHours: Math.min(
        72,
        (new Date(end).getTime() - new Date(start).getTime()) / 3_600_000,
      ),
      minimumElevationDeg: minElevationDeg ?? 10,
    };

    try {
      const passMap = await predict(query);

      // Flatten all passes from all objects into a single sorted array
      const passes: PassPrediction[] = [];
      for (const arr of passMap.values()) {
        passes.push(...arr);
      }
      passes.sort((a, b) => a.riseTimeUtc.localeCompare(b.riseTimeUtc));

      res.json({
        location: { lat, lon, ...(elevationM !== undefined ? { elevationM } : {}) },
        startUtc: start,
        endUtc: end,
        passes,
        provenance: [{ source: "CelesTrak TLE + satellite.js SGP4", fetchedAt: new Date().toISOString() }],
      });
    } catch (err) {
      res.status(503).json({
        error: "Live pass prediction temporarily unavailable",
        detail: err instanceof Error ? err.message : "Unknown error",
      });
    }
  });

  return router;
}
