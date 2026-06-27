# Project Zenith — Demo Runbook

## Pre-demo setup

```powershell
npm.cmd install
```

Create environment files if they do not exist:

```powershell
Copy-Item backend\.env.example backend\.env
Copy-Item frontend\.env.example frontend\.env.local
```

Recommended backend keys:

- `GEMINI_API_KEY` for live narrator responses.
- `OPENWEATHER_API_KEY` for live observing conditions.
- Chroma variables if using Chroma Cloud.

Then run:

```powershell
npm.cmd run seed
npm.cmd run doctor
npm.cmd run dev
```

Expected URLs:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:4000`
- Health: `http://localhost:4000/health`

## Demo UI map

- Top command bar: project mark, object search, location, time, demo/live toggle, share.
- Left rail: Sky, Events, Passes, ISS, Layers, Data, Save.
- Workspace panel: only one rail panel is open at a time.
- Bottom tray: selected object/current context.
- Narrator: starts as a compact pill and opens only when clicked.
- Mobile: bottom tabs replace the left rail.

## Demo mode

Use:

```text
http://localhost:3000?demo=1
```

Demo mode uses safe fixtures for sky-state, conditions, events, passes, and narration fallback. It is the best mode for a guaranteed hackathon run.

To exit demo mode, remove `?demo=1` and clear:

```js
localStorage.removeItem("zenith_demo")
```

## Fast recovery

1. Refresh the browser.
2. Run `npm.cmd run doctor`.
3. Restart `npm.cmd run dev`.
4. Switch to `?demo=1` if any live provider is flaky.

## Final pre-stage checklist

- [ ] Frontend opens.
- [ ] Backend health check passes.
- [ ] Globe renders.
- [ ] Top command bar is visible.
- [ ] Left rail opens one panel at a time.
- [ ] Search Saturn works.
- [ ] Bottom tray updates on selection.
- [ ] Narrator pill opens and closes.
- [ ] ISS panel opens from rail.
- [ ] Events and passes panels show data or clear empty states.
