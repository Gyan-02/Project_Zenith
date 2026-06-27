import { getSkyObjects, type SkyObject, type SkyState } from "./skyState";
import { raDecToAltAz } from "../components/globe/celestial-projection";

export interface CrossingStats {
  total: number;
  satellites: number;
  iss: number;
  planets: number;
  brightStars: number;
}

export function computeCrossingStats(state: SkyState): CrossingStats {
  const at = new Date(state.timestampUtc);
  let satellites = 0;
  let iss = 0;
  let planets = 0;
  let brightStars = 0;

  for (const obj of getSkyObjects(state)) {
    let altDeg = obj.position.altDeg;
    if (altDeg === undefined) {
      const projected = raDecToAltAz(obj.position.ra, obj.position.dec, state.location, at);
      altDeg = projected.altDeg;
    }

    if (altDeg > 0) {
      if (obj.kind === "satellite") {
        satellites++;
      } else if (obj.kind === "iss") {
        iss++;
      } else if (obj.kind === "planet") {
        planets++;
      } else if (obj.kind === "star") {
        brightStars++;
      }
    }
  }

  return {
    total: satellites + iss + planets + brightStars,
    satellites,
    iss,
    planets,
    brightStars,
  };
}
