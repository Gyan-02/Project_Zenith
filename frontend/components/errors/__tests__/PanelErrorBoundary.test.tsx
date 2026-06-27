/**
 * GYA-51 — Tests for PanelErrorBoundary
 */

import React from "react";
import { render, screen, cleanup } from "@testing-library/react";
import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { PanelErrorBoundary } from "../PanelErrorBoundary";

afterEach(() => cleanup());

// ---------------------------------------------------------------------------
// A component that throws on demand
// ---------------------------------------------------------------------------

function Bomb({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error("Panel exploded");
  return <div data-testid="panel-content">All good</div>;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("PanelErrorBoundary – no error", () => {
  it("renders children normally when no error occurs", () => {
    render(
      <PanelErrorBoundary>
        <Bomb shouldThrow={false} />
      </PanelErrorBoundary>,
    );
    expect(screen.getByTestId("panel-content")).toBeTruthy();
  });
});

describe("PanelErrorBoundary – error caught", () => {
  // Suppress expected console.error from React's error boundary machinery
  const originalError = console.error;
  beforeEach(() => { console.error = vi.fn(); });
  afterEach(() => { console.error = originalError; });

  it("renders the default fallback when a child throws", () => {
    render(
      <PanelErrorBoundary>
        <Bomb shouldThrow={true} />
      </PanelErrorBoundary>,
    );
    expect(screen.getByTestId("panel-error-boundary-fallback")).toBeTruthy();
    expect(screen.getByTestId("panel-error-boundary-fallback").textContent).toContain(
      "This panel is unavailable.",
    );
  });

  it("shows a custom fallback message when provided", () => {
    render(
      <PanelErrorBoundary fallback="Narrator is currently unavailable.">
        <Bomb shouldThrow={true} />
      </PanelErrorBoundary>,
    );
    expect(screen.getByTestId("panel-error-boundary-fallback").textContent).toContain(
      "Narrator is currently unavailable.",
    );
  });

  it("does not render children after an error", () => {
    render(
      <PanelErrorBoundary>
        <Bomb shouldThrow={true} />
      </PanelErrorBoundary>,
    );
    expect(screen.queryByTestId("panel-content")).toBeNull();
  });
});
