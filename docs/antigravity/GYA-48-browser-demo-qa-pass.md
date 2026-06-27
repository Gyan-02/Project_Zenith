# GYA-48 — Browser Demo QA Pass

Goal: run the app locally and produce a concrete bug list for the demo path.

This is a QA ticket first. Fix only tiny obvious issues; otherwise document them clearly.

## Scope

### Read

- `docs/demo-smoke-checklist.md`
- `docs/demo-runbook.md`

### May touch

- `docs/demo-qa-notes.md`
- tiny CSS fixes in `frontend/app/globals.css` only if they are clearly safe

## Steps

1. Start the app:
   - `npm.cmd run dev`
2. Open:
   - `http://localhost:3000/?demo=1`
3. Run through the smoke checklist.
4. Record each issue with:
   - page/action
   - expected result
   - actual result
   - severity: blocker / high / medium / low
   - suggested owner file if obvious

## Acceptance checks

- `docs/demo-qa-notes.md` exists.
- It includes a final summary:
  - can demo now: yes/no
  - blockers count
  - high issues count
  - medium/low issues count

## Boundaries

- Do not perform big rewrites.
- Do not change backend logic.
- Do not add new dependencies.

