# Project Zenith

Project Zenith is an AI-powered digital twin of the sky. The repo contains a Cesium globe, conversational AI narrator, celestial event engine, satellite pass predictions, observing conditions, and a shared typed HTTP boundary — all wired together as a single-workspace monorepo.

## Repository map

```text
zenith/
├── backend/
│   └── src/
│       ├── intent/              # Five-way NL intent classification
│       ├── cultural-names/      # Cultural name lookup and cacheable routes
│       ├── knowledge/           # Corpus, embeddings, Chroma adapter, seeding
│       ├── narrator/            # Grounded prompt, Gemini chain, nav target resolver
│       ├── conditions/          # OpenWeather observing-conditions integration
│       ├── predictions/         # Satellite pass prediction and celestial event engine
│       ├── educational-reference/ # Object reference lookup service
│       ├── routes/              # All Express API routers
│       ├── app.ts               # Express composition root
│       ├── config.ts            # Environment configuration
│       ├── contracts.ts         # Zod schemas and shared backend types
│       └── server.ts            # Backend entry point
├── frontend/
│   ├── app/                     # Next.js app shell, global CSS design system
│   ├── components/
│   │   ├── globe/               # Cesium scene, sky renderer, selection helpers
│   │   ├── narrator/            # Cosmic Narrator chat panel
│   │   ├── panels/              # Reusable Panel / CollapsiblePanel shell (GYA-37)
│   │   ├── search/              # Object search / quick-nav panel (GYA-40)
│   │   ├── conditions/          # Observing-conditions card
│   │   ├── events/              # Events timeline card
│   │   ├── passes/              # Satellite-passes card
│   │   ├── snapshot/            # Snapshot export button
│   │   ├── cultural-names/      # Cultural names card
│   │   └── educational-reference/ # Educational reference card
│   ├── hooks/                   # React hooks (sky state, narrator, demo mode…)
│   ├── lib/                     # API client, navigation bus, sky state types, demo mode
│   └── scripts/                 # Cesium static-asset setup
├── data/
│   ├── cultural-names/          # JSON Schema, dataset, and traditions registry
│   └── educational-reference/   # Object reference JSON dataset
├── docs/
│   ├── antigravity/             # Per-ticket spec prompts
│   ├── demo-runbook.md          # How to run a demo
│   └── demo-smoke-checklist.md  # Pre-demo verification checklist
├── scripts/                     # Cross-workspace tools (doctor, validators)
├── package.json                 # Workspace commands
└── tsconfig.base.json           # Shared TypeScript rules
```

## Quick start

### 1. Install

```powershell
npm.cmd install
```

### 2. Configure environment

```powershell
# Backend — required for narration; all other keys are optional
Copy-Item backend\.env.example backend\.env
# Add your GEMINI_API_KEY (and optionally OPENWEATHER_API_KEY) to backend\.env

# Frontend — all values have working defaults for local dev
Copy-Item frontend\.env.example frontend\.env.local
```

### 3. Seed the narrator corpus (first run)

```powershell
npm.cmd run seed
```

### 4. Run

```powershell
npm.cmd run dev
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend | http://localhost:4000 |
| Health check | http://localhost:4000/health |

---

## Environment variables

### Backend (`backend/.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GEMINI_API_KEY` | Recommended | — | AI narration. Fallback response used if missing. |
| `OPENWEATHER_API_KEY` | Optional | — | Live observing conditions. Card shows degraded state if missing. |
| `CHROMA_URL` | Optional | `http://localhost:8000` | Local Chroma URL or Chroma Cloud host. In-memory lexical fallback used if missing. |
| `CHROMA_API_KEY` | Optional | â€” | Chroma Cloud API key. If set, backend uses Chroma Cloud token auth. |
| `CHROMA_TENANT` | Optional | â€” | Chroma Cloud tenant, if your dashboard requires it. |
| `CHROMA_DATABASE` | Optional | â€” | Chroma Cloud database name. Recommended: `zenith`. |
| `CHROMA_COLLECTION` | Optional | `zenith-knowledge` | ChromaDB collection name. |
| `PORT` | Optional | `4000` | Backend HTTP port. |
| `FRONTEND_ORIGIN` | Optional | `http://localhost:3000` | CORS allow-list origin. |
| `GEMINI_MODEL` | Optional | `gemini-2.5-flash` | Gemini model name. |
| `SATELLITE_LIMIT` | Optional | `6000` | Max TLE records loaded at startup. |
| `ZENITH_DEMO_MODE` | Optional | `false` | Force all endpoints to return demo data. |

