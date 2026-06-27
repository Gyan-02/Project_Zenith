# GYA-50 — Demo Data Coverage Audit

Goal: ensure demo mode has enough believable data for the visible UI.

Demo mode is now wired. The next risk is thin or mismatched demo data.

## Scope

### Read

- `data/demo/**`
- `backend/src/routes/demo.ts`
- frontend cards consuming demo data

### May modify

- `data/demo/sky-state-patna.json`
- `data/demo/conditions-patna.json`
- `data/demo/events-2026.json`
- `data/demo/passes-patna.json`
- backend demo loader tests if data shape changes

## Requirements

1. Ensure object search has useful searchable objects:
   - Saturn
   - Moon
   - ISS
   - Jupiter
   - at least one bright star
2. Ensure demo events panel has at least 3 events.
3. Ensure demo passes panel has at least 2 useful passes.
4. Ensure conditions show friendly values, not empty placeholders.
5. Ensure all demo data is clearly labelled as demo/fallback provenance.

## Acceptance checks

- `npm.cmd run test -w backend` passes.
- `npm.cmd run test -w frontend` passes if frontend fixtures/tests are touched.
- In demo mode, the visible cards are not empty.

## Boundaries

- Do not invent live real-time claims.
- Keep demo data realistic but clearly fixture-based.

