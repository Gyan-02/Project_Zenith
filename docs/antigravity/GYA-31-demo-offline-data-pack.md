# Antigravity Prompt — GYA-31 Demo Offline Data Pack

You are working in the Project Zenith repo.

Goal: create a deterministic offline demo data pack that can be used when live APIs are unavailable during demo day.

## Context

Project Zenith already has live/fallback backend modules:

- `backend/src/services/skyState.ts`
- `backend/src/conditions/**`
- `backend/src/predictions/events/**`
- `backend/src/predictions/passes/**`

This task should create data and pure loaders only. Do not wire it into app routes yet.

## Hard boundaries

Own only:

- `data/demo/**`
- `backend/src/demo/**`
- `backend/src/demo/**/*.test.ts`

Do not modify:

- `backend/src/app.ts`
- `backend/src/services/**`
- `backend/src/routes/**`
- `frontend/**`
- package manager files

## Requirements

Create:

- `data/demo/sky-state-patna.json`
- `data/demo/conditions-patna.json`
- `data/demo/events-2026.json`
- `data/demo/passes-patna.json`
- `backend/src/demo/demo.types.ts`
- `backend/src/demo/demo.loader.ts`
- tests

The demo data should be realistic enough for UI demos, but clearly labelled as demo/fallback data.

Loader API:

- `loadDemoSkyState()`
- `loadDemoConditions()`
- `loadDemoEvents()`
- `loadDemoPasses()`

Tests:

- each fixture loads
- timestamps are valid ISO strings
- object ids are stable
- no fixture is empty

Acceptance:

- `npm.cmd run test -w backend` passes
- `npm.cmd run build -w backend` passes
- no wiring changes

Final handoff: report files and how to wire later.
