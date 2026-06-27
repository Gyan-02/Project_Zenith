# Project Zenith — Full UI Remake Plan

Last updated: 2026-06-27

## Current truth

The core product works. Do not rebuild the backend or redo data integrations.

Working systems:

- Live sky-state / globe rendering
- Live planets, stars, ISS, satellites, paths, provenance
- Gemini narrator
- Chroma-backed knowledge retrieval
- OpenWeather conditions
- CelesTrak satellite pass predictions
- Sky events, eclipse path cards, ISS live video
- Demo mode fallback
- Search, navigation bus, object details, share link, snapshot metadata

The problem is presentation. The UI currently feels like many static cards stacked around the globe. It is hard to scan, hard to minimize, and not demo-polished.

Goal: make Project Zenith feel like a clean “mission control for the sky,” not a dashboard dump.

---

## Product goal

Create a new frontend shell where the globe is the hero and every feature is reachable through compact, movable/collapsible surfaces.

The user should be able to:

1. See the sky immediately.
2. Access major tools without scrolling through long panels.
3. Minimize or expand every major pane.
4. Keep the narrator available without it blocking the view.
5. Open ISS video, events, passes, conditions, and object details from a clean command layout.
6. Present the project confidently in a hackathon demo.

---

## Non-negotiables

- Do not break existing backend routes.
- Do not remove existing features.
- Do not put everything into one giant component.
- Keep component tree clean.
- Keep mobile/tablet usable.
- Keep demo mode visible and obvious.
- Keep live/demo/provenance labels.
- Prefer CSS + React state; avoid adding heavy UI libraries unless absolutely necessary.

### Core interaction model

Use one active workspace panel at a time.

- Opening any left-rail panel closes/minimizes the currently open left-rail panel.
- Users can reopen any minimized panel from the rail.
- Panels are not all independently open by default.
- At most one left-rail workspace panel should be expanded at once.
- The narrator is separate from the left-rail accordion, but it still must not cover important globe controls.
- The globe remains interactive unless a visible panel physically covers that part of the screen.

---

## Proposed new layout

### Desktop layout

```text
┌──────────────────────────────────────────────────────────────┐
│ Top command bar: logo | search | location/time | live/demo   │
├───────────────┬──────────────────────────────────┬───────────┤
│ Left rail     │                                  │ Right dock │
│ icon buttons  │          Cesium globe hero        │ narrator  │
│ Conditions    │                                  │ minimized │
│ Events        │                                  │ or open    │
│ Passes        │                                  │           │
│ ISS Live      │                                  │           │
│ Layers        │                                  │           │
│ Share         │                                  │           │
└───────────────┴──────────────────────────────────┴───────────┘

Bottom tray: selected object / current event / pass details
```

### Mobile layout

```text
┌────────────────────────────┐
│ Compact top bar            │
├────────────────────────────┤
│ Globe                      │
│                            │
├────────────────────────────┤
│ Bottom tab bar             │
│ Sky | Ask | Events | More  │
└────────────────────────────┘
```

---

## Task 1 — New app shell architecture

Create a clear shell structure:

```text
frontend/components/shell/
  ZenithShell.tsx
  TopCommandBar.tsx
  LeftToolRail.tsx
  RightDock.tsx
  BottomTray.tsx
  MobileTabBar.tsx
  shell.types.ts
```

Responsibilities:

- `ZenithShell` owns layout state only.
- Feature cards remain in their own folders.
- Shell decides which panel is open/minimized.
- No feature logic inside shell components.

Panel state model:

```ts
type ZenithPanel =
  | "conditions"
  | "events"
  | "passes"
  | "iss"
  | "layers"
  | "object"
  | "narrator"
  | "snapshot";
```

Accordion rule:

- `activePanel: ZenithPanel | null` is the source of truth for left-rail panels.
- Clicking a rail item sets `activePanel` to that panel.
- Clicking the already-active rail item minimizes/closes it.
- Opening a different rail item replaces the old active panel.

Acceptance:

- No long static left-side stack.
- User can open any major tool from the rail.
- Only one left-rail panel is open at once.
- Globe stays visually dominant.

---

## Task 2 — Universal panel behavior

Upgrade panels so all major panes can:

- minimize
- expand
- close
- remember their open state during the session
- fit inside viewport without forcing page scroll

Suggested structure:

```text
frontend/components/panels/
  FloatingPanel.tsx
  DockedPanel.tsx
  PanelChrome.tsx
  usePanelState.ts
```

Rules:

- Conditions, events, passes, ISS video, narrator, object details all use same panel chrome.
- Scroll only inside panel body, not whole page.
- Panel header always stays visible.
- Clear icons/buttons: minimize, expand, close.

Layering / z-index rules:

- Cesium globe canvas stays at the base layer.
- Top command bar, left rail, right dock, bottom tray, and floating panels sit above the globe.
- Use explicit z-index tokens instead of random values.
- Suggested order:
  - globe canvas: `z-index: 0`
  - globe overlays/labels: `z-index: 5`
  - top command bar / left rail / bottom tray: `z-index: 20`
  - docked/floating panels: `z-index: 30`
  - modals/expanded panels: `z-index: 40`
- Do not put a full-screen transparent overlay above Cesium unless a modal is open.
- Pointer events should pass to the globe anywhere not physically covered by a visible panel.

Acceptance:

- No panel should force the whole app page to scroll just to find content.
- User can collapse ISS video, narrator, passes, events independently.
- On laptop screens, panels do not cover the entire globe unless expanded.

---

## Task 3 — Reposition ISS live video

Current issue: ISS video is buried inside the “Tonight” stack.

New behavior:

