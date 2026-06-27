"use client";

import type { ZenithPanel } from "./shell.types";

interface MobileTabBarProps {
  activePanel: ZenithPanel | null;
  narratorOpen: boolean;
  onTogglePanel(panel: ZenithPanel): void;
  onToggleNarrator(): void;
}

export function MobileTabBar({ activePanel, narratorOpen, onTogglePanel, onToggleNarrator }: MobileTabBarProps) {
  return (
    <nav className="mobile-tab-bar" aria-label="Mobile workspace tools">
      <button type="button" className={activePanel === "conditions" ? "mobile-tab-active" : ""} onClick={() => onTogglePanel("conditions")}>
        Sky
      </button>
      <button type="button" className={narratorOpen ? "mobile-tab-active" : ""} onClick={onToggleNarrator}>
        Ask
      </button>
      <button type="button" className={activePanel === "events" ? "mobile-tab-active" : ""} onClick={() => onTogglePanel("events")}>
        Events
      </button>
      <button type="button" className={activePanel === "passes" ? "mobile-tab-active" : ""} onClick={() => onTogglePanel("passes")}>
        Passes
      </button>
      <button type="button" className={activePanel === "iss" ? "mobile-tab-active" : ""} onClick={() => onTogglePanel("iss")}>
        ISS
      </button>
    </nav>
  );
}
