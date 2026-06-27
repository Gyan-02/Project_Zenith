"use client";

import type { ReactNode } from "react";
import type { ZenithPanel } from "./shell.types";

interface ZenithShellProps {
  children: ReactNode;
  topBar: ReactNode;
  leftRail: ReactNode;
  rightDock: ReactNode;
  bottomTray: ReactNode;
  mobileTabs: ReactNode;
  activePanel: ZenithPanel | null;
  expandedPanel: ZenithPanel | null;
  panelTitle?: string;
  panelEyebrow?: string;
  panelContent?: ReactNode;
  onClosePanel(): void;
  onToggleExpand(): void;
}

export function ZenithShell({
  children,
  topBar,
  leftRail,
  rightDock,
  bottomTray,
  mobileTabs,
  activePanel,
  expandedPanel,
  panelTitle,
  panelEyebrow,
  panelContent,
  onClosePanel,
  onToggleExpand,
}: ZenithShellProps) {
  const isExpanded = Boolean(activePanel && expandedPanel === activePanel);

  return (
    <main className="zenith-shell">
      <div className="globe-layer">{children}</div>
      {topBar}
      {leftRail}
      {rightDock}
      {bottomTray}
      {mobileTabs}

      {activePanel && panelContent ? (
        <aside className={`workspace-panel${isExpanded ? " workspace-panel-expanded" : ""}`} aria-label={panelTitle}>
          <header className="workspace-panel-header">
            <div>
              {panelEyebrow ? <p className="eyebrow">{panelEyebrow}</p> : null}
              <h2>{panelTitle}</h2>
            </div>
            <div className="workspace-panel-actions">
              <button type="button" onClick={onToggleExpand} aria-label={isExpanded ? "Shrink panel" : "Expand panel"}>
                {isExpanded ? "Shrink" : "Expand"}
              </button>
              <button type="button" onClick={onClosePanel} aria-label="Close panel">×</button>
            </div>
          </header>
          <div className="workspace-panel-body">{panelContent}</div>
        </aside>
      ) : null}
    </main>
  );
}
