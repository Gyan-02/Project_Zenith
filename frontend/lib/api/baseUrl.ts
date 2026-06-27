/**
 * GYA-30 – Shared frontend API base URL.
 *
 * Single source of truth for the backend origin used by all fetch helpers.
 */

const DEFAULT_API_URL = "http://localhost:4000";

/**
 * Returns the base URL for the Zenith backend API.
 * Reads NEXT_PUBLIC_API_URL and strips any trailing slash so callers
 * can always safely append "/path" without double-slashes.
 */
export function getApiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL;
  return raw.replace(/\/+$/, "");
}
