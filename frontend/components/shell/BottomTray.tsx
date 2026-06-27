"use client";

import type { ZenithPanel } from "./shell.types";

interface BottomTrayProps {
  selectedObject?: { id: string; name: string };
  navigationTarget?: { label: string } | null;
  activePanel: ZenithPanel | null;
  isCollapsed: boolean;
  onToggleCollapsed(): void;
  onOpenObject(): void;
  onClearObject(): void;
}

export function BottomTray({
  selectedObject,
  navigationTarget,
  activePanel,
  isCollapsed,
  onToggleCollapsed,
  onOpenObject,
  onClearObject,
}: BottomTrayProps) {
  const headline = selectedObject?.name ?? navigationTarget?.label ?? panelLabel(activePanel) ?? "Sky ready";
  const eyebrow = selectedObject ? "Selected object" : navigationTarget ? "Navigation target" : activePanel ? "Open panel" : "Mission context";

  return (
    <aside className={`bottom-tray${isCollapsed ? " bottom-tray-collapsed" : ""}`} aria-label="Current sky context">
      <button
        type="button"
        className="bottom-tray-toggle"
        onClick={onToggleCollapsed}
        aria-label={isCollapsed ? "Expand context tray" : "Collapse context tray"}
      >
        {isCollapsed ? "⌃" : "⌄"}
      </button>
      <div className="bottom-tray-copy">
        <span>{eyebrow}</span>
        <strong>{headline}</strong>
        {!isCollapsed ? (
          <p>
            {selectedObject
              ? "Object details live here first; the narrator reads this context second."
              : navigationTarget
                ? "The globe is tracking this narrator/search target."
                : "Pick an object, pass, event, or tool without losing the globe."}
          </p>
        ) : null}
      </div>
      {!isCollapsed && selectedObject ? (
        <div className="bottom-tray-actions">
          <button type="button" onClick={onOpenObject}>Details</button>
          <button type="button" onClick={onClearObject}>Clear</button>
        </div>
      ) : null}
    </aside>
  );
}

function panelLabel(panel: ZenithPanel | null): string | undefined {
  switch (panel) {
    case "conditions":
      return "Viewing conditions";
    case "events":
      return "Sky events";
    case "passes":
      return "Satellite passes";
    case "iss":
      return "ISS live stream";
    case "layers":
      return "Layer controls";
    case "object":
      return "Object details";
    case "snapshot":
      return "Snapshot export";
    case "provenance":
      return "Data sources";
    default:
      return undefined;
  }
}
