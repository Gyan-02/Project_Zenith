/**
 * GYA-31 – Demo data loaders.
 *
 * Provides deterministic, offline-safe fixtures for demo day.
 * All four loaders return typed data from the data/demo/ JSON files.
 *
 * Wiring note (for GYA-36 or demo mode env flag):
 *   import { loadDemoSkyState } from "./demo/demo.loader.js";
 *   // In a route or service, check process.env.ZENITH_DEMO_MODE === "true"
 *   // and return the demo pack instead of calling live providers.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { SkyState } from "../contracts.js";
import type {
  DemoConditions,
  DemoCelestialEvent,
  DemoPassesResponse,
} from "./demo.types.js";

// ---------------------------------------------------------------------------
// Path helpers
// ---------------------------------------------------------------------------

function dataPath(file: string): string {
  // Same depth as backend/src/cultural-names/ → uses ../../../data/
  // backend/src/demo/ → go up 3 levels to reach zenith/ root, then data/demo/
  return fileURLToPath(new URL(`../../../data/demo/${file}`, import.meta.url));
}

function loadJson<T>(file: string): T {
  return JSON.parse(readFileSync(dataPath(file), "utf8")) as T;
}

// ---------------------------------------------------------------------------
// Public loaders
// ---------------------------------------------------------------------------

/**
 * Load the demo sky-state fixture for Patna, India (Perseids night 2026).
 */
export function loadDemoSkyState(): SkyState {
  return loadJson<SkyState>("sky-state-patna.json");
}

/**
 * Load the demo observing conditions fixture for Patna.
 */
export function loadDemoConditions(): DemoConditions {
  return loadJson<DemoConditions>("conditions-patna.json");
}

/**
 * Load the demo celestial events fixture for 2026.
 */
export function loadDemoEvents(): DemoCelestialEvent[] {
  return loadJson<DemoCelestialEvent[]>("events-2026.json");
}

/**
 * Load the demo satellite passes fixture for Patna (Perseids night 2026).
 */
export function loadDemoPasses(): DemoPassesResponse {
  return loadJson<DemoPassesResponse>("passes-patna.json");
}
