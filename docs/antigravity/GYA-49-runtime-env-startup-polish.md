# GYA-49 — Runtime Env + Startup Polish

Goal: make first-time local startup less confusing.

The code builds, but demo users still need clear env and startup behavior.

## Scope

### Modify

- `README.md`
- `docs/demo-runbook.md`
- `backend/.env.example`
- `frontend/.env.example`

### Optional new file

- `docs/local-startup.md`

## Requirements

1. Document the fastest demo startup path:
   - install deps
   - set demo mode
   - run backend/frontend
   - open browser URL
2. Clearly separate:
   - required for demo mode
   - optional for live data
   - optional for Cesium ion
3. Add troubleshooting for:
   - port 3000 already in use
   - port 4000 already in use
   - missing Gemini key
   - missing OpenWeather key
   - blank globe
4. Make `npm run doctor` and `npm run smoke` meaning crystal clear.

## Acceptance checks

- A teammate can run the app from README without asking questions.
- Env examples match actual code names.
- No product code changes unless a doc reveals a real bug.

## Boundaries

- Do not add scripts unless necessary.
- Do not rename env vars.

