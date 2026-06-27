# Antigravity Prompt — GYA-38 Demo Script README

You are working in the Project Zenith repo.

Goal: write a concise demo-runbook markdown file for Project Zenith.

## Context

The repo has:

- `npm run doctor`
- `npm run dev`
- backend and frontend workspaces
- optional live API keys
- graceful degradation

This is documentation only.

## Hard boundaries

Own only:

- `docs/demo-runbook.md`

Do not modify code.

## Requirements

Write a practical runbook covering:

1. Pre-demo checklist
   - `npm install`
   - `npm run doctor`
   - env vars
   - Cesium assets

2. How to run locally
   - backend/frontend dev command
   - expected ports

3. Demo storyline
   - open globe
   - change time/location
   - ask narrator to show Saturn/Jupiter/Moon
   - inspect object details
   - show cultural names
   - show Tonight panel
   - copy share link

4. Failure modes
   - missing Gemini key
   - missing OpenWeather key
   - NASA/CelesTrak unavailable
   - frontend/backend not running

5. Recovery
   - refresh
   - restart dev server
   - proceed with degraded/fallback data

Acceptance:

- Clear and concise.
- No code changes.
- Useful for a teammate running the demo cold.

Final handoff: summarize the sections.
