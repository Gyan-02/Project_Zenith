/**
 * GYA-37 — PanelHeader
 *
 * Standalone header row. Use this when you need just the header portion,
 * or compose it inside <Panel>.
 *
 * Props:
 *   heading     — the h* text (rendered as the level given by `headingLevel`)
 *   headingLevel — defaults to 2
 *   eyebrow     — optional small label above the heading (e.g. "Tonight")
 *   actions     — optional slot rendered to the right of the title
 *   id          — optional id for aria-labelledby on a sibling body
 */

import "./panel.css";

export interface PanelHeaderProps {
  heading: string;
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  eyebrow?: string;
  actions?: React.ReactNode;
  id?: string;
  className?: string;
}

import React from "react";

export function PanelHeader({
  heading,
  headingLevel = 2,
  eyebrow,
  actions,
  id,
  className = "",
}: PanelHeaderProps) {
  const Tag = `h${headingLevel}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

  return (
    <div className={`zp-panel-header ${className}`} id={id}>
      <div className="zp-panel-header-titles">
        {eyebrow && <span className="zp-panel-eyebrow">{eyebrow}</span>}
        <Tag className="zp-panel-heading">{heading}</Tag>
      </div>
      {actions && <div className="zp-panel-actions">{actions}</div>}
    </div>
  );
}
