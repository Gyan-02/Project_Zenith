import { z } from "zod";

export const ViewerContextSchema = z.object({
  query: z.string().trim().min(1),
  location: z.object({
    lat: z.number().min(-90).max(90),
    lon: z.number().min(-180).max(180),
    label: z.string().optional(),
  }),
  timeIso: z.string().datetime({ offset: true }),
  selectedObjectId: z.string().optional(),
});

export const NavigationTargetSchema = z.object({
  kind: z.enum(["planet", "satellite", "star", "constellation", "moon", "iss"]),
  id: z.string(),
  label: z.string(),
});

export const NarrationResponseSchema = z.object({
  text: z.string().min(1),
  navigationTarget: NavigationTargetSchema.nullable().optional(),
  citations: z.array(z.object({ title: z.string(), source: z.string() })).optional(),
});

export type ViewerContext = Omit<z.infer<typeof ViewerContextSchema>, "query">;
export type NavigationTarget = z.infer<typeof NavigationTargetSchema>;
export type NarrationResponse = z.infer<typeof NarrationResponseSchema>;
