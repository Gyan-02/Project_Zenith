"use client";

import type { ShellAction, ZenithPanel } from "./shell.types";

const TOOL_ACTIONS: ShellAction[] = [
  {
    id: "conditions",
    label: "Conditions",
    shortLabel: "Sky",
    description: "Viewing conditions and objects overhead",
    icon: "☁",
  },
  {
    id: "events",
    label: "Sky events",
    shortLabel: "Events",
    description: "Meteor showers, eclipses, conjunctions",
    icon: "✦",
  },
  {
    id: "passes",
    label: "Satellite passes",
    shortLabel: "Passes",
    description: "Upcoming ISS and satellite passes",
    icon: "↗",
  },
  {
    id: "iss",
    label: "ISS live",
    shortLabel: "ISS",
    description: "Watch the live ISS stream",
    icon: "▶",
  },
  {
    id: "layers",
    label: "Layers",
    shortLabel: "Layers",
    description: "Toggle planets, stars, satellites and paths",
    icon: "◫",
  },
  {
    id: "provenance",
    label: "Data sources",
    shortLabel: "Data",
    description: "Live, demo and fallback source labels",
    icon: "ⓘ",
  },
  {
    id: "snapshot",
    label: "Snapshot",
    shortLabel: "Save",
    description: "Export a shareable sky snapshot",
    icon: "⌁",
  },
];

interface LeftToolRailProps {
  activePanel: ZenithPanel | null;
  isDemo: boolean;
  hasSelectedObject: boolean;
  onToggle(panel: ZenithPanel): void;
}

export function LeftToolRail({ activePanel, isDemo, hasSelectedObject, onToggle }: LeftToolRailProps) {
  const actions = hasSelectedObject
    ? [
        ...TOOL_ACTIONS.slice(0, 4),
        {
          id: "object" as const,
          label: "Object details",
          shortLabel: "Object",
          description: "Selected object details and cultural names",
          icon: "◎",
        },
        ...TOOL_ACTIONS.slice(4),
      ]
    : TOOL_ACTIONS;

  return (
    <nav className="left-tool-rail" aria-label="Workspace tools">
      {actions.map((action) => {
        const isActive = activePanel === action.id;
        const isIssDemoHint = action.id === "iss" && isDemo;

        return (
          <button
            key={action.id}
            type="button"
            className={`rail-button${isActive ? " rail-button-active" : ""}${isIssDemoHint ? " rail-button-hint" : ""}`}
            aria-pressed={isActive}
            title={action.description}
            onClick={() => onToggle(action.id)}
          >
            <span className="rail-icon" aria-hidden="true">{action.icon}</span>
            <span className="rail-label">{action.shortLabel}</span>
          </button>
        );
      })}
    </nav>
  );
}
