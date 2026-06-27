/**
 * GYA-14 – Cardinal direction mapping from azimuth.
 */

import type { PassDirection } from "./pass-prediction.types.js";

/**
 * Map an azimuth in degrees (any value) to one of eight cardinal/intercardinal
 * compass points.
 *
 * Boundary values: each octant spans 45°, centred on its cardinal point.
 *   N  : [337.5, 22.5)
 *   NE : [22.5,  67.5)
 *   E  : [67.5, 112.5)
 *   SE : [112.5, 157.5)
 *   S  : [157.5, 202.5)
 *   SW : [202.5, 247.5)
 *   W  : [247.5, 292.5)
 *   NW : [292.5, 337.5)
 *
 * Negative or > 360° inputs are normalised before mapping.
 */
export function azimuthToDirection(azimuthDeg: number): PassDirection {
  // Normalise to [0, 360)
  const az = ((azimuthDeg % 360) + 360) % 360;

  // Divide the circle into 8 equal 45° sectors, offset by 22.5° so that N
  // is centred on 0°/360°.
  const index = Math.floor((az + 22.5) / 45) % 8;

  const directions: PassDirection[] = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return directions[index] as PassDirection;
}
