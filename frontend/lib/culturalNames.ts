/**
 * GYA-19 – Cultural Names frontend API helper and types.
 *
 * Fetches from GET /api/cultural-names/:objectId.
 * 404 → null (object has no cultural names yet).
 * Network errors propagate as thrown errors for the hook to handle.
 */

// ---------------------------------------------------------------------------
// Types mirroring the backend shape
// ---------------------------------------------------------------------------

export interface TraditionEntry {
  name: string;
  /** Romanised transliteration when the script is non-Latin. */
  transliteration?: string;
  /** Meaning or short mythological note. */
  meaning?: string;
}

export interface CulturalObjectEntry {
  /** IAU / scientific name. */
  scientific: string;
  category: "planet" | "moon" | "star" | "constellation" | "asterism";
  /** Map of tradition slug → entry. */
  names: Record<string, TraditionEntry>;
}

// ---------------------------------------------------------------------------
// API helper
// ---------------------------------------------------------------------------

const DEFAULT_API_URL = "http://localhost:4000";

/**
 * Fetch cultural names for a single sky object.
 *
 * @param objectId - Lower-case object identifier (e.g. "jupiter").
 * @param signal   - Optional AbortSignal for cancellation.
 * @returns        - The cultural object entry, or `null` when not found (404).
 * @throws         - For any non-404 network or parse error.
 */
export async function getCulturalNamesForObject(
  objectId: string,
  signal?: AbortSignal,
): Promise<CulturalObjectEntry | null> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_URL;
  const url = `${base}/api/cultural-names/${encodeURIComponent(objectId)}`;

  const response = await fetch(url, { signal });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Cultural names request failed (${response.status})`);
  }

  return response.json() as Promise<CulturalObjectEntry>;
}
