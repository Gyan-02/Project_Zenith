# GYA-47 — Accessibility + Responsive Polish Pass

Goal: make the current MVP easier to demo on laptops and smaller screens without breaking the core layout.

Focus on practical polish: keyboard, screen-reader labels, focus states, and responsive overlap fixes.

## Scope

### Candidate files

- `frontend/app/page.tsx`
- `frontend/app/globals.css`
- `frontend/components/search/ObjectSearchPanel.tsx`
- `frontend/components/narrator/CosmicNarrator.tsx`
- `frontend/components/controls/ObserverControls.tsx`
- `frontend/components/globe/ObjectDetailsPanel.tsx`

Touch only what is necessary.

## Requirements

1. Verify major controls are reachable by keyboard:
   - search
   - narrator input
   - share link
   - time controls
   - layer toggles
2. Add missing `aria-label` / `aria-live` where useful.
3. Improve focus-visible styling for buttons and inputs.
4. Reduce overlap between:
   - search panel
   - brand bar
   - narrator panel
   - Tonight panel
5. Keep mobile behavior demo-safe, even if not perfect.

## Acceptance checks

- `npm.cmd run test -w frontend` passes.
- `npm.cmd run build -w frontend` passes.
- Keyboard-only user can search and select an object.
- No obvious panel overlap at widths around 1366px, 1024px, and 390px.

## Boundaries

- No product feature rewrites.
- No new UI library.
- Keep styling in existing CSS files or tiny component CSS files.

