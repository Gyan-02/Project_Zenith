# Antigravity Prompt — GYA-37 Responsive Panel Shell

You are working in the Project Zenith repo.

Goal: create reusable frontend panel primitives for collapsible/mobile-friendly dashboard cards.

## Context

The main page now has:

- control panel
- tonight panel
- narrator panel
- object details card

The CSS is becoming crowded. This task should create isolated reusable shell components only.

## Hard boundaries

Own only:

- `frontend/components/panels/**`
- `frontend/components/panels/**/*.test.tsx`

Do not modify:

- `frontend/app/**`
- existing components
- backend
- package manager files

## Requirements

Create:

- `Panel`
- `PanelHeader`
- `CollapsiblePanel`

Behavior:

- accessible heading support
- optional eyebrow text
- optional action slot
- collapsible body with button and `aria-expanded`
- keyboard accessible
- no external dependencies

Tests:

- renders heading/eyebrow
- collapses/expands
- `aria-expanded` updates
- action slot renders

Acceptance:

- `npm.cmd run test -w frontend` passes
- `npm.cmd run build -w frontend` passes
- no wiring yet

Final handoff: show example usage for Tonight panel.
