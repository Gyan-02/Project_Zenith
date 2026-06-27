/**
 * GYA-30 – Shared HTTP fetch utility.
 *
 * All browser-side API calls should go through `apiGetJson` to get
 * consistent error handling, base-URL resolution, and query building.
 *
 * Example usage in a new helper:
 *
 *   import { apiGetJson } from "../api";
 *
 *   export async function getObservingConditions(
 *     params: { lat: number; lon: number },
 *     signal?: AbortSignal,
 *   ) {
 *     return apiGetJson<ObservingConditionsResponse>("/api/conditions", params, signal);
 *   }
 */

import { getApiBaseUrl } from "./baseUrl";
import { buildQuery, type QueryParams } from "./query";
import { resolvePath } from "../demoMode";

// ---------------------------------------------------------------------------
// Typed API error
// ---------------------------------------------------------------------------

export class ApiError extends Error {
  override name = "ApiError";
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

// ---------------------------------------------------------------------------
// Core fetch helper
// ---------------------------------------------------------------------------

/**
 * Perform a GET request against the Zenith backend and parse the JSON body.
 *
 * @param path    - Absolute path starting with "/" (e.g. "/api/conditions").
 * @param params  - Optional query parameters (built via `buildQuery`).
 * @param signal  - Optional AbortSignal for request cancellation.
 * @returns       - Parsed JSON body typed as `T`.
 * @throws        - `ApiError` for non-2xx responses.
 * @throws        - `DOMException` (AbortError) when the request is aborted — not swallowed.
 */
export async function apiGetJson<T>(
  path: string,
  params?: QueryParams,
  signal?: AbortSignal,
): Promise<T> {
  const base = getApiBaseUrl();
  const resolved = resolvePath(path);
  const search = params ? buildQuery(params) : new URLSearchParams();
  const qs = search.toString();
  const url = `${base}${resolved}${qs ? `?${qs}` : ""}`;

  const response = await fetch(url, { signal });

  if (!response.ok) {
    throw new ApiError(
      response.status,
      `API request failed: ${response.status} ${response.statusText}`,
    );
  }

  return response.json() as Promise<T>;
}
