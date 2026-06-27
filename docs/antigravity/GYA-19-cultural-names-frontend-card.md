# Antigravity Prompt — GYA-19 Cultural Names Frontend Card

You are working in the Project Zenith repo.

Goal: build a small frontend module that displays cultural names for the currently selected sky object. This should consume the existing cultural-names backend API, but should not wire into the main page yet.

## Context

Project Zenith already has:

- `data/cultural-names/**`
- `backend/src/cultural-names/**`
- `GET /api/cultural-names`
- `GET /api/cultural-names/:objectId`
- `frontend/components/globe/ObjectDetailsPanel.tsx`
- `frontend/lib/navigationBus.ts`

This task should create a reusable frontend card/hook only.

## Hard boundaries

Own only these files:

- `frontend/lib/culturalNames.ts`
- `frontend/hooks/useCulturalNames.ts`
- `frontend/components/cultural-names/**`
- `frontend/components/cultural-names/**/*.test.tsx`

Do not modify:

- `frontend/app/**`
- `frontend/components/globe/**`
- `frontend/components/narrator/**`
- `backend/**`
- package manager files

If integration is needed, leave a handoff note instead of editing the main page.

## Requirements

Implement:

1. Frontend API helper
   - `getCulturalNamesForObject(objectId: string, signal?: AbortSignal)`
   - Fetch from `${NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/api/cultural-names/:objectId`
   - Return typed data.
   - Handle 404 as an empty result, not a thrown fatal error.

2. React hook
   - `useCulturalNames(objectId?: string)`
   - Tracks `data`, `isLoading`, `error`.
   - Aborts stale requests when objectId changes.

3. Component
   - `CulturalNamesCard`
   - Props:
     - `objectId?: string`
     - `selectedTraditionId?: string`
   - Shows:
     - tradition name
     - cultural name
     - pronunciation if present
     - meaning/story if present
   - Empty state: “No cultural names loaded for this object yet.”

4. Tests
   - API helper builds correct URL.
   - Hook handles missing objectId.
   - Card renders a Vedic/Jupiter style entry if supplied.
   - Card renders empty state.

## Acceptance criteria

- `npm.cmd run test -w frontend` passes.
- `npm.cmd run build -w frontend` passes.
- No backend changes.
- No app/page wiring.

## Final handoff

Report:

- Files changed.
- Component props.
- API shape expected from backend.
- Where to wire it later.
