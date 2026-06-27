/**
 * GYA-23 – Public entry point for the celestial event prediction module.
 *
 * Integration note (for GYA-36 / sky-state aggregator):
 *
 * To expose events via the API:
 *   1. Create a GET /api/events route that reads `startUtc`, `endUtc`, `lat`,
 *      `lon`, and optional `types` from the query string.
 *   2. Call `predictCelestialEvents(query)` and return the array as JSON.
 *   3. In the sky-state provenance array, add:
 *      `{ source: "CelestialEventEngine", fetchedAt: new Date().toISOString() }`.
 *
 * No wiring is done here — this module is entirely standalone.
 */

export {
  predictCelestialEvents,
  CelestialEventQueryError,
} from "./eventPrediction.service.js";

export type {
  CelestialEvent,
  CelestialEventType,
  CelestialEventQuery,
  EventVisibility,
  EventNavigationTarget,
} from "./event.types.js";
