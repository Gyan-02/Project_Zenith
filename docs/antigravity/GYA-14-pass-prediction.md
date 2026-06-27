# Antigravity prompt — GYA-14 satellite pass-prediction engine

You are implementing one bounded Project Zenith subtask in an existing TypeScript monorepo.

## Task

Implement **GYA-14: Build pass prediction engine for ISS and tracked satellites**.

Repository: `C:\Users\Gyan\Downloads\zenith`

Read `README.md` and the existing CelesTrak/SGP4 provider before editing:

- `backend/src/providers/celestrak/**`
- `backend/src/providers/iss/**`
- `backend/src/contracts.ts`

## Strict ownership boundary

Create and modify only:

- `backend/src/predictions/passes/**`
- `backend/src/predictions/passes/__tests__/**`
- an optional provider-specific README in that folder
- `backend/package.json` and the root lockfile only if a dependency is genuinely necessary

Do **not** modify:

- existing provider files
- `backend/src/app.ts`
- `backend/src/contracts.ts`
- `backend/src/services/skyState.ts`
- routes, narrator, cultural-name, frontend, or Cesium files

Do not add an HTTP endpoint. GYA-32/GYA-36 will wire the engine later.

## Existing APIs to reuse

Import rather than duplicate:

```ts
import {
  CelestrakProvider,
  propagateTle,
  type ObserverLocation,
  type TleRecord,
} from "../../providers/celestrak/index.js";
```

`propagateTle(record, observer, at)` returns observer-relative altitude, azimuth, range, RA, and Dec.

## Required public contract

```ts
type PassPrediction = {
  objectId: string;
  name: string;
  riseTimeUtc: string;
  peakTimeUtc: string;
  setTimeUtc: string;
  durationSeconds: number;
  maxElevationDeg: number;
  riseAzimuthDeg: number;
  setAzimuthDeg: number;
  riseDirection: "N" | "NE" | "E" | "SE" | "S" | "SW" | "W" | "NW";
  setDirection: "N" | "NE" | "E" | "SE" | "S" | "SW" | "W" | "NW";
  visible: boolean;
  source: "CelesTrak TLE + satellite.js SGP4";
};

type PassPredictionQuery = {
  observer: { lat: number; lon: number; elevationM?: number };
  startTimeUtc: string;
  windowHours?: number;       // default 24, maximum 72
  minimumElevationDeg?: number; // default 10
  twilightSunAltitudeDeg?: number; // default -6
};
```

Export:

```ts
predictPassesForTle(record, query): Promise<PassPrediction[]>;
predictPasses(records, query, options?): Promise<Map<string, PassPrediction[]>>;
azimuthToDirection(azimuthDeg): PassDirection;
```

## Algorithm requirements

1. Use the existing `propagateTle`; do not implement orbital mathematics again.
2. Scan the requested window at a configurable coarse interval, default 30 seconds.
3. Detect horizon/minimum-elevation crossings.
4. Refine rise and set crossings to within 2 seconds using bisection or equivalent.
5. Refine peak elevation so the reported maximum is not merely the highest coarse sample.
6. Return only completed passes whose maximum elevation reaches the configured threshold.
7. Correctly handle a pass already in progress at the start of the query window.
8. Never return NaN, negative duration, set-before-rise, or duplicate overlapping passes.
9. Batch prediction must apply bounded concurrency; do not launch thousands of unbounded promises.
10. One malformed/decayed TLE must not fail predictions for other records.

## Visibility classification

Set `visible` conservatively. A pass is potentially visible only when:

- maximum elevation meets the threshold, and
- the satellite is plausibly sunlit while the observer is in civil twilight/darkness.

If accurate Sun/shadow inputs are unavailable from existing utilities, isolate this behind a `VisibilityClassifier` dependency and default to `false`. Do not pretend that elevation alone proves optical visibility. Tests may inject a deterministic classifier.

## Suggested structure

```text
backend/src/predictions/passes/
├── index.ts
├── pass-prediction.types.ts
├── pass-prediction.engine.ts
├── crossing-refinement.ts
├── direction.ts
├── visibility.ts
└── __tests__/
    ├── pass-prediction.engine.test.ts
    ├── crossing-refinement.test.ts
    └── direction.test.ts
```

## Tests and acceptance criteria

- Known ISS TLE fixture produces chronologically ordered passes for a fixed observer/window.
- Every pass satisfies `rise < peak < set`, positive duration, and finite angles.
- Rise/set refinement is within 2 seconds of the configured elevation crossing.
- `maxElevationDeg` meets the requested threshold.
- Cardinal direction mapping covers boundary values and normalizes negative/>360° input.
- In-progress passes at the query start are handled deterministically.
- Invalid TLE in a batch is skipped while valid TLE predictions remain.
- Bounded concurrency is verified with an injected worker/predictor or observable scheduler.
- Visibility classification is dependency-injected and never assumes “visible” from elevation alone.
- `npm.cmd run test -w backend` passes.
- `npm.cmd run build -w backend` passes.

## Handoff

Return:

1. Concise implementation summary.
2. Exact files changed.
3. Test/build results.
4. Exported entry points with example usage.
5. Algorithm choices: coarse step, crossing refinement, peak refinement, and complexity.
6. Any limitations around optical visibility.

Work on a separate branch or worktree. Do not merge, overwrite, or reformat unrelated files.
