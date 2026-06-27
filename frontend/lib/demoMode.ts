/**
 * GYA-39 — Demo Mode foundation (pure module, no React)
 *
 * Activates when:
 *   1. `?demo=1` is present in the URL (checked on first import / call)
 *   2. `localStorage.zenith_demo` === "1" (remembered across reloads)
 *
 * Path remapping:
 *   resolvePath("/api/conditions") → "/api/demo/conditions"
 *   resolvePath("/api/narrate")    → "/api/demo/narrate"
 *
 * Only paths starting with /api/ that don't already include /demo/ are
 * remapped; everything else is returned as-is.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STORAGE_KEY = "zenith_demo";

/**
 * Live → demo path prefixes supported by the backend (/api/demo/* router).
 * Add new paths here as new demo endpoints are added.
 */
const DEMO_PATHS: Readonly<Record<string, string>> = {
  "/sky-state": "/api/demo/sky-state",
  "/api/conditions": "/api/demo/conditions",
  "/api/events": "/api/demo/events",
  "/api/passes": "/api/demo/passes",
};

// ---------------------------------------------------------------------------
// URL param detection
// ---------------------------------------------------------------------------

/**
 * Returns true if the current URL contains `?demo=1` (or `&demo=1`).
 * Safe to call in SSR — returns false when `window` is not available.
 */
function isDemoInUrl(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return new URLSearchParams(window.location.search).get("demo") === "1";
  } catch {
    return false;
  }
}

function isDemoInEnv(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_MODE === "1";
}

// ---------------------------------------------------------------------------
// localStorage helpers
// ---------------------------------------------------------------------------

function readStorage(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function writeStorage(active: boolean): void {
  if (typeof window === "undefined") return;
  try {
    if (active) {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Ignore — storage may be blocked (private browsing, etc.)
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns true when demo mode is currently active.
 * Checks URL param first (so a fresh ?demo=1 link always activates regardless
 * of prior localStorage state), then falls back to localStorage.
 */
export function isDemoActive(): boolean {
  return isDemoInUrl() || isDemoInEnv() || readStorage();
}

/**
 * Persist demo mode to localStorage so it survives page reloads.
 * Does not modify the URL.
 */
export function enableDemo(): void {
  writeStorage(true);
}

/**
 * Remove demo mode from localStorage.
 * Does not modify the URL.
 */
export function disableDemo(): void {
  writeStorage(false);
}

/**
 * Toggle current demo mode state and persist.
 * Returns the new state.
 */
export function toggleDemo(): boolean {
  const next = !isDemoActive();
  writeStorage(next);
  return next;
}

/**
 * Rewrite a backend API path to its demo equivalent when demo mode is active.
 *
 * Examples (demo active):
 *   "/api/conditions"             → "/api/demo/conditions"
 *   "/api/passes?lat=25&lon=85"   → returned as-is (path without search)
 *   "/api/demo/conditions"        → "/api/demo/conditions"  (no double-wrap)
 *   "/some/other/path"            → "/some/other/path"       (no change)
 *
 * When demo mode is inactive, always returns the original path unchanged.
 *
 * @param path  Absolute path starting with "/" (query string excluded).
 */
export function resolvePath(path: string): string {
  if (!isDemoActive()) return path;
  // Already in demo namespace — don't double-wrap
  if (path.startsWith("/api/demo/")) return path;

  for (const [livePath, demoPath] of Object.entries(DEMO_PATHS)) {
    if (path === livePath || path.startsWith(`${livePath}/`)) {
      return `${demoPath}${path.slice(livePath.length)}`;
    }
  }

  return path;
}
