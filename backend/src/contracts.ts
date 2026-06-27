import { z } from "zod";

export const LocationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  elevationM: z.number().finite().optional(),
  label: z.string().min(1).optional(),
});

export const ViewerContextSchema = z.object({
  query: z.string().trim().min(1, "query is required").max(2_000),
  location: LocationSchema,
  timeIso: z.string().datetime({ offset: true }),
  selectedObjectId: z.string().min(1).optional(),
});

export const NarratorIntentSchema = z.enum([
  "sky_exploration",
  "object_search",
  "historical",
  "prediction",
  "education",
]);

export const IntentResultSchema = z.object({
  intent: NarratorIntentSchema,
  confidence: z.number().min(0).max(1),
  targetName: z.string().nullable(),
  delegated: z.boolean().default(false),
});

export const SkyObjectKindSchema = z.enum([
  "planet",
  "satellite",
  "iss",
  "moon",
  "star",
  "constellation",
  "meteor_shower",
]);

export const CelestialPositionSchema = z.object({
  ra: z.number().finite(),
  dec: z.number().min(-90).max(90),
  altDeg: z.number().min(-90).max(90).optional(),
  azDeg: z.number().min(0).max(360).optional(),
  distanceKm: z.number().nonnegative().optional(),
});

export const SkyObjectSchema = z.object({
  id: z.string(),
  kind: SkyObjectKindSchema,
  name: z.string(),
  position: CelestialPositionSchema,
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const ConstellationLineSchema = z.object({
  id: z.string(),
  name: z.string(),
  points: z.array(z.object({ ra: z.number().finite(), dec: z.number().min(-90).max(90) })).min(2),
});

export const SkyStateSchema = z.object({
  location: LocationSchema,
  timestampUtc: z.string().datetime({ offset: true }),
  planets: z.array(SkyObjectSchema),
  stars: z.array(SkyObjectSchema).optional(),
  satellites: z.array(SkyObjectSchema),
  iss: SkyObjectSchema.nullable(),
  moon: SkyObjectSchema,
  constellations: z.array(ConstellationLineSchema),
  meteorShowers: z.array(SkyObjectSchema),
  provenance: z.array(z.object({ source: z.string(), fetchedAt: z.string().datetime({ offset: true }) })).default([]),
});

export const NavigationTargetSchema = z.object({
  kind: z.enum(["planet", "satellite", "star", "constellation", "moon", "iss"]),
  id: z.string(),
  label: z.string(),
});

export const CitationSchema = z.object({
  title: z.string(),
  source: z.string(),
});

export const NarrationResponseSchema = z.object({
  text: z.string().min(1),
  navigationTarget: NavigationTargetSchema.nullable().optional(),
  citations: z.array(CitationSchema).optional(),
});

export type ViewerContext = z.infer<typeof ViewerContextSchema>;
export type NarratorIntent = z.infer<typeof NarratorIntentSchema>;
export type IntentResult = z.infer<typeof IntentResultSchema>;
export type SkyObject = z.infer<typeof SkyObjectSchema>;
export type SkyObjectKind = z.infer<typeof SkyObjectKindSchema>;
export type ConstellationLine = z.infer<typeof ConstellationLineSchema>;
export type SkyState = z.infer<typeof SkyStateSchema>;
export type NarrationResponse = z.infer<typeof NarrationResponseSchema>;
