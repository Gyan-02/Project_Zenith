# Project Zenith — Demo Smoke Checklist

Run this before any demo. Expected time: about 5 minutes.

## 1. Environment

- [ ] `npm.cmd run doctor` has no FAIL lines.
- [ ] `http://localhost:3000` opens.
- [ ] `http://localhost:4000/health` is reachable.
- [ ] Warnings for optional keys are understood before demo starts.

## 2. First screen

- [ ] Globe is the hero: Cesium canvas is visible immediately.
- [ ] Top command bar shows Project Zenith, search, location, time, demo/live state, and share action.
- [ ] Left rail is visible on desktop with Sky, Events, Passes, ISS, Layers, Data, Save.
- [ ] Narrator starts as a compact pill; it does not auto-expand.
- [ ] No page-level scrolling is needed to find core tools.
- [ ] No “Calibrating the sky…” spinner is stuck indefinitely.

## 3. One-panel interaction model

- [ ] Open Sky from the left rail.
- [ ] Open Events; Sky closes automatically.
- [ ] Open Passes; Events closes automatically.
- [ ] Re-click the active rail item; the panel closes.
- [ ] Expand and shrink a workspace panel.
- [ ] Globe remains interactive anywhere a visible panel is not covering it.

## 4. Sky tools

- [ ] Sky panel shows conditions and objects above horizon.
- [ ] Events panel shows notable events or a clear empty state.
- [ ] Passes panel shows satellite passes or a clear empty state.
- [ ] ISS panel opens the live video in one click.
- [ ] Layers panel toggles planets, satellites, ISS, stars, constellations, and showers.
- [ ] Data panel explains live/demo/fallback provenance.
- [ ] Save panel exposes snapshot/share actions.

## 5. Search and object details

- [ ] Search “Saturn” from the top command bar.
- [ ] Select Saturn; globe pans/highlights it.
- [ ] Bottom tray updates with selected object context.
- [ ] Open Object details from the tray or rail.
- [ ] Object details show coordinates, provenance, reference, and cultural names.
- [ ] Clear selected object from the tray.

## 6. Cosmic Narrator

- [ ] Click the narrator pill.
- [ ] Ask “Show me Saturn”.
- [ ] Narrator returns a response and navigation target.
- [ ] Bottom tray/globe react to the target; narrator does not replace the tray as the selected-object display.
- [ ] Close the narrator back to the pill.

## 7. Responsive pass

- [ ] At 1280×720, no primary tool requires page scrolling.
- [ ] At mobile width, bottom tabs are usable.
- [ ] Mobile panels are reachable and closable.
- [ ] Narrator remains accessible on mobile.

## 8. Demo mode

- [ ] `http://localhost:3000?demo=1` visibly shows demo mode.
- [ ] Demo mode still supports globe, events, passes, narrator, ISS panel, and snapshot/share.
- [ ] Remove `?demo=1` and clear `localStorage.zenith_demo` to exit demo mode.

## Sign-off

| Checked by | Date | Notes |
|------------|------|-------|
| | | |
