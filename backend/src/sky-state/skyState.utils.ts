import type { SkyObject, SkyState } from "../contracts.js";

export function getSkyObjects(state: SkyState): SkyObject[] {
  return [
    ...state.planets,
    ...(state.stars ?? []),
    ...state.satellites,
    ...(state.iss ? [state.iss] : []),
    state.moon,
    ...state.meteorShowers,
  ];
}
