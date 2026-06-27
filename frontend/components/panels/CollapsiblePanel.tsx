/**
 * GYA-37 — CollapsiblePanel
 *
 * Wraps Panel with a toggle button that collapses/expands the body using
 * CSS grid animation (no layout thrash). Fully keyboard-accessible.
 *
 * Props:
 *   heading       — panel title (forwarded to PanelHeader)
 *   headingLevel  — h* level (default 2)
 *   eyebrow       — optional eyebrow label
 *   actions       — extra nodes in the action slot (toggle button is always added)
 *   defaultOpen   — initial open state (default true)
 *   children      — body content
 *   className     — appended to root
 *   style         — forwarded to root
 *
 * Accessibility:
 *   - toggle button: aria-expanded, aria-controls (links to body id)
 *   - body div: id, aria-hidden when collapsed
 *   - keyboard: Space / Enter on button toggles (native button behaviour)
 */

"use client";

import React, { useId, useState } from "react";
import { PanelHeader } from "./PanelHeader";
import "./panel.css";

export interface CollapsiblePanelProps {
  heading: string;
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  eyebrow?: string;
  /** Additional nodes appended before the toggle button in the actions slot */
  actions?: React.ReactNode;
  defaultOpen?: boolean;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function CollapsiblePanel({
  heading,
  headingLevel = 2,
  eyebrow,
  actions,
  defaultOpen = true,
  children,
  className = "",
  style,
}: CollapsiblePanelProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const bodyId = useId();

  const toggleButton = (
    <button
      type="button"
      className="zp-collapse-toggle"
      aria-expanded={isOpen}
      aria-controls={bodyId}
      aria-label={isOpen ? `Collapse ${heading}` : `Expand ${heading}`}
      onClick={() => setIsOpen((prev) => !prev)}
    >
      <span className="zp-collapse-toggle-icon" aria-hidden="true" />
    </button>
  );

  const combinedActions = (
    <>
      {actions}
      {toggleButton}
    </>
  );

  return (
    <section
      className={`zp-panel ${className}`}
      style={style}
      aria-label={heading}
      data-collapsed={!isOpen}
    >
      <PanelHeader
        heading={heading}
        headingLevel={headingLevel}
        eyebrow={eyebrow}
        actions={combinedActions}
      />

      {/* CSS grid-template-rows animation avoids auto height issues */}
      <div
        id={bodyId}
        className="zp-collapsible-body"
        aria-hidden={!isOpen}
      >
        <div className="zp-collapsible-inner zp-panel-body">{children}</div>
      </div>
    </section>
  );
}
