import { Router } from "express";
import { z } from "zod";
import { SkyStateSchema, type SkyState } from "../contracts.js";
import { getSkyState } from "../services/skyState.js";

const SkyStateQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
  elevationM: z.coerce.number().finite().optional(),
  time: z.string().datetime({ offset: true }).optional(),
});

export type SkyStateLoader = (context: {
  location: { lat: number; lon: number; elevationM?: number };
  timeIso: string;
}) => Promise<SkyState>;

export function createSkyStateRouter(loadSkyState: SkyStateLoader = getSkyState): Router {
  const router = Router();

  router.get("/", async (request, response) => {
    const parsed = SkyStateQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      response.status(400).json({
        error: "Invalid sky-state query",
        issues: parsed.error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
      });
      return;
    }

    try {
      const query = parsed.data;
      const state = await loadSkyState({
        location: {
          lat: query.lat,
          lon: query.lon,
          ...(query.elevationM !== undefined ? { elevationM: query.elevationM } : {}),
        },
        timeIso: query.time ?? new Date().toISOString(),
      });
      response.json(SkyStateSchema.parse(state));
    } catch (error) {
      response.status(503).json({
        error: "Sky-state is temporarily unavailable",
        detail: error instanceof Error ? error.message : "Unknown provider error",
      });
    }
  });

  return router;
}
