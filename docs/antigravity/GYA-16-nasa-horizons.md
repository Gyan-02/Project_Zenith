# Antigravity prompt — GYA-16 NASA Horizons provider

You are implementing one bounded Project Zenith subtask in an existing TypeScript monorepo.

## Task

Implement **GYA-16: NASA Horizons planetary provider with a 24-hour ephemeris cache**.

Repository: `C:\Users\Gyan\Downloads\zenith`

Read the repository and `README.md` before editing. Preserve its modular `backend/` + `frontend/` structure.

## Strict ownership boundary

Create and modify only:

- `backend/src/providers/nasa-horizons/**`
- `backend/src/providers/nasa-horizons/__tests__/**`
- `backend/package.json` and the root lockfile only if a dependency is genuinely necessary
- an optional provider-specific README inside that folder

Do **not** modify:

- `backend/src/app.ts`
- `backend/src/contracts.ts`
- `backend/src/services/skyState.ts`
- narrator, cultural-name, frontend, or Cesium files
- any other GYA task

This work will be integrated later by the GYA-36 sky-state aggregator. Keep the provider standalone and export a clean public entry point.

## Required behavior

1. Add a NASA JPL Horizons HTTP client using the official Horizons API. No API key is required.
2. Support Mercury, Venus, Mars, Jupiter, Saturn, Uranus, and Neptune. Earth is the observer body and must not be returned as a visible planet.
3. Accept:
   - observer `{ lat, lon, elevationM? }`
   - requested UTC timestamp
   - optional injected `fetch` and clock for deterministic tests
4. Normalize results to provider-owned types compatible with the planned Zenith shape:

```ts
type PlanetEphemeris = {
  id: string;
  kind: "planet";
  name: string;
  position: {
    ra: number;
    dec: number;
    altDeg?: number;
    azDeg?: number;
    distanceKm?: number;
  };
  observedAt: string;
  source: "NASA Horizons";
};
```

5. Implement a 24-hour in-memory cache:
   - deterministic key covering planet, observer coordinates, and ephemeris time window
   - fresh cache hit makes no HTTP request
   - concurrent identical requests share one in-flight promise
   - if Horizons fails and a stale cached entry exists, return it with explicit stale metadata; never silently invent coordinates
6. Parse Horizons responses defensively. Validate all numeric fields and throw a typed provider error for malformed or empty ephemeris data.
7. Add request timeout and clear error categories for timeout, upstream HTTP failure, and parse failure.
8. Do not add Express routes or aggregator wiring.

## Suggested files

```text
backend/src/providers/nasa-horizons/
├── index.ts
├── horizons.client.ts
├── horizons.parser.ts
├── horizons.cache.ts
├── horizons.types.ts
└── __tests__/
    ├── horizons.client.test.ts
    ├── horizons.parser.test.ts
    └── horizons.cache.test.ts
```

## Tests and acceptance criteria

- A representative mocked Horizons response parses into the normalized shape.
- RA/Dec and optional alt/az/distance are finite numbers.
- A second identical request within 24 hours performs zero additional HTTP calls.
- Two simultaneous identical requests perform one HTTP call.
- Cache keys change when observer location or requested window changes.
- Malformed/empty responses throw a typed parse error.
- Upstream failure uses explicitly marked stale cache data only when available.
- `npm.cmd run test -w backend` passes.
- `npm.cmd run build -w backend` passes.

## Handoff

Return:

1. A concise summary.
2. Exact files changed.
3. Tests/build commands and results.
4. The exported provider entry point and example usage for the future GYA-36 aggregator.
5. Any NASA Horizons response-format assumptions.

Work on a separate branch or worktree. Do not merge or overwrite unrelated changes.
