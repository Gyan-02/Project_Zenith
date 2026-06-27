/**
 * GYA-23 – Celestial Event prediction types.
 *
 * Owned exclusively by backend/src/predictions/events/.
 * Do not import into contracts.ts or any shared file until the GYA-36
 * aggregator wires this into the main sky-state pipeline.
 */

// ---------------------------------------------------------------------------
// Event classification
// ---------------------------------------------------------------------------

export type CelestialEventType =
  | "meteor_shower"
  | "conjunction"
  | "eclipse"
  | "visibility_window";

// ---------------------------------------------------------------------------
// Visibility rating
// ---------------------------------------------------------------------------

export interface EventVisibility {
  /** Conservative observable quality rating. */
  rating: "Excellent" | "Good" | "Poor" | "Unknown";
  /**
   * Human-readable reason for the rating.
   * Must be concise — shown inline in the UI.
   */
  reason: string;
}

// ---------------------------------------------------------------------------
// Navigation target (optional link to the globe camera)
// ---------------------------------------------------------------------------

export interface EventNavigationTarget {
  kind: "planet" | "satellite" | "star" | "constellation" | "moon" | "iss";
  id: string;
  label: string;
}

// ---------------------------------------------------------------------------
// Core event shape
// ---------------------------------------------------------------------------

export interface EventPath {
  type: string;
  summary: string;
  bestViewingRegions: string[];
  duration: string;
  visibilityFromObserver: string;
}

export interface CelestialEvent {
  /** Stable, URL-safe identifier (e.g. "perseids-2026"). */
  id: string;
  type: CelestialEventType;
  /** Display name (e.g. "Perseids Meteor Shower"). */
  name: string;
  /** ISO-8601 UTC – start of the event window. */
  startUtc: string;
  /** ISO-8601 UTC – end of the event window. */
  endUtc: string;
  /** ISO-8601 UTC – moment of best viewing / peak, if applicable. */
  peakUtc?: string;
  /** One or two sentences describing the event. */
  summary: string;
  visibility: EventVisibility;
  /**
   * Attribution / method.
   * Use "Annual catalog" for recurring events,
   * "Static catalog" for one-off events.
   */
  source: string;
  /**
   * How confident we are in the timing.
   * "high"   = dates are well-established and unlikely to shift.
   * "medium" = approximate; observer conditions matter greatly.
   * "low"    = rough estimate only.
   */
  confidence: "high" | "medium" | "low";
  /** Optional globe navigation target. */
  navigationTarget?: EventNavigationTarget;
  metadata?: {
    path?: EventPath;
  };
}

// ---------------------------------------------------------------------------
// Query type
// ---------------------------------------------------------------------------

export interface CelestialEventQuery {
  location: { lat: number; lon: number };
  /** ISO-8601 UTC – inclusive start of the query window. */
  startUtc: string;
  /** ISO-8601 UTC – inclusive end of the query window. */
  endUtc: string;
  /** Optional filter: only return events of these types. */
  types?: CelestialEventType[];
}
