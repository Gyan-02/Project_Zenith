/**
 * GYA-12 – Educational Reference content types.
 *
 * These types are owned exclusively by the educational-reference module.
 * They are deliberately separate from contracts.ts so the module can evolve
 * independently and be consumed by the narrator and object detail panels later.
 */

// ---------------------------------------------------------------------------
// Core data shape
// ---------------------------------------------------------------------------

export interface QuickFact {
  label: string;
  value: string;
}

export type ReferenceObjectKind =
  | "star"
  | "planet"
  | "moon"
  | "satellite"
  | "constellation"
  | "cluster"
  | "sun";

export interface ReferenceObject {
  /** Lower-case, dash-separated identifier — e.g. "saturn", "iss". */
  objectId: string;
  /** Display name — e.g. "Saturn", "ISS". */
  name: string;
  /** Broad category. */
  kind: ReferenceObjectKind;
  /** One-sentence card header (≤ 160 chars). */
  oneLine: string;
  /** Short paragraph on cultural/scientific significance. */
  whyItMatters: string;
  /** 2-6 bullet facts for the detail panel. */
  quickFacts: QuickFact[];
  /** Practical observation tips. */
  observationTips: string[];
  /** Jargon-free summary for younger audiences. */
  kidFriendlySummary: string;
  /** Attribution / source notes. */
  sourceNotes: string;
}

// ---------------------------------------------------------------------------
// Service query / response helpers
// ---------------------------------------------------------------------------

export interface ListReferencesOptions {
  /** Filter by object kind. Omit to list all. */
  kind?: ReferenceObjectKind;
}

export type ReferenceNotFound = { found: false; objectId: string };
export type ReferenceFound = { found: true } & ReferenceObject;
export type ReferenceResult = ReferenceFound | ReferenceNotFound;
