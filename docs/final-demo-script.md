# Project Zenith — Final Demo Script

Target length: 3–5 minutes. Open `http://localhost:3000?demo=1` before presenting.

## Opening

“Project Zenith is a real-time digital twin of the sky above you. The globe is powered by live orbital and sky data, while Gemini explains what you’re looking at through a grounded narrator.”

Point to the top command bar and the demo/live badge.

## 1. Globe first

1. Slowly pan the Cesium globe.
2. Point out planets, stars, ISS/satellites, paths, and labels.
3. Say: “The globe stays central. Tools appear only when I ask for them.”

## 2. Command bar and rail

1. Change location from the top command bar.
2. Change time or hit Now.
3. Open Sky from the left rail and show conditions plus objects above horizon.
4. Open Events; note that Sky closes automatically.
5. Open Passes; show upcoming satellite passes.

## 3. Search and selected-object tray

1. Search “Saturn”.
2. Select Saturn and show the globe highlight.
3. Point to the bottom tray: “This is the source of truth for what’s selected.”
4. Open Details from the tray and show coordinates, provenance, educational reference, and cultural names.

## 4. Narrator

1. Click the narrator pill.
2. Ask: “What am I looking at?”
3. Then ask: “Show me Saturn.”
4. Say: “The narrator can guide the globe, but the bottom tray keeps the selected object state clear.”
5. Close narrator back to the pill.

## 5. Wow moments

1. Open ISS from the rail: “ISS live is now deliberate, not buried.”
2. Open Events and point to an eclipse/event path card if present.
3. Toggle Layers to show/hide satellites or constellations.
4. Use Save to show snapshot/share.

## Closing

“Project Zenith combines an interactive sky digital twin, live orbital data, grounded AI narration, and a demo-safe fallback mode in one clear mission-control interface.”

## Backup recoveries

| Issue | Recovery |
|-------|----------|
| Live provider slow | Use `?demo=1`. |
| Narrator unavailable | Check `GEMINI_API_KEY`; continue with search and object details. |
| Conditions unavailable | Add `OPENWEATHER_API_KEY` or use demo mode. |
| Passes unavailable | Wait a few seconds or use demo mode. |
| Globe blank | Hard refresh, restart dev server, then use demo mode if needed. |
