import { Router } from "express";
import { z } from "zod";
import {
  NarrationResponseSchema,
  ViewerContextSchema,
  type IntentResult,
  type NarrationResponse,
  type SkyState,
  type ViewerContext,
} from "../contracts.js";
import { GeminiUpstreamError, KnowledgeBaseError } from "../errors.js";
import { parseIntent } from "../intent/parseIntent.js";
import { narrate } from "../narrator/narrate.js";
import { getSkyState } from "../services/skyState.js";

export interface NarrationDependencies {
  getSkyState(context: Pick<ViewerContext, "location" | "timeIso">): Promise<SkyState>;
  parseIntent(query: string, context: { selectedObjectId?: string }): Promise<IntentResult>;
  narrate(input: {
    query: string;
    intent: IntentResult;
    skyState: SkyState;
    selectedObjectId?: string;
  }): Promise<NarrationResponse>;
}

const defaultDependencies: NarrationDependencies = { getSkyState, parseIntent, narrate };

export function createNarrateRouter(dependencies: NarrationDependencies = defaultDependencies): Router {
  const router = Router();

  router.post("/", async (request, response) => {
    const parsed = ViewerContextSchema.safeParse(request.body);
    if (!parsed.success) {
      response.status(400).json({
        error: "Invalid narration request",
        issues: parsed.error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
      });
      return;
    }

    const context = parsed.data;
    try {
      const skyState = await dependencies.getSkyState(context);
      const intent = await dependencies.parseIntent(context.query, {
        ...(context.selectedObjectId ? { selectedObjectId: context.selectedObjectId } : {}),
      });
      const result = await dependencies.narrate({
        query: context.query,
        intent,
        skyState,
        ...(context.selectedObjectId ? { selectedObjectId: context.selectedObjectId } : {}),
      });
      response.status(200).json(NarrationResponseSchema.parse(result));
    } catch (error) {
      if (error instanceof GeminiUpstreamError) {
        response.status(502).json({ error: "Narrator provider unavailable" });
        return;
      }
      if (error instanceof KnowledgeBaseError) {
        response.status(503).json({ error: "Narrator knowledge base unavailable" });
        return;
      }
      if (error instanceof z.ZodError) {
        response.status(502).json({ error: "Narrator returned an invalid response" });
        return;
      }
      response.status(500).json({ error: "Unexpected narrator failure" });
    }
  });

  return router;
}
