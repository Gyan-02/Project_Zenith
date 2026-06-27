/**
 * GYA-37 — Panel
 *
 * Reusable glassmorphism panel shell. Composes PanelHeader internally.
 *
 * Props:
 *   heading      — required panel title
 *   headingLevel — h* level (default 2)
 *   eyebrow      — optional label above heading
 *   actions      — optional node in header action slot
 *   children     — panel body content
 *   className    — appended to root element
 *   style        — forwarded to root element
 */

import React from "react";
import { PanelHeader } from "./PanelHeader";
import "./panel.css";

export interface PanelProps {
  heading: string;
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  eyebrow?: string;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function Panel({
  heading,
  headingLevel = 2,
  eyebrow,
  actions,
  children,
  className = "",
  style,
}: PanelProps) {
  return (
    <section className={`zp-panel ${className}`} style={style} aria-label={heading}>
      <PanelHeader
        heading={heading}
        headingLevel={headingLevel}
        eyebrow={eyebrow}
        actions={actions}
      />
      <div className="zp-panel-body">{children}</div>
    </section>
  );
}
