/**
 * GYA-51 — PanelErrorBoundary
 *
 * A React class error boundary for panel-level failures.
 * Prevents a single failing card from blanking the entire demo page.
 *
 * Usage:
 *   <PanelErrorBoundary>
 *     <ObservingConditionsCard ... />
 *   </PanelErrorBoundary>
 */

"use client";

import React from "react";

interface Props {
  children: React.ReactNode;
  /** Custom fallback message (default: "This panel is unavailable.") */
  fallback?: string;
}

interface State {
  hasError: boolean;
}

export class PanelErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Keep this minimal — no external logging, no stack trace in the UI.
    console.warn("[PanelErrorBoundary] Caught panel error:", error.message, info.componentStack);
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div
          data-testid="panel-error-boundary-fallback"
          style={{
            padding: "12px 14px",
            borderRadius: "10px",
            color: "#94a3b8",
            background: "rgba(255, 255, 255, 0.03)",
            fontSize: "12px",
          }}
        >
          {this.props.fallback ?? "This panel is unavailable."}
        </div>
      );
    }
    return this.props.children;
  }
}
