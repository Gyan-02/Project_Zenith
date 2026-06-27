# Pass Prediction Engine (GYA-14)

Predicts upcoming satellite passes (rise, peak, set) for any observer location
and time window using CelesTrak TLE data and SGP4 orbital propagation.

## Files

| File | Purpose |
|------|---------|
| `pass-prediction.types.ts` | `PassPrediction`, `PassPredictionQuery`, `VisibilityClassifier`, options |
| `pass-prediction.engine.ts` | `predictPassesForTle`, `predictPasses` — core algorithm |
| `crossing-refinement.ts` | `bisectCrossing`, `findPeakElevation` — numerical refinement helpers |
| `direction.ts` | `azimuthToDirection` — azimuth → 8-point compass |
| `visibility.ts` | Default classifier + injectable test doubles |
| `index.ts` | Public entry point |
| `__tests__/` | Vitest tests |

## Usage

```ts
import { predictPassesForTle, predictPasses, azimuthToDirection } from
  "./predictions/passes/index.js";
import { parseTleCatalog } from "./providers/celestrak/index.js";

// Single satellite
const record = parseTleCatalog(ISS_TLE_STRING)[0]!;
const passes = await predictPassesForTle(record, {
  observer: { lat: 25.61, lon: 85.14, elevationM: 53 },
  startTimeUtc: new Date().toISOString(),
  windowHours: 24,
  minimumElevationDeg: 10,
});

// All active satellites (bounded concurrency)
const allPasses = await predictPasses(catalog.records, query, { concurrency: 8 });

// Cardinal direction
azimuthToDirection(270); // → "W"
```

## Output shape

```ts
type PassPrediction = {
  objectId: string;           // e.g. "sat-25544"
  name: string;               // e.g. "ISS (ZARYA)"
  riseTimeUtc: string;        // ISO-8601 UTC
  peakTimeUtc: string;
  setTimeUtc: string;
  durationSeconds: number;    // positive integer
  maxElevationDeg: number;    // ≥ minimumElevationDeg
  riseAzimuthDeg: number;     // [0, 360)
  setAzimuthDeg: number;
  riseDirection: PassDirection;
  setDirection: PassDirection;
  visible: boolean;           // conservative — requires injected classifier
  source: "CelesTrak TLE + satellite.js SGP4";
};
```

## Algorithm

| Step | Method | Accuracy |
|------|--------|---------|
| Coarse scan | 30 s step over window | ± 30 s |
| Rise/set crossing | Bisection search | ≤ 2 s |
| Peak elevation | Ternary search | ≤ 2 s |

## Visibility

The `visible` field uses a dependency-injected `VisibilityClassifier`.
The default (`CONSERVATIVE_CLASSIFIER`) always returns `false` so passes
are never falsely claimed to be optically visible without proper sun/shadow data.

Inject `SunPositionClassifier` for a low-precision but functional heuristic,
or `makeFixedClassifier(true/false)` in tests.

## Limitations

- No satellite shadow modelling — the `SunPositionClassifier` cannot determine
  whether the satellite is in Earth's shadow at any given moment.
- In-progress passes at the window start are detected but their rise time is
  pinned to the window boundary (not refined backwards).
- Passes that begin and end within a single coarse step (< 30 s) may be missed.
