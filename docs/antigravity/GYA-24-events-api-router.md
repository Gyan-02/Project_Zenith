# Antigravity Prompt — GYA-24 Celestial Events API Router

You are working in the Project Zenith repo.

Goal: expose the existing celestial event prediction engine through a backend router factory, without mounting it in the main app yet.

## Context

Project Zenith already has:

- `backend/src/predictions/events/**`
- `predictCelestialEvents(query)`
- Existing Express route patterns under `backend/src/routes/**`

This task should create the route layer only.

## Hard boundaries

Own only these files:

- `backend/src/routes/events.ts`
- `backend/src/routes/__tests__/events.test.ts`

Do not modify:

- `backend/src/app.ts`
- `backend/src/contracts.ts`
- `backend/src/predictions/events/**`
- `frontend/**`
- package manager files

Do not mount the route in `app.ts`. We will wire it later.

## Requirements

Implement:

`createEventsRouter()`

Target future endpoint:

`GET /api/events?lat=25.61&lon=85.14&start=2026-08-01T00:00:00Z&end=2026-08-31T23:59:59Z&type=meteor_shower`

Behavior:

- Validate `lat`, `lon`, `start`, `end`.
- `type` may appear once or multiple times.
- Map query params into the event engine query shape:
  - `location: { lat, lon }`
  - `startUtc`
  - `endUtc`
  - optional `types`
- Return JSON array of events.
- 400 for invalid coordinates/date range/type.
- Do not make network calls.

Tests:

- Valid Perseids query returns a meteor shower event.
- Invalid latitude returns 400.
- Invalid date range returns 400.
- Type filter works.
- Multiple `type` params work.

## Acceptance criteria

- `npm.cmd run test -w backend` passes.
- `npm.cmd run build -w backend` passes.
- No edits outside the allowed files.

## Final handoff

Report:

- Files changed.
- Route query params.
- Mounting instruction, e.g. `app.use("/api/events", createEventsRouter())`.
