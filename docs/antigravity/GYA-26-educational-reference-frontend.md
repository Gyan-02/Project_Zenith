# Antigravity Prompt — GYA-26 Educational Reference Frontend Module

You are working in the Project Zenith repo.

Goal: build a small frontend module that can show educational facts for a selected sky object using the existing educational-reference backend service shape.

## Context

Project Zenith already has:

- `backend/src/educational-reference/**`
- `frontend/components/globe/ObjectDetailsPanel.tsx`
- `frontend/lib/skyState.ts`

This task should create a frontend library/hook/card only. Do not wire it into the main app page yet.

## Hard boundaries

Own only these files:

- `frontend/lib/educationalReference.ts`
- `frontend/hooks/useEducationalReference.ts`
- `frontend/components/educational-reference/**`
- `frontend/components/educational-reference/**/*.test.tsx`

Do not modify:

- `frontend/app/**`
- `frontend/components/globe/**`
- `backend/**`
- package manager files

If the backend route is not mounted yet, write the client against the future endpoint and make the hook degrade gracefully.

## Requirements

Future endpoint:

`GET /api/reference/:objectId`

Implement:

1. Type definitions for:
   - `EducationalReference`
   - `QuickFact`

2. API helper:
   - `getEducationalReference(objectId: string, signal?: AbortSignal)`
   - Fetches from `${NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/api/reference/:objectId`
   - Treats 404 as `null`.

3. React hook:
   - `useEducationalReference(objectId?: string)`
   - Returns `{ reference, isLoading, error }`.
   - Aborts stale requests.

4. Component:
   - `EducationalReferenceCard`
   - Props:
     - `objectId?: string`
     - optional preloaded `reference`
   - Shows:
     - one-line summary
     - why it matters
     - quick facts
     - observation tips
     - kid-friendly summary
   - Empty state when no object/reference is available.

5. Tests:
   - Helper builds expected URL.
   - Hook handles undefined objectId.
   - Card renders Saturn reference.
   - Card renders empty state.

## Acceptance criteria

- `npm.cmd run test -w frontend` passes.
- `npm.cmd run build -w frontend` passes.
- No backend changes.
- No main page wiring.

## Final handoff

Report:

- Files changed.
- Component props.
- Expected endpoint.
- Where to wire it later.
