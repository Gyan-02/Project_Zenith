import { z } from "zod";

export const SkyObjectKindSchema = z.enum([
  "planet",
  "satellite",
  "iss",
  "moon",
  "star",
  "constellation",
  "meteor_shower",
]);

export const SkyObjectSchema = z.object({
  id: z.string(),
  kind: SkyObjectKindSchema,
  name: z.string(),
  position: z.object({
    ra: z.number(),
    dec: z.number(),
    altDeg: z.number().optional(),
    azDeg: z.number().optional(),
    distanceKm: z.number().optional(),
  }),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const SkyStateSchema = z.object({
  location: z.object({
    lat: z.number(),
    lon: z.number(),
    elevationM: z.number().optional(),
    label: z.string().optional(),
  }),
  timestampUtc: z.string().datetime({ offset: true }),
  planets: z.array(SkyObjectSchema),
  stars: z.array(SkyObjectSchema).optional(),
  satellites: z.array(SkyObjectSchema),
  iss: SkyObjectSchema.nullable(),
  moon: SkyObjectSchema,
  constellations: z.array(z.object({
    id: z.string(),
    name: z.string(),
    points: z.array(z.object({ ra: z.number(), dec: z.number() })).min(2),
  })),
  meteorShowers: z.array(SkyObjectSchema),
  provenance: z.array(z.object({ source: z.string(), fetchedAt: z.string() })).default([]),
});

export type SkyObjectKind = z.infer<typeof SkyObjectKindSchema>;
export type SkyObject = z.infer<typeof SkyObjectSchema>;
export type SkyState = z.infer<typeof SkyStateSchema>;

export function getSkyObjects(state: SkyState): SkyObject[] {
  return [
    ...state.planets,
    ...(state.stars ?? []),
    ...state.satellites,
    ...(state.iss ? [state.iss] : []),
    state.moon,
    ...state.meteorShowers,
  ];
}
