/**
 * GYA-12 – Educational Reference Express router.
 *
 * Exported as a factory function so the caller controls mounting.
 * Do NOT mount this in app.ts yet — wiring is deferred to a later GYA ticket.
 *
 * Routes (once mounted):
 *   GET /reference          → listReferences({ kind? })
 *   GET /reference/search   → searchReferences(q, limit?)
 *   GET /reference/:id      → getReferenceByObjectId(id)
 */

import { Router, type Request, type Response } from "express";
import { EducationalReferenceService } from "./reference.service.js";
import type { ReferenceObjectKind } from "./reference.types.js";

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

const VALID_KINDS: ReadonlySet<string> = new Set([
  "star",
  "planet",
  "moon",
  "satellite",
  "constellation",
  "cluster",
  "sun",
]);

function parsePositiveInt(value: unknown, fallback: number): number {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}

// ---------------------------------------------------------------------------
// Router factory
// ---------------------------------------------------------------------------

/**
 * Create and return the educational-reference Express router.
 *
 * @param service - Optionally inject a pre-constructed service (for testing).
 */
export function createEducationalReferenceRouter(
  service?: EducationalReferenceService,
): Router {
  const svc = service ?? new EducationalReferenceService();
  const router = Router();

  // GET /reference?kind=star
  router.get("/", (_req: Request, res: Response) => {
    const { kind } = _req.query;
    const options =
      typeof kind === "string" && VALID_KINDS.has(kind)
        ? { kind: kind as ReferenceObjectKind }
        : {};
    res.json(svc.listReferences(options));
  });

  // GET /reference/search?q=brightest+star&limit=5
  router.get("/search", (req: Request, res: Response) => {
    const { q, limit } = req.query;
    if (typeof q !== "string" || !q.trim()) {
      res.status(400).json({ error: "Query parameter 'q' is required" });
      return;
    }
    const results = svc.searchReferences(q, parsePositiveInt(limit, 10));
    res.json(results);
  });

  // GET /reference/:id
  router.get("/:id", (req: Request, res: Response) => {
    const id = req.params.id;
    if (typeof id !== "string" || !id) {
      res.status(400).json({ error: "Path parameter 'id' is required" });
      return;
    }
    const result = svc.getReferenceByObjectId(id);
    if (!result.found) {
      res.status(404).json(result);
      return;
    }
    res.json(result);
  });

  return router;
}
