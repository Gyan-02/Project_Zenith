# Antigravity Prompt — GYA-27 Observing Conditions Frontend Module

You are working in the Project Zenith repo.

Goal: build a frontend module that shows current observing conditions for the selected observer location using the mounted `/api/conditions` endpoint.

## Context

Project Zenith now has:

- `backend/src/conditions/**`
- mounted `GET /api/conditions?lat=...&lon=...&time=...`
- `frontend/components/controls/ObserverControls.tsx`
- `frontend/lib/locations.ts`

This task should create reusable frontend pieces only. Do not wire into the main page yet.

## Hard boundaries

Own only these files:

- `frontend/lib/conditions.ts`
- `frontend/hooks/useObservingConditions.ts`
- `frontend/components/conditions/**`
- `frontend/components/conditions/**/*.test.tsx`

Do not modify:

- `frontend/app/**`
- `frontend/components/controls/**`
- `backend/**`
- package manager files

## Requirements

Implement:

1. API helper
   - `getObservingConditions({ lat, lon, timeUtc }, signal?)`
   - Fetches `${NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/api/conditions`
   - Handles provider-unavailable payloads gracefully.

2. Hook
   - `useObservingConditions(location?, timeUtc?)`
   - Returns `{ conditions, isLoading, error, refresh }`
   - Aborts stale requests.

3. Card
   - `ObservingConditionsCard`
   - Props:
     - `location?: { lat: number; lon: number; label?: string }`
     - `timeUtc?: string`
   - Shows quality, cloud cover, visibility, humidity, temperature, wind if available.
   - Empty state if no location.
   - Friendly unavailable state if API key/provider missing.

4. Tests
   - API helper builds the expected query.
   - Hook stays idle without location.
   - Card renders `Excellent`, `Good`, and unavailable states.

## Acceptance criteria

- `npm.cmd run test -w frontend` passes.
- `npm.cmd run build -w frontend` passes.
- No backend changes.
- No app/page wiring.

## Final handoff

Report files changed, component props, expected endpoint shape, and where to wire it later.
