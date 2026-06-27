# Antigravity Prompt — GYA-34 Project Readiness Doctor

You are working in the Project Zenith repo.

Goal: create a small local readiness checker that reports whether the demo environment is configured.

## Context

Project Zenith depends on optional/live services:

- Gemini API key
- OpenWeather API key
- optional Cesium Ion token
- backend/frontend ports
- Cesium static assets

This task should create a script only. Do not change app code.

## Hard boundaries

Own only:

- `scripts/doctor.ts`
- `scripts/doctor.test.ts`

You may modify root `package.json` only to add:

- `"doctor": "tsx scripts/doctor.ts"`

Do not modify:

- `backend/**`
- `frontend/**`
- package lock files unless absolutely required

## Requirements

`npm.cmd run doctor` should print a friendly checklist:

- Node version
- workspace package availability
- whether `frontend/public/cesium/Cesium.js` exists
- whether `GEMINI_API_KEY` is set
- whether `OPENWEATHER_API_KEY` is set
- whether `NEXT_PUBLIC_API_URL` is set
- whether backend/frontend expected ports are reachable, if possible

Important:

- Do not print secret values.
- Missing optional keys should be warnings, not hard failures.
- Exit code should be `0` unless the project is structurally broken.

Tests:

- redacts secret values
- reports missing Cesium asset
- reports present/missing env vars
- output is stable enough to snapshot/key assertions

Acceptance:

- `npm.cmd run test` passes
- `npm.cmd run build` passes
- `npm.cmd run doctor` runs without crashing

Final handoff: report how to use the command before demos.
