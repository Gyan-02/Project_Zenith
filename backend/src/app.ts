import cors from "cors";
import express, { type Express } from "express";
import { createConditionsRouter } from "./conditions/conditions.router.js";
import { createCulturalNamesRouter } from "./cultural-names/cultural-names.router.js";
import { createEducationalReferenceRouter } from "./educational-reference/reference.router.js";
import { config } from "./config.js";
import { createDemoRouter } from "./routes/demo.js";
import { createEventsRouter } from "./routes/events.js";
import { createNarrateRouter, type NarrationDependencies } from "./routes/narrate.js";
import { createPassesRouter } from "./routes/passes.js";
import { createSkyStateRouter } from "./routes/skyState.js";

export function createApp(narrationDependencies?: NarrationDependencies): Express {
  const app = express();
  app.disable("x-powered-by");
  app.use(cors({ origin: config.frontendOrigin }));
  app.use(express.json({ limit: "64kb" }));

  app.get("/", (_request, response) => {
    response.json({
      service: "zenith-backend",
      status: "ok",
      frontend: config.frontendOrigin,
      routes: {
        health: "/health",
        skyState: "/sky-state",
        narrate: "/api/narrate",
        conditions: "/api/conditions",
        events: "/api/events",
        passes: "/api/passes",
        demo: "/api/demo",
      },
    });
  });

  app.get("/health", (_request, response) => {
    response.json({ status: "ok", service: "zenith-backend" });
  });
  app.use("/api/conditions", createConditionsRouter());
  app.use("/api/cultural-names", createCulturalNamesRouter());
  app.use("/api/demo", createDemoRouter());
  app.use("/api/reference", createEducationalReferenceRouter());
  app.use("/api/events", createEventsRouter());
  app.use("/api/passes", createPassesRouter());
  app.use("/sky-state", createSkyStateRouter());
  app.use("/api/narrate", createNarrateRouter(narrationDependencies));

  return app;
}
