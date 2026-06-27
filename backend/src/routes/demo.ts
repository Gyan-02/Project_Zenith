import { Router } from "express";
import {
  loadDemoConditions,
  loadDemoEvents,
  loadDemoPasses,
  loadDemoSkyState,
} from "../demo/demo.loader.js";

type DemoPayload<T> = T & {
  demo?: true;
  provenance?: Array<{ source: string; fetchedAt: string }>;
};

function markDemo<T>(payload: T): DemoPayload<T> {
  if (Array.isArray(payload)) {
    return payload.map((item) => ({
      ...item,
      source: typeof item === "object" && item !== null && "source" in item ? item.source : "Project Zenith demo data",
    })) as DemoPayload<T>;
  }

  if (typeof payload === "object" && payload !== null) {
    const current = payload as Record<string, unknown>;
    return {
      ...current,
      demo: true,
      provenance: Array.isArray(current.provenance)
        ? current.provenance
        : [{ source: "Project Zenith demo data", fetchedAt: new Date(0).toISOString() }],
    } as DemoPayload<T>;
  }

  return payload as DemoPayload<T>;
}

export function createDemoRouter(): Router {
  const router = Router();

  router.use((_request, response, next) => {
    response.setHeader("Cache-Control", "no-store");
    next();
  });

  router.get("/sky-state", (_request, response) => {
    response.json(markDemo(loadDemoSkyState()));
  });

  router.get("/conditions", (_request, response) => {
    response.json(markDemo(loadDemoConditions()));
  });

  router.get("/events", (_request, response) => {
    response.json({
      demo: true,
      provenance: [{ source: "Project Zenith demo data", fetchedAt: new Date(0).toISOString() }],
      events: markDemo(loadDemoEvents()),
    });
  });

  router.get("/passes", (_request, response) => {
    response.json(markDemo(loadDemoPasses()));
  });

  return router;
}
