/**
 * GYA-43 — DemoModeBadge: read-only status pill.
 *
 * Shows "Live data" or "Demo data" based on the current demo mode state.
 * Accepts the `isDemo` boolean directly (no internal state).
 */

import React from "react";
import "./demo-mode.css";

export interface DemoModeBadgeProps {
  isDemo: boolean;
}

export function DemoModeBadge({ isDemo }: DemoModeBadgeProps) {
  return (
    <span
      className="demo-toggle"
      data-demo={String(isDemo)}
      data-testid="demo-badge"
      aria-label={isDemo ? "Demo data active" : "Live data active"}
    >
      <span className="demo-toggle-dot" aria-hidden="true" />
      {isDemo ? "Demo data" : "Live data"}
    </span>
  );
}
