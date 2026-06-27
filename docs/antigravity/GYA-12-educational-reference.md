# Antigravity Prompt — GYA-12 Educational Reference Content

You are working in the Project Zenith repo.

Goal: create a deterministic educational-reference content module that gives concise, trustworthy facts for sky objects. This will later feed the narrator and object detail panels.

## Context

Project Zenith is an AI-powered sky digital twin. The repo already has:

- `backend/` Express + TypeScript backend
- `frontend/` Next.js frontend
- `backend/src/narrator/**` AI narrator pipeline
- `backend/src/knowledge/**` retrieval/knowledge helpers
- `data/cultural-names/**` cultural names dataset

This task should avoid AI calls. It should be deterministic static educational content.

## Hard boundaries

Own only these files:

- `data/educational-reference/**`
- `backend/src/educational-reference/**`

Do not modify:

- `backend/src/app.ts`
- `backend/src/server.ts`
- `backend/src/contracts.ts`
- `backend/src/narrator/**`
- `backend/src/knowledge/**`
- `frontend/**`
- package manager files

If you think another file must change, stop and explain it in your handoff instead of editing it.

## Requirements

Create a small educational content corpus and backend loader/service.

Suggested files:

- `data/educational-reference/schema.json`
- `data/educational-reference/objects.json`
- `backend/src/educational-reference/reference.types.ts`
- `backend/src/educational-reference/reference.loader.ts`
- `backend/src/educational-reference/reference.service.ts`
- `backend/src/educational-reference/reference.router.ts`
- `backend/src/educational-reference/reference.service.test.ts`
- `backend/src/educational-reference/reference.loader.test.ts`

Dataset should include at least:

- Sun
- Moon
- Mercury
- Venus
- Mars
- Jupiter
- Saturn
- Uranus
- Neptune
- ISS
- Sirius
- Polaris
- Orion
- Pleiades

Each entry should include:

- `objectId`
- `name`
- `kind`
- `oneLine`
- `whyItMatters`
- `quickFacts` array
- `observationTips` array
- `kidFriendlySummary`
- `sourceNotes`

Important style:

- Keep copy concise and demo-friendly.
- No fake precision.
- Avoid huge paragraphs.
- Use stable facts that are unlikely to change.

Backend service should support:

- `getReferenceByObjectId(objectId)`
- `searchReferences(query, limit?)`
- `listReferences({ kind? })`

Router should be exported only:

- `createEducationalReferenceRouter(service?: EducationalReferenceService)`

Do not mount it in the main Express app.

## Tests

Cover:

- Dataset validates against schema.
- `getReferenceByObjectId("saturn")` returns Saturn.
- `getReferenceByObjectId("iss")` returns ISS.
- Search finds “Sirius” from a query like “brightest star”.
- Unknown object returns `null` or a typed not-found result.

## Acceptance criteria

- `npm.cmd run test -w backend` passes.
- `npm.cmd run build -w backend` passes.
- Content is stored under `data/educational-reference/**`.
- No AI/network calls.
- No changes outside the allowed files.

## Final handoff

Report:

- Files changed.
- Content coverage.
- Service API.
- How this should later connect to narrator/object detail panels.
