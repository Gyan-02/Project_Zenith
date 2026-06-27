# Antigravity Prompt — GYA-32 Globe Constellation Line Helper

You are working in the Project Zenith repo.

Goal: build a Cesium-independent helper for converting constellation line data into renderable sky segments.

## Context

Project Zenith has:

- `frontend/lib/skyState.ts`
- `frontend/components/globe/celestial-projection.ts`
- `frontend/components/globe/sky-state-renderer.ts`

The renderer currently focuses on point objects. This task should prepare constellation line rendering without modifying the renderer yet.

## Hard boundaries

Own only:

- `frontend/components/globe/constellation-lines.ts`
- `frontend/components/globe/__tests__/constellation-lines.test.ts`

Do not modify:

- `frontend/components/globe/sky-state-renderer.ts`
- `frontend/app/**`
- `backend/**`
- package manager files

## Requirements

Implement:

- `buildConstellationSegments(state, atDate?)`

Input:

- `SkyState` with `constellations: Array<{ id, name, points: [{ ra, dec }] }>`

Output:

```ts
Array<{
  id: string;
  constellationId: string;
  name: string;
  start: { altDeg: number; azDeg: number };
  end: { altDeg: number; azDeg: number };
}>
```

Behavior:

- Convert RA/Dec to alt/az using existing projection helper.
- Create one segment per adjacent pair of points.
- Skip invalid constellations with fewer than 2 points.
- Deterministic and pure.

Tests:

- creates N-1 segments
- keeps ids stable
- skips empty/invalid point sets
- output alt/az values are finite

Acceptance:

- `npm.cmd run test -w frontend` passes
- `npm.cmd run build -w frontend` passes
- no renderer/page wiring

Final handoff: explain how to integrate into `SkyStateRenderer` later.
