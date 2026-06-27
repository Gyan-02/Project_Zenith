# Antigravity Prompt — GYA-30 Frontend API Client Foundation

You are working in the Project Zenith repo.

Goal: create a tiny shared frontend API utility layer so all browser-side fetch helpers use the same base URL, query builder, and error handling.

## Context

The frontend now has several API helpers:

- `frontend/lib/skyState.ts` / hook fetch usage
- `frontend/lib/narration.ts`
- `frontend/lib/culturalNames.ts`
- `frontend/lib/educationalReference.ts`
- upcoming `conditions/events/passes` frontend modules

This task should create the shared foundation only. Do not migrate existing helpers yet unless it stays strictly inside the allowed files below.

## Hard boundaries

Own only these files:

- `frontend/lib/api/**`
- `frontend/lib/api/**/*.test.ts`

Do not modify:

- `frontend/app/**`
- `frontend/components/**`
- `frontend/hooks/**`
- existing `frontend/lib/*.ts`
- `backend/**`
- package manager files

## Requirements

Implement:

1. `frontend/lib/api/baseUrl.ts`
   - `getApiBaseUrl()`
   - Returns `process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"`.
   - Normalizes trailing slash.

2. `frontend/lib/api/query.ts`
   - `buildQuery(params)`
   - Supports string/number/boolean/date-like values.
   - Omits `undefined`, `null`, and empty string.
   - Supports arrays by repeating query params.

3. `frontend/lib/api/http.ts`
   - `apiGetJson<T>(path, params?, signal?)`
   - Uses `getApiBaseUrl`.
   - Throws a small typed `ApiError` for non-OK responses.
   - Treats aborts normally; do not swallow AbortError.

4. `frontend/lib/api/index.ts`
   - Re-export public helpers.

5. Tests
   - Base URL trailing slash normalization.
   - Query builder repeated params.
   - Query builder omits empty values.
   - `apiGetJson` success and error behavior with mocked `fetch`.

## Acceptance criteria

- `npm.cmd run test -w frontend` passes.
- `npm.cmd run build -w frontend` passes.
- No migration of existing helpers yet.
- No changes outside `frontend/lib/api/**`.

## Final handoff

Report files changed and show one example of how future helpers should use `apiGetJson`.
