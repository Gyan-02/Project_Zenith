# GYA-44 — Panel Shell Integration Pass

Goal: use the new panel primitives in the actual app so the UI feels intentional and easier to maintain.

The primitives already exist:

- `frontend/components/panels/Panel.tsx`
- `frontend/components/panels/PanelHeader.tsx`
- `frontend/components/panels/CollapsiblePanel.tsx`

Now wire them into the main page in a careful, minimal way.

## Scope

### Modified files

- `frontend/app/page.tsx`
- `frontend/app/globals.css`

### Optional new files

- `frontend/components/layout/TonightPanel.tsx`
- `frontend/components/layout/AppChrome.tsx`

Only create layout files if it makes the page cleaner. Avoid dumping more code into `page.tsx`.

## Requirements

1. Replace the ad-hoc Tonight panel heading/body shell with panel primitives.
2. Keep all existing cards:
   - Conditions
   - Sky events
   - Satellite passes
   - Snapshot
3. Preserve existing behavior and API calls.
4. Use `CollapsiblePanel` for at least one dense panel on small screens.
5. Keep the visual style close to the existing glassmorphism look.

## Acceptance checks

- `npm.cmd run test -w frontend` passes.
- `npm.cmd run build -w frontend` passes.
- Desktop layout still shows the Tonight panel.
- Mobile layout is not worse than before; no giant overlapping panel pile.

## Boundaries

- Do not touch backend.
- Do not rewrite `ObserverControls`.
- Do not change feature logic; this is layout composition only.