- ISS Live gets its own left-rail button.
- When clicked, open a floating/docked video panel.
- Default state:
  - closed in live mode
  - optionally highlighted/available in demo mode
- Add compact teaser button: “Watch ISS live”.

Component remains:

```text
frontend/components/iss/IssLiveVideoCard.tsx
```

But it should be hosted by the shell, not buried in the static left stack.

Acceptance:

- ISS video is accessible in one click.
- It does not consume vertical space unless opened.
- Video panel can be minimized while audio/video remains stopped or hidden.

---

## Task 4 — Narrator redesign

Current issue: narrator is large and blocks the globe.

New behavior:

- Narrator defaults to compact chat pill on load.
- Narrator must never auto-expand.
- Expanded state opens a polished chat drawer.
- User can minimize it back to a pill.
- Suggested questions stay visible only in expanded mode or as compact chips.

States:

```ts
type NarratorMode = "pill" | "dock" | "expanded";
```

Acceptance:

- Narrator is always accessible.
- Narrator does not dominate the initial screen.
- “Ask about this sky…” remains easy to find.
- If a narrator answer includes a navigation target, BottomTray/object state should react.

Source-of-truth rule:

- `BottomTray` is the source of truth for selected object/event/pass presentation.
- Narrator may publish navigation targets and consume selected-object context.
- Narrator must not own selected-object display state.
- Object selection flows into BottomTray first; Narrator reads that context second.

---

## Task 5 — Replace static control panel with command bar + drawers

Current issue: location, time, layers, share, legend all sit in one heavy panel.

New behavior:

- Top command bar contains:
  - Project Zenith mark
  - global object search
  - location selector
  - time control / Now
  - live/demo toggle
- Layers move into a small drawer/panel from the left rail.
- Data legend moves into a provenance/info drawer.
- Share button becomes a compact icon/action in the command bar or bottom tray.

Acceptance:

- Location/time are visible without opening a panel.
- Layers are accessible but not always taking space.
- Data legend does not occupy main screen space.

---

## Task 6 — Events and passes become compact cards + detail drawer

Current issue: long lists eat vertical space.

New behavior:

- Left rail opens “Events” or “Passes”.
- The panel initially shows only top 3 items.
- “View all” opens an expanded drawer.
- Each item can be clicked to show detail in bottom tray.

Events card:

- Show next notable event.
- Show event date and type.
- If event has path metadata, show “Witness mode” CTA.

Passes card:

- Show next 3 passes.
- Highlight ISS if present.
- Show source/provenance.

Acceptance:

- User can understand the next important event/pass in 3 seconds.
- Long lists do not overwhelm the main view.

---

## Task 7 — Bottom tray for selected object and contextual details

Create:

```text
frontend/components/shell/BottomTray.tsx
```

It should show context-sensitive details:

- selected object
- selected satellite pass
- selected sky event
- active narrator target

State ownership:

- BottomTray owns the presentation of the current selected object/event/pass.
- Other components can request selection changes through existing callbacks/events.
- Narrator consumes the selected context for grounded chat, but does not replace BottomTray.

Acceptance:

- Selecting an object no longer needs a big permanent panel.
- Bottom tray can collapse to a small label.
- Bottom tray does not block globe navigation.

---

## Task 8 — Visual design polish

Make the app feel premium/demo-ready:

- reduce heavy borders
- consistent glass/space panel style
- consistent spacing scale
- better typography hierarchy
- stronger empty/loading states
- smoother transitions
- avoid horizontal scrollbars
- avoid tiny unreadable text
- improve button labels/icons

Suggested design language:

- dark translucent glass
- cyan/violet accents
- compact mission-control labels
- clear status chips: LIVE, DEMO, STATIC, FALLBACK

Acceptance:

- First screen looks intentionally designed.
- Nothing important appears accidental or buried.
- Looks good at 1280×720, 1440×900, and mobile width.

---

## Task 9 — Responsive behavior pass

Breakpoints:

- desktop: rail + dock + globe
- tablet: top bar + overlay panels
- mobile: bottom tab bar

Acceptance checks:

- 1280×720: no page-level scroll needed for primary tools.
- 390×844 mobile: bottom tabs usable, narrator accessible.
- Panels remain reachable and closable.

---

## Task 10 — QA and demo script alignment

Update:

```text
docs/demo-smoke-checklist.md
docs/final-demo-script.md
docs/demo-runbook.md
```

Demo flow after UI remake:

1. Open globe.
2. Search Saturn.
3. Ask narrator “What am I looking at?”
4. Open passes panel.
5. Open events panel and Witness Mode.
6. Open ISS live as a deliberate wow moment.
7. Toggle demo/live.

Acceptance:

- Demo script matches the UI.
- No instruction says “scroll down until you find…”

---

## Implementation order

1. Build shell state + layout skeleton.
2. Move existing panels into shell without redesigning internals.
3. Add minimize/close behavior.
4. Move ISS live out of Tonight stack.
5. Redesign narrator states.
6. Convert events/passes into compact + expanded patterns.
7. Add bottom tray.
8. Polish CSS/responsive.
9. Update docs.
10. Browser QA.

---

## Out of scope

- New backend APIs
- New orbital physics
- New AI features
- Authentication
- Push notifications
- Real eclipse path geometry beyond existing metadata
- Replacing Cesium

---

## Definition of done

- `npm.cmd run build` passes.
- `npm.cmd run test -w frontend` passes.
- `npm.cmd run test -w backend` passes unless backend untouched.
- Browser visual QA passes at desktop and mobile widths.
- User can access every feature without long scrolling.
- Every major panel can be minimized/closed.
- Globe remains the visual hero.
