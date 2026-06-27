import { Router } from "express";
import { getDataset, getNamesForObject, getTraditions } from "./cultural-names.service.js";

const CACHE_CONTROL = "public, max-age=86400";

export function createCulturalNamesRouter(): Router {
  const router = Router();

  router.get("/", (_request, response) => {
    response.set("Cache-Control", CACHE_CONTROL);
    response.json({ traditions: getTraditions(), objects: getDataset() });
  });

  router.get("/:objectId", (request, response) => {
    const entry = getNamesForObject(request.params.objectId);
    if (!entry) {
      response.status(404).json({ error: `No cultural names found for '${request.params.objectId}'` });
      return;
    }
    response.set("Cache-Control", CACHE_CONTROL);
    response.json(entry);
  });

  return router;
}
