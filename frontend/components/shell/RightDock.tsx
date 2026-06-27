"use client";

import { CosmicNarrator } from "../narrator/CosmicNarrator";
import type { ViewerContext } from "../../lib/narration";

interface RightDockProps {
  context: ViewerContext;
  isOpen: boolean;
  onOpen(): void;
  onClose(): void;
}

export function RightDock({ context, isOpen, onOpen, onClose }: RightDockProps) {
  if (!isOpen) {
    return (
      <aside className="right-dock right-dock-pill" aria-label="Cosmic Narrator">
        <button type="button" className="narrator-launch-pill" onClick={onOpen}>
          <span className="narrator-orb narrator-orb-small" aria-hidden="true" />
          <span>
            <span className="eyebrow">Ask Zenith</span>
            <strong>Cosmic Narrator</strong>
          </span>
        </button>
      </aside>
    );
  }

  return (
    <aside className="right-dock right-dock-open" aria-label="Cosmic Narrator dock">
      <button type="button" className="right-dock-close" onClick={onClose} aria-label="Close Cosmic Narrator">
        ×
      </button>
      <CosmicNarrator context={context} forceOpen />
    </aside>
  );
}
