# Antigravity Prompt — GYA-36 Snapshot Export UI Component

You are working in the Project Zenith repo.

Goal: create a frontend-only UI component that prepares/copies snapshot metadata using the existing snapshot foundation. Do not capture the Cesium canvas yet.

## Context

Project Zenith has:

- `frontend/lib/snapshot/**`
- share-link support
- `frontend/components/controls/ObserverControls.tsx`

This task should create a reusable component only.

## Hard boundaries

Own only:

- `frontend/components/snapshot/**`
- `frontend/components/snapshot/**/*.test.tsx`

Do not modify:

- `frontend/app/**`
- `frontend/components/controls/**`
- `frontend/components/globe/**`
- `backend/**`
- package manager files

## Requirements

Create `SnapshotExportButton`.

Props:

- `location`
- `timeUtc`
- `selectedObject?`
- `layers`
- `shareUrl?`

Behavior:

- Builds snapshot metadata using `createSkySnapshotMetadata`.
- Copies serialized JSON to clipboard.
- Shows short copied/error status.
- If clipboard is unavailable, renders a fallback `<textarea readonly>` with metadata.

Tests:

- builds metadata with selected object
- copies to clipboard
- fallback renders when clipboard throws
- no selected object handled

Acceptance:

- `npm.cmd run test -w frontend` passes
- `npm.cmd run build -w frontend` passes
- no app/page wiring

Final handoff: tell where to wire later.
