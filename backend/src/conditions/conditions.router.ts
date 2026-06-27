/**
 * GYA-11 – Observing Conditions Express router.
 *
 * Exported as a factory. Do NOT mount this in app.ts yet —
 * wiring is deferred to a later GYA ticket.
 *
 * When mounted (e.g. at /api/conditions):
 *
 *   GET /api/conditions?lat=51.5&lon=-0.1
 *   GET /api/conditions?lat=51.5&lon=-0.1&time=2026-08-12T22:00:00Z
 *
 * Returns 400 for invalid lat/lon.
 * Returns 503 only when the provider fails AND no graceful fallback is
 * available (in practice the service always returns an "unavailable" result
 * rather than throwing, so 503 is a last-resort safety net).
 *
 * Mounting note (for future GYA-36 / API wiring ticket):
 *   import { createConditionsRouter } from "./conditions/conditions.router.js";
 *   app.use("/api/conditions", createConditionsRouter());
 */

import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { ConditionsService } from "./conditions.service.js";

// ---------------------------------------------------------------------------
// Query schema
// ---------------------------------------------------------------------------

const ConditionsQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
  time: z.string().datetime({ offset: true }).optional(),
});

// ---------------------------------------------------------------------------
// Router factory
// ---------------------------------------------------------------------------

/**
 * @param service - Optionally inject a pre-constructed service (for testing).
 */
export function createConditionsRouter(service?: ConditionsService): Router {
  const svc = service ?? new ConditionsService();
  const router = Router();

  router.get("/", async (req: Request, res: Response) => {
    const parsed = ConditionsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({
        error: "Invalid observing-conditions query",
        issues: parsed.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      });
      return;
    }

    try {
      const result = await svc.getConditions({
        lat: parsed.data.lat,
        lon: parsed.data.lon,
        timeUtc: parsed.data.time,
      });
      res.json(result);
    } catch (err) {
      // The service is designed to degrade gracefully rather than throw,
      // but if something unexpected slips through we return 503.
      res.status(503).json({
        error: "Observing conditions temporarily unavailable",
        detail: err instanceof Error ? err.message : "Unknown error",
      });
    }
  });

  return router;
}
