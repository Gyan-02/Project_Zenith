# Project Zenith — Local Startup Guide

This guide gets you from zero to a running demo in under 10 minutes.

---

## Fastest demo path (offline, no API keys needed)

```powershell
# 1. Install all dependencies (once)
npm.cmd install

# 2. Copy env files (once)
Copy-Item backend\.env.example backend\.env
Copy-Item frontend\.env.example frontend\.env.local

# 3. Start the app
npm.cmd run dev
```

Then open: **http://localhost:3000?demo=1**

That's it. Demo mode serves pre-baked fixture data — no Gemini key, no OpenWeather key, no internet required.

---

## What each env variable does

### Backend (`backend/.env`)

| Variable | Required for demo | Required for live | Description |
|----------|:-----------------:|:-----------------:|-------------|
| `GEMINI_API_KEY` | No | Recommended | Enables live AI narration. Without it, the narrator returns canned educational responses. |
| `OPENWEATHER_API_KEY` | No | Optional | Enables live observing conditions. Without it, the conditions card shows a degraded state. |
| `CHROMA_URL` | No | Optional | Local Chroma URL, or Chroma Cloud host. Falls back to lexical search if no Chroma config is set. |
| `CHROMA_API_KEY` | No | Optional | Chroma Cloud API key. If set, backend uses Chroma Cloud token auth. |
| `CHROMA_TENANT` | No | Optional | Chroma Cloud tenant. Usually optional unless the dashboard shows one explicitly. |
| `CHROMA_DATABASE` | No | Optional | Chroma Cloud database name. Recommended: `zenith`. |
| `CHROMA_COLLECTION` | No | Optional | ChromaDB collection name. Default: `zenith-knowledge`. |
| `PORT` | No | No | HTTP port. Default: `4000`. |
| `FRONTEND_ORIGIN` | No | No | CORS allowed origin. Default: `http://localhost:3000`. |
| `GEMINI_MODEL` | No | No | Gemini model name. Default: `gemini-2.5-flash`. |
| `SATELLITE_LIMIT` | No | No | Max TLE records to load. Default: `6000`. |
| `ZENITH_DEMO_MODE` | No | No | Force demo mode at backend level (overrides per-request). |

### Frontend (`frontend/.env.local`)

| Variable | Required | Description |
|----------|:--------:|-------------|
| `NEXT_PUBLIC_API_URL` | No | Backend URL. Default: `http://localhost:4000`. |
| `NEXT_PUBLIC_CESIUM_ION_TOKEN` | No | Cesium ion terrain token. Globe works without it. |
| `NEXT_PUBLIC_DEMO_MODE` | No | Set to `1` to always start in demo mode. |

---

## Demo mode options

| Method | How |
|--------|-----|
| URL param | `http://localhost:3000?demo=1` |
| UI toggle | Click the "Live data / Demo data" badge in the top bar |
| localStorage | `localStorage.setItem('zenith_demo','1')` then reload |
| Env var (build-time) | `NEXT_PUBLIC_DEMO_MODE=1` in `frontend/.env.local` |

To exit demo mode: remove `?demo=1` **and** click the toggle (or run `localStorage.removeItem('zenith_demo')`).

---

## Pre-demo readiness checks

```powershell
npm.cmd run doctor   # structural check (workspaces, env vars, ports)
npm.cmd run smoke    # demo-specific check (health + demo endpoint payloads)
```

**Doctor** checks: Node version, workspace files, Cesium assets, env vars, port reachability.  
**Smoke** checks: `/health` → 200, all `/api/demo/*` endpoints return valid JSON.

Both exit 0 if the demo can proceed (warnings are non-fatal).

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| Port 3000 already in use | Another Next.js dev server running | `npx kill-port 3000` or change port via `PORT=3001 npm run dev -w frontend` |
| Port 4000 already in use | Another backend instance | `npx kill-port 4000` or set `PORT=4001` in `backend/.env` |
| Missing `GEMINI_API_KEY` | Key not set | Expected for demo mode — the narrator uses canned responses. For live narration, add key to `backend/.env` and restart. |
| Missing `OPENWEATHER_API_KEY` | Key not set | Expected — conditions card shows "unavailable" in live mode. Use demo mode for fixture data. |
| Blank globe / no stars | Cesium assets missing | Run `npm.cmd run build -w frontend` once to copy Cesium static assets. |
| `npm run doctor` shows FAIL | Structural issue | Read the specific FAIL line — usually a missing `node_modules` or wrong Node version. |
| Narrator returns generic text | No Gemini key | Add `GEMINI_API_KEY` to `backend/.env` and restart backend, or use demo mode canned responses. |

---

## Seeding the narrator corpus (first-time live mode only)

The narrator uses a ChromaDB semantic store. Seed it once:

```powershell
# Requires Chroma running locally:
# docker run -p 8000:8000 chromadb/chroma

npm.cmd run seed
```

For Chroma Cloud, set these in `backend/.env` before seeding:

```env
CHROMA_URL=https://api.trychroma.com
CHROMA_API_KEY=your-chroma-key
CHROMA_DATABASE=zenith
CHROMA_COLLECTION=zenith-knowledge
```

Skip seeding if you're running in demo mode — the narrator fallback doesn't need it.
