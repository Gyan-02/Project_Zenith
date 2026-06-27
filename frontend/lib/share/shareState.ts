/**
 * GYA-18 – ShareSkyState type definition.
 *
 * Defines the compact, stable state shape that is serialised into / deserialised
 * from shareable URL query parameters.  This type intentionally mirrors the
 * relevant subset of the sky-state but is completely independent of it so that
 * share-link URLs remain stable even when the internal sky-state shape evolves.
 */

export interface ShareSkyState {
  /** Observer location. */
  location?: {
    /** Decimal degrees (positive = North). */
    lat: number;
    /** Decimal degrees (positive = East). */
    lon: number;
    /** Optional human-readable place label. */
    label?: string;
  };
  /** ISO-8601 UTC timestamp. */
  timeUtc?: string;
  /** objectId of the selected sky object. */
  selectedObjectId?: string;
  /** Visibility layer toggles. */
  layers?: {
    planets?: boolean;
    satellites?: boolean;
    iss?: boolean;
    constellations?: boolean;
    meteorShowers?: boolean;
  };
  /** Cultural tradition identifier (e.g. "greek", "maori"). */
  culturalTraditionId?: string;
  /** Free-text narrator query to pre-fill. */
  narratorQuery?: string;
}

// ---------------------------------------------------------------------------
// Query-parameter key constants — kept as a single source of truth so the
// encoder and decoder are always in sync.
// ---------------------------------------------------------------------------

export const PARAM_LAT = "lat";
export const PARAM_LON = "lon";
export const PARAM_LABEL = "label";
export const PARAM_TIME = "t";
export const PARAM_OBJECT = "obj";
export const PARAM_LAYERS = "layers";
export const PARAM_TRADITION = "tradition";
export const PARAM_QUERY = "q";

/** Layer names that can appear in the compact layers param. */
export const LAYER_KEYS = [
  "planets",
  "satellites",
  "iss",
  "constellations",
  "meteorShowers",
] as const;

export type LayerKey = (typeof LAYER_KEYS)[number];
