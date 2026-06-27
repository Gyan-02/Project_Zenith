# Antigravity Prompt — GYA-33 Snapshot Export Foundation

You are working in the Project Zenith repo.

Goal: create a frontend snapshot/share artifact helper for exporting the current sky view metadata. Do not capture Cesium canvas yet; just prepare the non-visual share artifact model.

## Context

Project Zenith already has:

- `frontend/lib/share/**`
- `frontend/lib/skyState.ts`
- share-link wiring in `frontend/app/page.tsx`

This task should create a pure frontend library only.

## Hard boundaries

Own only:

- `frontend/lib/snapshot/**`
- `frontend/lib/snapshot/**/*.test.ts`

Do not modify:

- `frontend/app/**`
- `frontend/components/**`
- `backend/**`
- package manager files

## Requirements

Implement:

- `SkySnapshotMetadata`
- `createSkySnapshotMetadata(input)`
- `buildSnapshotFileName(metadata)`
- `serializeSnapshotMetadata(metadata)`

Metadata should include:

- project name
- location label/lat/lon
- time UTC
- selected object id/name if present
- visible layers
- share URL if present
- generated timestamp

Tests:

- stable filename slug
- serialization is valid JSON
- optional selected object handled
- generated timestamp injectable for deterministic tests

Acceptance:

- `npm.cmd run test -w frontend` passes
- `npm.cmd run build -w frontend` passes
- no UI wiring

Final handoff: explain how canvas screenshot export can use this later.
