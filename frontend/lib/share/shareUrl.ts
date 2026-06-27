/**
 * GYA-18 – Share URL encoder / decoder.
 *
 * Compact, stable, round-trip-safe serialisation of ShareSkyState to/from
 * URL query parameters.  Never throws for malformed input.
 */

import {
  LAYER_KEYS,
  PARAM_LABEL,
  PARAM_LAT,
  PARAM_LAYERS,
  PARAM_LON,
  PARAM_OBJECT,
  PARAM_QUERY,
  PARAM_TIME,
  PARAM_TRADITION,
  type LayerKey,
  type ShareSkyState,
} from "./shareState";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Coordinate precision: 5 decimal places ≈ 1.1 m on the ground. */
const COORD_PRECISION = 5;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function roundCoord(value: number): number {
  const factor = Math.pow(10, COORD_PRECISION);
  return Math.round(value * factor) / factor;
}

function safeFinite(value: string | null | undefined): number | undefined {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function safeLat(value: string | null | undefined): number | undefined {
  const n = safeFinite(value);
  if (n === undefined) return undefined;
  return n >= -90 && n <= 90 ? n : undefined;
}

function safeLon(value: string | null | undefined): number | undefined {
  const n = safeFinite(value);
  if (n === undefined) return undefined;
  return n >= -180 && n <= 180 ? n : undefined;
}

function safeBoolean(value: string | null | undefined): boolean | undefined {
  if (value === "1" || value === "true") return true;
  if (value === "0" || value === "false") return false;
  return undefined;
}

/** Encode layers as comma-separated enabled keys (e.g. "planets,iss"). */
function encodeLayers(layers: ShareSkyState["layers"]): string {
  if (!layers) return "";
  return LAYER_KEYS.filter((k) => layers[k] === true).join(",");
}

/** Decode a comma-separated layer string into a layers object. */
function decodeLayers(raw: string | null | undefined): ShareSkyState["layers"] | undefined {
  if (!raw) return undefined;
  const enabled = new Set(raw.split(",").map((s) => s.trim()));
  const result: ShareSkyState["layers"] = {};
  let anySet = false;
  for (const k of LAYER_KEYS) {
    if (enabled.has(k)) {
      result[k] = true;
      anySet = true;
    }
  }
  return anySet ? result : undefined;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Encode a ShareSkyState into a query string (no leading `?`).
 *
 * - Omits fields that are undefined, empty, or are at their default values.
 * - Rounds lat/lon to 5 decimal places.
 * - Layers are encoded as a compact comma-separated list of enabled keys.
 */
export function encodeShareState(state: ShareSkyState): string {
  const params = new URLSearchParams();

  if (state.location) {
    params.set(PARAM_LAT, String(roundCoord(state.location.lat)));
    params.set(PARAM_LON, String(roundCoord(state.location.lon)));
    if (state.location.label) {
      params.set(PARAM_LABEL, state.location.label);
    }
  }

  if (state.timeUtc) {
    params.set(PARAM_TIME, state.timeUtc);
  }

  if (state.selectedObjectId) {
    params.set(PARAM_OBJECT, state.selectedObjectId);
  }

  if (state.layers) {
    const encoded = encodeLayers(state.layers);
    if (encoded) {
      params.set(PARAM_LAYERS, encoded);
    }
  }

  if (state.culturalTraditionId) {
    params.set(PARAM_TRADITION, state.culturalTraditionId);
  }

  if (state.narratorQuery) {
    params.set(PARAM_QUERY, state.narratorQuery);
  }

  return params.toString();
}

/**
 * Decode query parameters into a ShareSkyState.
 *
 * - Accepts a string (with or without leading `?`) or a URLSearchParams.
 * - Ignores unknown parameters.
 * - Sanitises bad numbers and invalid booleans — never throws.
 * - Returns an empty object `{}` when no recognised params are present.
 */
export function decodeShareState(search: string | URLSearchParams): ShareSkyState {
  let params: URLSearchParams;
  try {
    if (typeof search === "string") {
      // Strip leading `?` if present
      params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
    } else {
      params = search;
    }
  } catch {
    return {};
  }

  const state: ShareSkyState = {};

  // Location
  const lat = safeLat(params.get(PARAM_LAT));
  const lon = safeLon(params.get(PARAM_LON));
  if (lat !== undefined && lon !== undefined) {
    state.location = { lat, lon };
    const label = params.get(PARAM_LABEL);
    if (label) state.location.label = label;
  }

  // Time
  const t = params.get(PARAM_TIME);
  if (t) {
    // Accept any non-empty string (don't validate ISO-8601 format here
    // to stay tolerant of user-edited URLs)
    state.timeUtc = t;
  }

  // Selected object
  const obj = params.get(PARAM_OBJECT);
  if (obj) {
    state.selectedObjectId = obj;
  }

  // Layers
  const layers = decodeLayers(params.get(PARAM_LAYERS));
  if (layers) {
    state.layers = layers;
  }

  // Cultural tradition
  const tradition = params.get(PARAM_TRADITION);
  if (tradition) {
    state.culturalTraditionId = tradition;
  }

  // Narrator query
  const q = params.get(PARAM_QUERY);
  if (q) {
    state.narratorQuery = q;
  }

  return state;
}

/**
 * Build a full shareable URL from a base URL and a ShareSkyState.
 *
 * @param baseUrl - The base URL of the application (e.g. "https://zenith.app/sky").
 * @param state   - The sky state to encode.
 */
export function buildShareUrl(baseUrl: string, state: ShareSkyState): string {
  const qs = encodeShareState(state);
  if (!qs) return baseUrl;
  const separator = baseUrl.includes("?") ? "&" : "?";
  return `${baseUrl}${separator}${qs}`;
}
