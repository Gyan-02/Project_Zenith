/**
 * GYA-23 – Meteor shower catalog.
 *
 * Uses a year-agnostic representation (month/day of peak) so that the service
 * can project events into any requested calendar year without hardcoding dates.
 *
 * All durations and ZHR values are established from the IMO meteor calendar.
 * Visibility ratings reflect dark-sky conditions — actual visibility depends on
 * the observer's local light pollution, weather, and the Moon's phase.
 */

import type { CelestialEvent, EventVisibility } from "./event.types.js";

// ---------------------------------------------------------------------------
// Internal catalog definition
// ---------------------------------------------------------------------------

interface MeteorShowerDefinition {
  id: string;
  name: string;
  /** Peak month (1-indexed). */
  peakMonth: number;
  /** Peak day of month. */
  peakDay: number;
  /** Activity window: days before peak. */
  startOffsetDays: number;
  /** Activity window: days after peak. */
  endOffsetDays: number;
  /** Zenithal hourly rate at peak. */
  peakZHR: number;
  /** Parent comet or asteroid. */
  parent: string;
  /** Radiant constellation. */
  radiant: string;
  summary: string;
  visibility: EventVisibility;
  /** Constellation id for navigation. */
  navigationConstellationId?: string;
}

const SHOWER_CATALOG: MeteorShowerDefinition[] = [
  {
    id: "quadrantids",
    name: "Quadrantids Meteor Shower",
    peakMonth: 1,
    peakDay: 3,
    startOffsetDays: 2,
    endOffsetDays: 2,
    peakZHR: 120,
    parent: "Asteroid 2003 EH1",
    radiant: "Boötes / Draco border",
    summary:
      "The Quadrantids produce a sharp, intense peak lasting only a few hours. A dark-sky ZHR of ~120 makes it one of the strongest annual showers when conditions align.",
    visibility: { rating: "Excellent", reason: "High ZHR but very narrow peak — timing is critical." },
    navigationConstellationId: "boo",
  },
  {
    id: "lyrids",
    name: "Lyrids Meteor Shower",
    peakMonth: 4,
    peakDay: 22,
    startOffsetDays: 3,
    endOffsetDays: 1,
    peakZHR: 18,
    parent: "Comet C/1861 G1 (Thatcher)",
    radiant: "Lyra",
    summary:
      "One of the oldest recorded meteor showers, observed for over 2,700 years. Produces bright, fast meteors with occasional outbursts reaching 100+ ZHR.",
    visibility: { rating: "Good", reason: "Modest ZHR but historically reliable; occasional bright fireballs." },
    navigationConstellationId: "lyr",
  },
  {
    id: "eta-aquariids",
    name: "Eta Aquariids Meteor Shower",
    peakMonth: 5,
    peakDay: 6,
    startOffsetDays: 5,
    endOffsetDays: 5,
    peakZHR: 50,
    parent: "Comet 1P/Halley",
    radiant: "Aquarius",
    summary:
      "Debris from Halley's Comet produces swift meteors with persistent trains. Best viewed from the Southern Hemisphere; northern observers see fewer meteors as the radiant stays low.",
    visibility: { rating: "Good", reason: "Excellent for Southern Hemisphere; moderate from mid-northern latitudes." },
    navigationConstellationId: "aqr",
  },
  {
    id: "perseids",
    name: "Perseids Meteor Shower",
    peakMonth: 8,
    peakDay: 12,
    startOffsetDays: 7,
    endOffsetDays: 4,
    peakZHR: 100,
    parent: "Comet 109P/Swift-Tuttle",
    radiant: "Perseus",
    summary:
      "The most popular meteor shower of the year, reliably producing 50–100 meteors per hour from a dark site. Warm August nights make it ideal for casual observers.",
    visibility: { rating: "Excellent", reason: "High ZHR, bright meteors, and comfortable summer nights for northern observers." },
    navigationConstellationId: "per",
  },
  {
    id: "orionids",
    name: "Orionids Meteor Shower",
    peakMonth: 10,
    peakDay: 21,
    startOffsetDays: 5,
    endOffsetDays: 5,
    peakZHR: 20,
    parent: "Comet 1P/Halley",
    radiant: "Orion",
    summary:
      "The second annual shower produced by Halley's Comet. Swift, bright meteors with persistent glowing trains. Radiant rises well above the horizon by midnight.",
    visibility: { rating: "Good", reason: "Swift meteors and bright fireballs; ZHR moderate but reliable." },
    navigationConstellationId: "ori",
  },
  {
    id: "leonids",
    name: "Leonids Meteor Shower",
    peakMonth: 11,
    peakDay: 17,
    startOffsetDays: 3,
    endOffsetDays: 2,
    peakZHR: 15,
    parent: "Comet 55P/Tempel-Tuttle",
    radiant: "Leo",
    summary:
      "Normally a modest shower, but historically responsible for spectacular meteor storms (thousands per hour) when Earth passes through dense debris trails. Notable storms occurred in 1833, 1866, and 1966.",
    visibility: { rating: "Good", reason: "Modest in most years; historically capable of spectacular storms." },
    navigationConstellationId: "leo",
  },
  {
    id: "geminids",
    name: "Geminids Meteor Shower",
    peakMonth: 12,
    peakDay: 14,
    startOffsetDays: 4,
    endOffsetDays: 3,
    peakZHR: 120,
    parent: "Asteroid 3200 Phaethon",
    radiant: "Gemini",
    summary:
      "The Geminids are arguably the best annual meteor shower — rich, consistent, and producing multicoloured meteors. Unusually, the parent body is an asteroid, not a comet.",
    visibility: { rating: "Excellent", reason: "Highest reliable ZHR of any annual shower; radiant well-placed from both hemispheres." },
    navigationConstellationId: "gem",
  },
  {
    id: "ursids",
    name: "Ursids Meteor Shower",
    peakMonth: 12,
    peakDay: 22,
    startOffsetDays: 3,
    endOffsetDays: 2,
    peakZHR: 10,
    parent: "Comet 8P/Tuttle",
    radiant: "Ursa Minor",
    summary:
      "A gentle year-end shower with a circumpolar radiant — observers at high northern latitudes can watch all night. ZHR is usually modest, but outbursts to 50+ have been recorded.",
    visibility: { rating: "Poor", reason: "Low ZHR in most years; best for dedicated observers at high northern latitudes." },
    navigationConstellationId: "uma",
  },
];

