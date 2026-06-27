/**
 * GYA-32 – Constellation line segment builder.
 *
 * Converts a SkyState's constellation array into alt/az segments
 * ready for Cesium polyline rendering.
 *
 * Integration note (for renderer wiring — GYA-36):
 *   In sky-state-renderer.ts, call:
 *     const segments = buildConstellationSegments(skyState, atDate);
 *     for (const seg of segments) {
 *       viewer.entities.add({
 *         polyline: {
 *           positions: Cesium.Cartesian3.fromDegreesArrayHeights([
 *             seg.start.azDeg, seg.start.altDeg, 0,
 *             seg.end.azDeg,   seg.end.altDeg,   0,
 *           ]),
 *           width: 1,
 *           material: Cesium.Color.STEELBLUE.withAlpha(0.6),
 *         },
 *       });
 *     }
 */

import { raDecToAltAz } from "./celestial-projection";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ConstellationPoint {
  ra: number;  // degrees
  dec: number; // degrees
}

export interface ConstellationInput {
  id: string;
  name: string;
  points: ConstellationPoint[];
}

export interface ConstellationSegment {
  /** Unique segment identifier: `<constellationId>-seg-<index>` */
  id: string;
  constellationId: string;
  name: string;
  start: { altDeg: number; azDeg: number };
  end:   { altDeg: number; azDeg: number };
}

export interface SkyStateWithConstellations {
  constellations: ConstellationInput[];
  location?: { lat: number; lon: number };
}

// ---------------------------------------------------------------------------
// Default observer (used when state has no location)
// ---------------------------------------------------------------------------

const DEFAULT_OBSERVER = { lat: 0, lon: 0 };

// ---------------------------------------------------------------------------
// buildConstellationSegments
// ---------------------------------------------------------------------------

/**
 * Convert a sky-state's constellations into renderable line segments.
 *
 * @param state  - Any object with a `constellations` array (accepts full SkyState).
 * @param atDate - UTC date for the RA/Dec → alt/az projection (default: now).
 * @returns      - Flat array of segments, one per adjacent pair of points.
 *                 Constellations with fewer than 2 points are silently skipped.
 */
export function buildConstellationSegments(
  state: SkyStateWithConstellations,
  atDate: Date = new Date(),
): ConstellationSegment[] {
  const observer = state.location ?? DEFAULT_OBSERVER;
  const segments: ConstellationSegment[] = [];

  for (const constellation of state.constellations) {
    if (!constellation.points || constellation.points.length < 2) continue;

    for (let i = 0; i < constellation.points.length - 1; i++) {
      const p1 = constellation.points[i];
      const p2 = constellation.points[i + 1];
      if (!p1 || !p2) continue;

      const start = raDecToAltAz(p1.ra, p1.dec, observer, atDate);
      const end   = raDecToAltAz(p2.ra, p2.dec, observer, atDate);

      segments.push({
        id:               `${constellation.id}-seg-${i}`,
        constellationId:  constellation.id,
        name:             constellation.name,
        start,
        end,
      });
    }
  }

  return segments;
}
