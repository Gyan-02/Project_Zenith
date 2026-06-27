/**
 * GYA-23 – Static catalog of notable celestial events.
 *
 * This file contains a small, conservative set of demo-ready events that are
 * either publicly well-known or historically notable.  Exact orbital visibility
 * is NOT computed — events that require precise eclipse / conjunction geometry
 * are marked with visibility.rating "Unknown" to avoid misleading users.
 *
 * To add new events: append entries to CATALOG_EVENTS below.
 * Each entry must have a globally unique, stable id.
 */

import type { CelestialEvent } from "./event.types.js";

// ---------------------------------------------------------------------------
// Static catalog
// ---------------------------------------------------------------------------

export const CATALOG_EVENTS: CelestialEvent[] = [
  // ── Eclipses ─────────────────────────────────────────────────────────────

  {
    id: "solar-eclipse-2026-08-12",
    type: "eclipse",
    name: "Total Solar Eclipse — August 2026",
    startUtc: "2026-08-12T15:00:00Z",
    endUtc: "2026-08-12T20:00:00Z",
    peakUtc: "2026-08-12T17:47:00Z",
    summary:
      "A total solar eclipse crossing Greenland, Iceland, Spain, and northern Africa. The path of totality produces up to ~2 minutes of darkness.",
    visibility: {
      rating: "Unknown",
      reason: "Visibility depends entirely on being within the narrow path of totality — check NASA eclipse maps.",
    },
    source: "Static catalog",
    confidence: "high",
  },
  {
    id: "lunar-eclipse-2025-03-14",
    type: "eclipse",
    name: "Total Lunar Eclipse — March 2025",
    startUtc: "2025-03-14T03:57:00Z",
    endUtc: "2025-03-14T08:00:00Z",
    peakUtc: "2025-03-14T06:58:00Z",
    summary:
      "A total lunar eclipse visible from the Americas, Europe, and western Africa. The Moon turns a deep copper-red during totality.",
    visibility: {
      rating: "Good",
      reason: "Total lunar eclipses are safe to view with naked eyes; visible anywhere the Moon is above the horizon during the event.",
    },
    source: "Static catalog",
    confidence: "high",
  },
  {
    id: "lunar-eclipse-2025-09-07",
    type: "eclipse",
    name: "Total Lunar Eclipse — September 2025",
    startUtc: "2025-09-07T16:30:00Z",
    endUtc: "2025-09-07T22:00:00Z",
    peakUtc: "2025-09-07T19:11:00Z",
    summary:
      "A total lunar eclipse primarily visible from Europe, Africa, Asia, and Australia.",
    visibility: {
      rating: "Good",
      reason: "Visible from large parts of the eastern hemisphere; check local moonrise/moonset times.",
    },
    source: "Static catalog",
    confidence: "high",
  },

  // ── Conjunctions ──────────────────────────────────────────────────────────

  {
    id: "saturn-neptune-conjunction-2025-02-20",
    type: "conjunction",
    name: "Saturn–Neptune Conjunction",
    startUtc: "2025-02-18T00:00:00Z",
    endUtc: "2025-02-22T23:59:00Z",
    peakUtc: "2025-02-20T00:00:00Z",
    summary:
      "Saturn and Neptune appear less than 1° apart in Pisces — a photogenic pairing requiring a telescope to separate the two planets cleanly.",
    visibility: {
      rating: "Unknown",
      reason: "Exact visibility depends on local dawn sky conditions; Neptune requires optical aid.",
    },
    source: "Static catalog",
    confidence: "medium",
  },
  {
    id: "venus-jupiter-conjunction-2025-08-12",
    type: "conjunction",
    name: "Venus–Jupiter Conjunction",
    startUtc: "2025-08-11T00:00:00Z",
    endUtc: "2025-08-13T23:59:00Z",
    peakUtc: "2025-08-12T04:00:00Z",
    summary:
      "Venus and Jupiter appear extremely close in the dawn sky — one of the most striking conjunction events of 2025.",
    visibility: {
      rating: "Excellent",
      reason: "Both planets are very bright (mag < 0); even a hazy dawn sky should reveal them clearly.",
    },
    source: "Static catalog",
    confidence: "high",
  },

  // ── Visibility windows ─────────────────────────────────────────────────────

  {
    id: "saturn-opposition-2025-09-21",
    type: "visibility_window",
    name: "Saturn at Opposition 2025",
    startUtc: "2025-09-01T00:00:00Z",
    endUtc: "2025-10-15T23:59:00Z",
    peakUtc: "2025-09-21T00:00:00Z",
    summary:
      "Saturn rises at sunset and is visible all night long. The rings are well-tilted, making this an excellent season to study them in a small telescope.",
    visibility: {
      rating: "Excellent",
      reason: "Largest apparent disc of the year; rings clearly visible in any telescope above 25×.",
    },
    source: "Static catalog",
    confidence: "high",
    navigationTarget: {
      kind: "planet",
      id: "saturn",
      label: "Saturn",
    },
  },
  {
    id: "mars-opposition-2027-02-19",
    type: "visibility_window",
    name: "Mars at Opposition 2027",
    startUtc: "2027-01-01T00:00:00Z",
    endUtc: "2027-04-01T23:59:00Z",
    peakUtc: "2027-02-19T00:00:00Z",
    summary:
      "Mars makes a favourable opposition in 2027, appearing bright and well-placed for observers in both hemispheres.",
    visibility: {
      rating: "Excellent",
      reason: "Mars will be prominent in the evening sky for several weeks around opposition.",
    },
    source: "Static catalog",
    confidence: "high",
    navigationTarget: {
      kind: "planet",
      id: "mars",
      label: "Mars",
    },
  },
];

// ---------------------------------------------------------------------------
// Accessor
// ---------------------------------------------------------------------------

/**
 * Return catalog events (conjunctions, eclipses, visibility windows) that
 * overlap the given time window.
 */
export function getCatalogEvents(
  windowStart: Date,
  windowEnd: Date,
): CelestialEvent[] {
  return CATALOG_EVENTS.filter((evt) => {
    const start = new Date(evt.startUtc);
    const end = new Date(evt.endUtc);
    return start <= windowEnd && end >= windowStart;
  });
}
