# Antigravity Prompt — GYA-35 Demo Mode API Router

You are working in the Project Zenith repo.

Goal: expose the existing offline demo data pack through a backend router factory, without changing existing live endpoints.

## Context

Project Zenith has:

- `data/demo/**`
- `backend/src/demo/**`
- live routes under `backend/src/routes/**`

This router is for explicit demo fallback endpoints only.

## Hard boundaries

Own only:

- `backend/src/routes/demo.ts`
- `backend/src/routes/__tests__/demo.test.ts`

Do not modify:

- `backend/src/app.ts`
- `backend/src/services/**`
- `backend/src/demo/**`
- `frontend/**`
- package manager files

## Requirements

Create `createDemoRouter()`.

Future mount:

- `GET /api/demo/sky-state`
- `GET /api/demo/conditions`
- `GET /api/demo/events`
- `GET /api/demo/passes`

Each endpoint should return the corresponding loader output from `backend/src/demo/demo.loader.ts`.

Headers:

- `Cache-Control: no-store`
- include a response field or provenance value that clearly labels the payload as demo fallback data.

Tests:

- all four endpoints return 200
- no endpoint returns an empty payload
- cache header is no-store
- payloads are clearly demo-labelled

Acceptance:

- `npm.cmd run test -w backend` passes
- `npm.cmd run build -w backend` passes
- no app.ts mount yet

Final handoff: say exactly how to mount later.