// ---------------------------------------------------------------------------
// Year-projection helper
// ---------------------------------------------------------------------------

/**
 * Project a month/day definition into a specific calendar year, returning
 * ISO-8601 UTC strings for start, peak, and end.
 */
function projectToYear(
  def: MeteorShowerDefinition,
  year: number,
): { startUtc: string; peakUtc: string; endUtc: string } {
  // Use UTC midnight for all dates to keep the output deterministic.
  const peak = new Date(Date.UTC(year, def.peakMonth - 1, def.peakDay, 0, 0, 0, 0));
  const start = new Date(peak.getTime() - def.startOffsetDays * 86_400_000);
  const end = new Date(peak.getTime() + def.endOffsetDays * 86_400_000);
  return {
    startUtc: start.toISOString(),
    peakUtc: peak.toISOString(),
    endUtc: end.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Public function
// ---------------------------------------------------------------------------

/**
 * Return all meteor shower events that overlap the given [windowStart, windowEnd]
 * range for every year spanned by the window.
 *
 * The function handles multi-year windows correctly and avoids hardcoding any
 * single year by iterating over every calendar year covered by the query window.
 */
export function getMeteorShowerEvents(
  windowStart: Date,
  windowEnd: Date,
): CelestialEvent[] {
  const events: CelestialEvent[] = [];

  const startYear = windowStart.getUTCFullYear();
  const endYear = windowEnd.getUTCFullYear();

  for (let year = startYear; year <= endYear; year++) {
    for (const def of SHOWER_CATALOG) {
      const { startUtc, peakUtc, endUtc } = projectToYear(def, year);

      const evtStart = new Date(startUtc);
      const evtEnd = new Date(endUtc);

      // Overlap check: event overlaps window when evtStart ≤ windowEnd AND evtEnd ≥ windowStart
      if (evtStart > windowEnd || evtEnd < windowStart) continue;

      events.push({
        id: `${def.id}-${year}`,
        type: "meteor_shower",
        name: def.name,
        startUtc,
        endUtc,
        peakUtc,
        summary: def.summary,
        visibility: def.visibility,
        source: "Annual catalog",
        confidence: "high",
        ...(def.navigationConstellationId
          ? {
              navigationTarget: {
                kind: "constellation" as const,
                id: def.navigationConstellationId,
                label: def.name.replace(" Meteor Shower", ""),
              },
            }
          : {}),
      });
    }
  }

  return events;
}
