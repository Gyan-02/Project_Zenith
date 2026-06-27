# Antigravity Prompt — GYA-18 Shareable Sky Links

You are working in the Project Zenith repo.

Goal: implement the frontend share-link encoder/decoder for Project Zenith so a user can share a sky view with location, time, selected object, layer state, and cultural tradition.

## Context

Project Zenith is an AI-powered sky digital twin. The current repo already has:

- `frontend/` Next.js frontend
- `frontend/lib/navigationBus.ts`
- `frontend/lib/skyState.ts`
- `frontend/components/globe/**`
- `frontend/components/narrator/**`

This task must be frontend-library only. Do not build UI yet; just create the share-link logic and tests.

## Hard boundaries

Own only these files:

- `frontend/lib/share/**`

Do not modify:

- `frontend/app/**`
- `frontend/components/**`
- `frontend/hooks/**`
- `backend/**`
- package manager files

If UI wiring is needed, leave a handoff note instead of editing UI files.

## Requirements

Suggested files:

- `frontend/lib/share/shareState.ts`
- `frontend/lib/share/shareUrl.ts`
- `frontend/lib/share/shareUrl.test.ts`
- `frontend/lib/share/index.ts`

Implement a compact, stable share state:

```ts
type ShareSkyState = {
  location?: {
    lat: number;
    lon: number;
    label?: string;
  };
  timeUtc?: string;
  selectedObjectId?: string;
  layers?: {
    planets?: boolean;
    satellites?: boolean;
    iss?: boolean;
    constellations?: boolean;
    meteorShowers?: boolean;
  };
  culturalTraditionId?: string;
  narratorQuery?: string;
};
```

Implement:

- `encodeShareState(state: ShareSkyState): string`
  - Returns a query string without leading `?`.
  - Omits empty/default values.
  - Rounds lat/lon to a reasonable precision.

- `decodeShareState(search: string | URLSearchParams): ShareSkyState`
  - Accepts leading `?`.
  - Ignores unknown params.
  - Sanitizes bad numbers and invalid booleans.
  - Never throws for malformed user-shared URLs.

- `buildShareUrl(baseUrl: string, state: ShareSkyState): string`

Suggested query params:

- `lat`
- `lon`
- `label`
- `t`
- `obj`
- `layers`
- `tradition`
- `q`

Layer encoding can be compact, e.g. comma-separated enabled layers.

## Tests

Cover:

- Encode/decode round trip.
- Malformed input does not throw.
- Unknown params are ignored.
- Empty/default state produces an empty query string.
- Layer encoding is stable.
- Unicode labels and narrator query survive round trip.

## Acceptance criteria

- `npm.cmd run test -w frontend` passes.
- `npm.cmd run build -w frontend` passes.
- No UI changes.
- No backend changes.
- No changes outside `frontend/lib/share/**`.

## Final handoff

Report:

- Files changed.
- Exact share URL params.
- Example encoded URL.
- How the main UI should later consume this module.
