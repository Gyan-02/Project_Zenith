# GYA-46 — Demo Smoke Script

Goal: add a lightweight automated smoke check that catches obvious demo breakage before a live presentation.

This is not a full browser E2E suite. Keep it small, local, and fast.

## Scope

### New files

- `scripts/demo-smoke.ts`
- `scripts/demo-smoke.test.ts`

### Modified files

- `package.json`
- optionally `README.md`
- optionally `docs/demo-runbook.md`

## Requirements

1. Add root script:
   - `npm run smoke`
2. The smoke script should check:
   - backend health endpoint if port 4000 is running
   - demo endpoints return valid JSON:
     - `/api/demo/sky-state`
     - `/api/demo/conditions`
     - `/api/demo/events`
     - `/api/demo/passes`
   - frontend port 3000 if running
3. If servers are not running, show clear WARN messages, not hard failure.
4. Fail only on structural issues or malformed demo payloads when backend is reachable.
5. Reuse the tone of `npm run doctor`: useful before demo, not noisy.

## Acceptance checks

- `npm.cmd run test:scripts` passes.
- `npm.cmd run smoke` runs without crashing.
- If backend is not running, script exits 0 with a helpful warning.
- If backend is running and a demo endpoint is malformed, script exits 1.

## Boundaries

- Do not add Playwright or heavy browser dependencies.
- Do not require network access.
- Do not replace `npm run doctor`; this complements it.

