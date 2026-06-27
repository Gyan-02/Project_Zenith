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

function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) return true;

  try {
    const parsed = new URL(origin);
    if (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") return true;
    if (parsed.protocol === "https:" && parsed.hostname.endsWith(".vercel.app")) return true;

    return config.frontendOrigins.includes(parsed.origin);
  } catch {
    return config.frontendOrigins.includes(origin.replace(/\/+$/, ""));
  }
}

export function createApp(narrationDependencies?: NarrationDependencies): Express {
  const app = express();
  app.disable("x-powered-by");
  app.use(cors({
    origin(origin, callback) {
      callback(null, isAllowedOrigin(origin));
    },
  }));
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
