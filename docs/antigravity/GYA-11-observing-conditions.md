# Antigravity Prompt — GYA-11 Observing Conditions Service

You are working in the Project Zenith repo.

Goal: implement the backend observing-conditions module for “is the sky good tonight?” using weather/cloud-cover data, without touching the app wiring yet.

## Context

Project Zenith is an AI-powered sky digital twin. The current repo already has:

- `backend/` Express + TypeScript backend
- `frontend/` Next.js frontend
- `backend/src/contracts.ts` shared backend contracts
- `backend/src/services/skyState.ts` sky-state composition
- `backend/src/predictions/passes/**` pass prediction work
- `data/cultural-names/**` cultural naming dataset

This task should be independent and safe to run in parallel with other frontend/globe/narrator work.

## Hard boundaries

Own only these files:

- `backend/src/conditions/**`
- `backend/src/conditions/**/*.test.ts`

Do not modify:

- `backend/src/app.ts`
- `backend/src/server.ts`
- `backend/src/contracts.ts`
- `frontend/**`
- `data/**`
- package manager files, unless tests cannot run without a tiny dependency and you explain why

If route mounting is needed, export the router from your module and leave a clear note. Do not wire it into the main app.

## Requirements

Build a small, testable module that can later power:

`GET /api/conditions?lat=...&lon=...&time=...`

Suggested files:

- `backend/src/conditions/conditions.types.ts`
- `backend/src/conditions/openweather.client.ts`
- `backend/src/conditions/conditions.service.ts`
- `backend/src/conditions/conditions.router.ts`
- `backend/src/conditions/conditions.service.test.ts`
- `backend/src/conditions/conditions.router.test.ts`

Implement:

1. Types
   - `ObservingConditionsRequest`
   - `ObservingConditionsResponse`
   - `ObservingQuality`
   - `WeatherProvider`

2. OpenWeather client
   - Use `OPENWEATHER_API_KEY`.
   - Keep the client dependency-injectable.
   - Do not make live network calls in tests.
   - If the key is missing, return a typed unavailable result instead of crashing.

3. Quality scoring
   - Use cloud cover as the main score:
     - `0-20%` => `Excellent`
     - `21-60%` => `Good`
     - `61-100%` => `Poor`
   - Include useful supporting fields if available:
     - `cloudCoverPct`
     - `visibilityMeters`
     - `humidityPct`
     - `temperatureC`
     - `windSpeedMps`
   - Include a human-readable `summary`, e.g. “Excellent viewing: low cloud cover.”

4. Router
   - Export `createConditionsRouter(service?: ConditionsService)`.
   - Validate query params.
   - Return 400 for invalid latitude/longitude.
   - Return 503 only when provider failure prevents a meaningful response.

5. Caching
   - Add a simple in-memory cache keyed by rounded lat/lon and hour.
   - TTL: 10 minutes.
   - Tests should prove cached results are reused.

6. Tests
   - Cover scoring thresholds.
   - Cover missing API key/unavailable provider.
   - Cover invalid query params.
   - Cover successful router response with a fake service/provider.

## Acceptance criteria

- `npm.cmd run test -w backend` passes.
- `npm.cmd run build -w backend` passes.
- No live API calls in tests.
- No changes outside the allowed files unless absolutely necessary and clearly explained.

## Final handoff

Report:

- Files changed.
- What API shape you exported.
- How to mount it later.
- Any environment variable required.
