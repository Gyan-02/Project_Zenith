/**
 * GYA-23 – Celestial Event prediction service.
 *
 * Pure, deterministic, offline service that merges the meteor shower catalog
 * and the static event catalog into a single sorted result set.
 *
 * No network calls, no AI calls, no shared-route or provider imports.
 */

import { getCatalogEvents } from "./catalogEvents.js";
import { getMeteorShowerEvents } from "./meteorShowers.js";
import type { CelestialEvent, CelestialEventQuery, CelestialEventType } from "./event.types.js";

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export class CelestialEventQueryError extends Error {
  override name = "CelestialEventQueryError";
  constructor(message: string) {
    super(message);
  }
}

function validateQuery(query: CelestialEventQuery): { start: Date; end: Date } {
  const start = new Date(query.startUtc);
  const end = new Date(query.endUtc);

  if (!Number.isFinite(start.getTime())) {
    throw new CelestialEventQueryError(
      `Invalid startUtc: "${query.startUtc}" is not a valid ISO-8601 date`,
    );
  }
  if (!Number.isFinite(end.getTime())) {
    throw new CelestialEventQueryError(
      `Invalid endUtc: "${query.endUtc}" is not a valid ISO-8601 date`,
    );
  }
  if (start > end) {
    throw new CelestialEventQueryError(
      `startUtc (${query.startUtc}) must not be after endUtc (${query.endUtc})`,
    );
  }

  return { start, end };
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

/**
 * Predict celestial events that overlap the query window.
 *
 * @param query - Location, time window, and optional type filter.
 * @returns    - Array of CelestialEvent sorted by startUtc ascending.
 * @throws     - CelestialEventQueryError for invalid date ranges.
 */
export function predictCelestialEvents(query: CelestialEventQuery): CelestialEvent[] {
  const { start, end } = validateQuery(query);

  // Gather events from all sources
  const showers = getMeteorShowerEvents(start, end);
  const catalog = getCatalogEvents(start, end);

  let events: CelestialEvent[] = [...showers, ...catalog];

  // Apply type filter
  if (query.types && query.types.length > 0) {
    const allowed = new Set<CelestialEventType>(query.types);
    events = events.filter((e) => allowed.has(e.type));
  }

  // Sort by startUtc ascending
  events.sort((a, b) => a.startUtc.localeCompare(b.startUtc));

  return events;
}
