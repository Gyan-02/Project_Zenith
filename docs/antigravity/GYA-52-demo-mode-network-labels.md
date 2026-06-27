# GYA-52 — Demo Mode Network Labels

Goal: make demo/fallback data visibly identifiable in the UI.

When demo mode is active, the presenter should be able to tell which cards are using fixture data.

## Scope

### Candidate files

- `frontend/components/demo/DemoModeBadge.tsx`
- `frontend/components/conditions/ObservingConditionsCard.tsx`
- `frontend/components/events/EventsTimeline.tsx`
- `frontend/components/passes/PassPredictionsCard.tsx`
- `frontend/app/globals.css`

## Requirements

1. If an API response has `demo: true` or demo provenance, show a subtle “Demo fixture” label.
2. Do this only where response shape already exposes provenance/demo status.
3. Keep the label small and non-disruptive.
4. Avoid adding fake labels to live data.

## Acceptance checks

- `npm.cmd run test -w frontend` passes.
- `npm.cmd run build -w frontend` passes.
- Demo mode shows at least one visible fixture label.

## Boundaries

- Do not change backend payloads unless absolutely necessary.
- Do not label narrator as fixture unless its response explicitly indicates fallback.

