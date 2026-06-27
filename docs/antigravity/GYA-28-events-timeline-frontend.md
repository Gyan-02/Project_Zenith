# Antigravity Prompt — GYA-28 Celestial Events Timeline Frontend Module

You are working in the Project Zenith repo.

Goal: build a frontend timeline/card module for celestial events using the mounted `/api/events` endpoint.

## Context

Project Zenith now has:

- `backend/src/predictions/events/**`
- mounted `GET /api/events`
- `frontend/lib/locations.ts`
- `frontend/lib/timeMachine.ts`

Create frontend-only reusable pieces. Do not wire into the page yet.

## Hard boundaries

Own only these files:

- `frontend/lib/events.ts`
- `frontend/hooks/useCelestialEvents.ts`
- `frontend/components/events/**`
- `frontend/components/events/**/*.test.tsx`

Do not modify:

- `frontend/app/**`
- `frontend/components/globe/**`
- `backend/**`
- package manager files

## Requirements

Implement:

1. Types/API helper
   - `CelestialEvent`
   - `getCelestialEvents({ lat, lon, startUtc, endUtc, types? }, signal?)`
   - Calls `/api/events?lat=...&lon=...&start=...&end=...&type=...`
   - Supports multiple `type` params.

2. Hook
   - `useCelestialEvents(location?, startUtc?, endUtc?, types?)`
   - Returns `{ events, isLoading, error, refresh }`
   - Aborts stale requests.

3. Component
   - `EventsTimeline`
   - Props:
     - `location?: { lat: number; lon: number }`
     - `startUtc?: string`
     - `endUtc?: string`
     - `types?: CelestialEventType[]`
   - Groups/sorts events by date.
   - Shows name, type, summary, peak time, visibility rating.
   - Empty state for no events.

4. Tests
   - API helper serializes multiple types.
   - Hook handles missing inputs.
   - Timeline renders Perseids-like fixture.
   - Empty state renders.

## Acceptance criteria

- `npm.cmd run test -w frontend` passes.
- `npm.cmd run build -w frontend` passes.
- No backend changes.
- No page wiring.

## Final handoff

Report files changed, component props, and where to wire it later.
