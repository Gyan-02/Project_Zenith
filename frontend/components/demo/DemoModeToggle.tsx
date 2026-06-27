"use client";

/**
 * GYA-43 — DemoModeToggle: clickable badge that switches between Live / Demo data.
 *
 * Calls enable()/disable() from useDemoMode() then reloads the page so all
 * route resolutions (resolvePath) pick up the new mode.
 *
 * Place near the brand bar in page.tsx:
 *   <DemoModeToggle />
 */

import React from "react";
import { useDemoMode } from "../../hooks/useDemoMode";
import "./demo-mode.css";

export function DemoModeToggle() {
  const { isDemo, enable, disable } = useDemoMode();

  function handleClick() {
    if (isDemo) {
      disable();
      const url = new URL(window.location.href);
      url.searchParams.delete("demo");
      window.location.assign(url.toString());
      return;
    } else {
      enable();
    }
    // Reload so all API paths are re-resolved via resolvePath()
    window.location.reload();
  }

  return (
    <button
      type="button"
      className="demo-toggle"
      data-demo={String(isDemo)}
      data-testid="demo-toggle"
      aria-label={isDemo ? "Switch to live data" : "Switch to demo data"}
      aria-pressed={isDemo}
      onClick={handleClick}
    >
      <span className="demo-toggle-dot" aria-hidden="true" />
      {isDemo ? "Demo data" : "Live data"}
    </button>
  );
}