### Frontend (`frontend/.env.local`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | Optional | `http://localhost:4000` | Backend base URL. |
| `NEXT_PUBLIC_CESIUM_ION_TOKEN` | Optional | — | Cesium ion terrain/imagery. Globe works without it. |
| `NEXT_PUBLIC_DEMO_MODE` | Optional | — | Set to `1` to start in demo mode. |

---

## Demo mode

Demo mode routes all API calls to `/api/demo/*` endpoints that return
pre-baked data, so the app runs without live API keys or an internet connection.

**Activate demo mode in any of three ways:**

1. **URL param** — append `?demo=1` to any URL and reload.
2. **localStorage** — in the browser console: `localStorage.setItem('zenith_demo','1')` and reload.
3. **Env var** — set `NEXT_PUBLIC_DEMO_MODE=1` in `frontend/.env.local` (always-on for that build).

Demo mode is remembered across page reloads (localStorage). To disable: remove the param and run `localStorage.removeItem('zenith_demo')` in the browser console.

---

## Commands

| Command | Description |
|---------|-------------|
| `npm.cmd run dev` | Start frontend + backend together |
| `npm.cmd run test` | Run all tests (backend + frontend) |
| `npm.cmd run build` | Build both workspaces for production |
| `npm.cmd run seed` | Upsert narrator corpus into ChromaDB |
| `npm.cmd run doctor` | Pre-demo readiness check |
| `npm.cmd run test -w frontend` | Frontend tests only |
| `npm.cmd run test -w backend` | Backend tests only |
| `npm.cmd run validate:cultural-names` | Validate the cultural-names dataset |

### What `npm run doctor` means

```
✓ [OK  ]  — check passed
⚠ [WARN]  — non-fatal; demo can proceed but feature may be degraded
✗ [FAIL]  — structural problem; fix before demoing
```

Exit code 0 = structurally OK (warnings allowed).
Exit code 1 = at least one FAIL.

---

## Architecture notes

### Navigation bus

`frontend/lib/navigationBus.ts` is a tiny pub/sub singleton. The Cosmic Narrator publishes a `NavigationTarget` (e.g. `{ kind: "planet", id: "saturn", label: "Saturn" }`) and the Cesium scene subscribes independently. **The globe and narrator never import each other.**

### Panel system (GYA-37)

`frontend/components/panels/` provides three reusable primitives — `Panel`, `PanelHeader`, `CollapsiblePanel` — built on CSS custom properties from `globals.css`. Import from the barrel:

```tsx
import { CollapsiblePanel } from "../components/panels";
```

### Object search (GYA-40)

`frontend/components/search/ObjectSearchPanel` filters sky objects already held in frontend state and emits through `navigationBus` — no backend round-trip.

### Selection highlight (GYA-41)

`frontend/components/globe/selection-style.ts` provides `applySelectionStyle`, `clearSelectionStyle`, and `highlightSelected` helpers that operate on Cesium entities without coupling to the renderer class.

---

## Narration contract

`POST /api/narrate`

```json
{
  "query": "Show Saturn",
  "location": { "lat": 25.61, "lon": 85.14, "label": "Patna, India" },
  "timeIso": "2026-06-24T12:00:00.000Z",
  "selectedObjectId": "saturn"
}
```

Response includes grounded narration, optional citations, and an optional `navigationTarget`. Position data is never computed by Gemini: it is accepted only from the sky-state service.
