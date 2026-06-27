# Antigravity Prompt — GYA-23 Celestial Event Prediction Engine

You are working in the Project Zenith repo.

Goal: implement a deterministic backend celestial-event prediction engine for demo-ready sky events such as meteor shower peaks and notable catalogued events.

## Context

Project Zenith is an AI-powered sky digital twin. The repo already has:

- `backend/` Express + TypeScript backend
- `backend/src/providers/**` external science providers
- `backend/src/predictions/passes/**` satellite pass prediction
- `backend/src/services/skyState.ts` sky-state composition

This task should be a pure backend prediction module. It should not touch routes, frontend, or existing providers.

## Hard boundaries

Own only these files:

- `backend/src/predictions/events/**`

Do not modify:

- `backend/src/app.ts`
- `backend/src/server.ts`
- `backend/src/contracts.ts`
- `backend/src/providers/**`
- `backend/src/predictions/passes/**`
- `backend/src/services/**`
- `frontend/**`
- package manager files

If integration is needed, leave a note in your final handoff instead of editing shared files.

## Requirements

Suggested files:

- `backend/src/predictions/events/event.types.ts`
- `backend/src/predictions/events/meteorShowers.ts`
- `backend/src/predictions/events/catalogEvents.ts`
- `backend/src/predictions/events/eventPrediction.service.ts`
- `backend/src/predictions/events/eventPrediction.service.test.ts`
- `backend/src/predictions/events/index.ts`

Implement:

1. Event types
   - `meteor_shower`
   - `conjunction`
   - `eclipse`
   - `visibility_window`

2. Query type
   - `location: { lat: number; lon: number }`
   - `startUtc: string`
   - `endUtc: string`
   - optional `types`

3. Response event shape
   - `id`
   - `type`
   - `name`
   - `startUtc`
   - `endUtc`
   - `peakUtc?`
   - `summary`
   - `visibility`
     - `rating: "Excellent" | "Good" | "Poor" | "Unknown"`
     - `reason`
   - `source`
   - `confidence: "high" | "medium" | "low"`
   - `navigationTarget?`

4. Meteor shower catalog
   - Include at least:
     - Quadrantids
     - Lyrids
     - Eta Aquariids
     - Perseids
     - Orionids
     - Leonids
     - Geminids
     - Ursids
   - Handle annual recurrence for a requested date window.
   - Do not hardcode only the current year.

5. Catalogued notable events
   - Add a small data-driven file for demo events.
   - Be conservative: if exact visibility is not computed, mark `visibility.rating` as `Unknown`.
   - Do not invent precise eclipse/conjunction visibility.

6. Service
   - `predictCelestialEvents(query): CelestialEvent[]`
   - Validate date window.
   - Sort by `startUtc`.
   - Return only events overlapping the query window.
   - Be deterministic and offline.

## Tests

Cover:

- Perseids appears for an August date window.
- Geminids appears across the correct annual window.
- Events are sorted by date.
- Filtering by event type works.
- Invalid date range throws a typed/clear error.
- No current-year-only logic.

## Acceptance criteria

- `npm.cmd run test -w backend` passes.
- `npm.cmd run build -w backend` passes.
- No network calls.
- No shared-route/service/provider changes.
- No changes outside `backend/src/predictions/events/**`.

## Final handoff

Report:

- Files changed.
- Event types supported.
- Known limitations.
- How to integrate later with `/api/events` or sky-state provenance.
