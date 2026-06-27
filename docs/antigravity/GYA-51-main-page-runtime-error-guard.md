# GYA-51 — Main Page Runtime Error Guard

Goal: avoid a full blank screen if one frontend panel fails during demo.

The demo page has many panels. One failing card should not kill the whole app.

## Scope

### New files

- `frontend/components/errors/PanelErrorBoundary.tsx`
- `frontend/components/errors/__tests__/PanelErrorBoundary.test.tsx`

### Modify

- `frontend/app/page.tsx`

## Requirements

1. Create a reusable client error boundary for panel-level failures.
2. Wrap risky panel sections:
   - Tonight panel cards
   - Object details
   - Narrator
3. Fallback UI should be small and demo-friendly:
   - “This panel is unavailable.”
   - no scary stack traces
4. Do not hide globe-level failures.

## Acceptance checks

- `npm.cmd run test -w frontend` passes.
- `npm.cmd run build -w frontend` passes.
- Error boundary test proves fallback renders.

## Boundaries

- Do not wrap the entire app shell.
- Do not swallow errors silently without fallback UI.

