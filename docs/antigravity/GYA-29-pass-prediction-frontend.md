# Antigravity Prompt — GYA-29 Satellite Pass Prediction Frontend Module

You are working in the Project Zenith repo.

Goal: build a frontend pass-prediction module using the mounted `/api/passes` endpoint.

## Context

Project Zenith now has:

- `backend/src/predictions/passes/**`
- mounted `GET /api/passes`
- `frontend/lib/locations.ts`
- `frontend/components/globe/**`

Create frontend-only reusable pieces. Do not wire into the main page yet.

## Hard boundaries

Own only these files:

- `frontend/lib/passes.ts`
- `frontend/hooks/usePassPredictions.ts`
- `frontend/components/passes/**`
- `frontend/components/passes/**/*.test.tsx`

Do not modify:

- `frontend/app/**`
- `frontend/components/globe/**`
- `backend/**`
- package manager files

## Requirements

Implement:

1. Types/API helper
   - `PassPrediction`
   - `PassesResponse`
   - `getPassPredictions({ lat, lon, elevationM?, startUtc, endUtc, minElevationDeg? }, signal?)`
   - Calls `/api/passes`.

2. Hook
   - `usePassPredictions(location?, startUtc?, endUtc?, minElevationDeg?)`
   - Returns `{ passes, provenance, isLoading, error, refresh }`
   - Aborts stale requests.

3. Component
   - `PassPredictionsCard`
   - Props:
     - `location?: { lat: number; lon: number; elevationM?: number; label?: string }`
     - `startUtc?: string`
     - `endUtc?: string`
   - Shows next visible passes sorted by rise time.
   - Shows object/satellite name if present, rise/peak/set times, max elevation, direction if present.
   - Friendly empty state.
   - Friendly unavailable state for provider failure.

4. Tests
   - API helper builds expected query.
   - Hook handles missing inputs.
   - Card renders a fixture pass.
   - Empty/unavailable states render.

## Acceptance criteria

- `npm.cmd run test -w frontend` passes.
- `npm.cmd run build -w frontend` passes.
- No backend changes.
- No page wiring.

## Final handoff

Report files changed, component props, expected endpoint shape, and where to wire it later.
