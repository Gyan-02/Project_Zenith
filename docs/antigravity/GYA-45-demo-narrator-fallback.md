# GYA-45 — Demo Narrator Fallback

Goal: make the Cosmic Narrator demo-safe when `GEMINI_API_KEY` is missing or the live LLM call fails.

Right now demo mode protects sky-state, conditions, events, and passes. Narrator still uses the normal `/api/narrate` route. For a hackathon demo, we need graceful behavior instead of a dead narrator panel.

## Scope

### Backend-first option preferred

- Add `backend/src/narrator/demoNarrator.ts`
- Integrate inside the existing narrate route/service path
- Add tests near existing narrator route tests

### Frontend fallback allowed only if backend integration is too invasive

- Keep it contained inside `frontend/hooks/useNarrator.ts`
- Clearly label fallback responses as demo/fallback content

## Requirements

1. If `GEMINI_API_KEY` is missing or the live narrator fails, return a deterministic fallback response for common demo prompts.
2. Cover at least these user prompts:
   - `Show me Saturn`
   - `What is the Moon?`
   - `What is visible tonight?`
   - `Where is the ISS?`
3. Fallback response shape must still satisfy `NarrationResponseSchema`.
4. If the fallback suggests navigation, it must target known object ids only.
5. The UI should not show a scary error for normal fallback use.

## Acceptance checks

- `npm.cmd run test -w backend` passes if backend route is touched.
- `npm.cmd run test -w frontend` passes if frontend hook is touched.
- Asking “Show me Saturn” works without a Gemini key.
- Response text clearly feels demo-safe, not fake-live.

## Boundaries

- Do not invent real-time facts.
- Do not call external APIs.
- Do not bypass existing response schemas.

