/**
 * GYA-24 – Celestial Events API router.
 *
 * Wraps the existing predictCelestialEvents engine in an Express route factory.
 * Do NOT mount this in app.ts yet — wiring is deferred.
 *
 * Mounting note (for future GYA-36 ticket):
 *   import { createEventsRouter } from "./routes/events.js";
 *   app.use("/api/events", createEventsRouter());
 *
 * Endpoint shape:
 *   GET /api/events
 *     ?lat=25.61
 *     &lon=85.14
 *     &start=2026-08-01T00:00:00Z
 *     &end=2026-08-31T23:59:59Z
 *     &type=meteor_shower        (may appear multiple times)
 */

import { Router, type Request, type Response } from "express";
import { z } from "zod";
import {
  predictCelestialEvents,
  CelestialEventQueryError,
} from "../predictions/events/index.js";
import type { CelestialEventType } from "../predictions/events/index.js";

// ---------------------------------------------------------------------------
// Validation schema
// ---------------------------------------------------------------------------

const VALID_EVENT_TYPES: CelestialEventType[] = [
  "meteor_shower",
  "conjunction",
  "eclipse",
  "visibility_window",
];

const EventsQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
  start: z.string().datetime({ offset: true }),
  end: z.string().datetime({ offset: true }),
  // `type` may appear once (string) or multiple times (array of strings)
  type: z
    .union([z.string(), z.array(z.string())])
    .transform((v) => (Array.isArray(v) ? v : [v]))
    .refine(
      (arr) => arr.every((t) => (VALID_EVENT_TYPES as string[]).includes(t)),
      { message: `type must be one of: ${VALID_EVENT_TYPES.join(", ")}` },
    )
    .optional(),
});

// ---------------------------------------------------------------------------
// Router factory
// ---------------------------------------------------------------------------

export function createEventsRouter(): Router {
  const router = Router();

  router.get("/", (req: Request, res: Response) => {
    const parsed = EventsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({
        error: "Invalid events query",
        issues: parsed.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      });
      return;
    }

    const { lat, lon, start, end, type } = parsed.data;

    try {
      const events = predictCelestialEvents({
        location: { lat, lon },
        startUtc: start,
        endUtc: end,
        types: type as CelestialEventType[] | undefined,
      });
      res.json(events);
    } catch (err) {
      if (err instanceof CelestialEventQueryError) {
        res.status(400).json({ error: err.message });
        return;
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  return router;
}
