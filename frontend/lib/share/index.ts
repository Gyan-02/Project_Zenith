/**
 * GYA-18 – Public entry point for the share-link module.
 *
 * UI wiring note (for the GYA-36 / UI integration ticket):
 *
 * To wire this module into the main sky view:
 *   1. Read `window.location.search` in the page root and call `decodeShareState`
 *      to hydrate initial UI state.
 *   2. When the user changes location/time/selected object, call `encodeShareState`
 *      and push to the browser history via `history.replaceState`.
 *   3. For the share button, call `buildShareUrl(window.location.origin, currentState)`
 *      and copy to clipboard / show a toast.
 *
 * The module is intentionally free of React and Next.js imports so it can be
 * used in both client and server contexts.
 */

export type { ShareSkyState, LayerKey } from "./shareState";
export {
  PARAM_LAT,
  PARAM_LON,
  PARAM_LABEL,
  PARAM_TIME,
  PARAM_OBJECT,
  PARAM_LAYERS,
  PARAM_TRADITION,
  PARAM_QUERY,
  LAYER_KEYS,
} from "./shareState";
export { encodeShareState, decodeShareState, buildShareUrl } from "./shareUrl";
