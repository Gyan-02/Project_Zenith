# GYA-43 — Demo Mode UI Toggle + Status Badge

Goal: make demo mode visible and controllable from the frontend UI.

The foundation already exists in:

- `frontend/lib/demoMode.ts`
- `frontend/hooks/useDemoMode.ts`
- demo endpoint routing for sky-state, conditions, events, and passes

Build a small UI layer so the presenter does not need browser console commands.

## Scope

### New files

- `frontend/components/demo/DemoModeToggle.tsx`
- `frontend/components/demo/DemoModeBadge.tsx`
- `frontend/components/demo/demo-mode.css`
- `frontend/components/demo/__tests__/DemoModeToggle.test.tsx`

### Modified files

- `frontend/app/page.tsx`
- optionally `frontend/app/globals.css` only for positioning wrapper classes

## Requirements

1. Render a compact demo-mode badge/toggle near the existing top UI.
2. Use `useDemoMode()`.
3. Show clear labels:
   - `Live data`
   - `Demo data`
4. Toggle should call `enable()` / `disable()` and then refresh the page or clearly prompt refresh if required.
5. When `?demo=1` is active, the badge should show demo mode as active.
6. Do not remap unsupported routes like `/api/narrate`, `/api/reference`, or `/api/cultural-names`.

## Acceptance checks

- `npm.cmd run test -w frontend` passes.
- `npm.cmd run build -w frontend` passes.
- In browser, `?demo=1` visibly shows demo mode enabled.
- User can disable demo mode from UI.

## Boundaries

- Do not rewrite `demoMode.ts` unless you find a bug.
- Do not change backend demo routes.
- Keep the component small and reusable.

