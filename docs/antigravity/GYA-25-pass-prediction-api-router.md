# Antigravity Prompt — GYA-25 Satellite Pass Prediction API Router

You are working in the Project Zenith repo.

Goal: expose the existing satellite pass prediction engine through a backend router factory, without mounting it in the app yet.

## Context

Project Zenith already has:

- `backend/src/predictions/passes/**`
- CelesTrak/ISS provider work
- Existing route tests under `backend/src/routes/__tests__/**`

This task should create a route layer only. Do not change the prediction engine.

## Hard boundaries

Own only these files:

- `backend/src/routes/passes.ts`
- `backend/src/routes/__tests__/passes.test.ts`

Do not modify:

- `backend/src/app.ts`
- `backend/src/contracts.ts`
- `backend/src/predictions/passes/**`
- `backend/src/providers/**`
- `frontend/**`
- package manager files

Do not mount the route in `app.ts`. We will wire it later.

## Requirements

Implement:

`createPassesRouter(dependencies?)`

Target future endpoint:

`GET /api/passes?lat=25.61&lon=85.14&start=2026-06-25T00:00:00Z&end=2026-06-26T00:00:00Z&minElevationDeg=10`

Behavior:

- Validate `lat`, `lon`, `start`, `end`, optional `minElevationDeg`.
- Use dependency injection so tests do not require live CelesTrak/network calls.
- Return a JSON payload shaped like:

```ts
{
  location: { lat: number; lon: number; elevationM?: number };
  startUtc: string;
  endUtc: string;
  passes: unknown[];
  provenance: Array<{ source: string; fetchedAt: string }>;
}
```

- 400 for invalid query params.
- 503 if dependencies fail and no meaningful response can be produced.

Tests:

- Valid query calls injected predictor with normalized params.
- Invalid latitude returns 400.
- Invalid date range returns 400.
- Optional min elevation defaults sensibly.
- Dependency failure returns 503.

## Acceptance criteria

- `npm.cmd run test -w backend` passes.
- `npm.cmd run build -w backend` passes.
- No network calls in tests.
- No edits outside allowed files.

## Final handoff

Report:

- Files changed.
- Dependency injection shape.
- Mounting instruction, e.g. `app.use("/api/passes", createPassesRouter())`.
