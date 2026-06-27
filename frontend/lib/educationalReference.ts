/**
 * GYA-26 – Educational Reference frontend types and API helper.
 *
 * Mirrors the backend ReferenceObject shape from GYA-12.
 * Fetches from GET /api/reference/:objectId (not mounted yet —
 * the hook degrades gracefully when the endpoint is unavailable).
 */

// ---------------------------------------------------------------------------
// Types
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

export interface EducationalReference {
  objectId: string;
  name: string;
  kind: ReferenceObjectKind;
  oneLine: string;
  whyItMatters: string;
  quickFacts: QuickFact[];
  observationTips: string[];
  kidFriendlySummary: string;
  sourceNotes: string;
}

// ---------------------------------------------------------------------------
// API helper
// ---------------------------------------------------------------------------

const DEFAULT_API_URL = "http://localhost:4000";

/**
 * Fetch the educational reference for a sky object.
 *
 * @param objectId - Lower-case object identifier (e.g. "saturn").
 * @param signal   - Optional AbortSignal for cancellation.
 * @returns        - The reference object, or `null` when not found (404).
 * @throws         - For any non-404 network or parse error.
 */
export async function getEducationalReference(
  objectId: string,
  signal?: AbortSignal,
): Promise<EducationalReference | null> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_URL;
  const url = `${base}/api/reference/${encodeURIComponent(objectId)}`;

  const response = await fetch(url, { signal });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Educational reference request failed (${response.status})`);
  }

  return response.json() as Promise<EducationalReference>;
}
