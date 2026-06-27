import React from "react";
import type { EventPath } from "../../lib/events";

interface EventPathCardProps {
  path: EventPath;
  eventPeakUtc?: string;
}

export function EventPathCard({ path, eventPeakUtc }: EventPathCardProps) {
  function handleStandInPath() {
    // Dispatch a custom event to change location and time in the main dashboard
    const locationEvent = new CustomEvent("zenith-change-location", {
      detail: {
        location: {
          id: "reykjavik",
          label: "Reykjavik, Iceland (Totality)",
          lat: 64.1466,
          lon: -21.9426,
          elevationM: 20,
        },
        timeIso: eventPeakUtc || "2026-08-12T18:14:00.000Z",
      },
    });
    window.dispatchEvent(locationEvent);
  }

  function handleAskNarrator() {
    // Pre-fill narrator prompt with a grounded witness question
    const query = `What would an observer see during the ${path.type} on ${eventPeakUtc ? new Date(eventPeakUtc).toLocaleDateString() : "August 12, 2026"} from ${path.bestViewingRegions.join(" or ")}?`;
    const prefillEvent = new CustomEvent("zenith-prefill-narrator", {
      detail: { query },
    });
    window.dispatchEvent(prefillEvent);
  }

  return (
    <div
      data-testid="event-path-card"
      style={{
        marginTop: "0.75rem",
        padding: "0.75rem",
        borderRadius: "8px",
        background: "rgba(99, 102, 241, 0.08)",
        border: "1px dashed rgba(99, 102, 241, 0.25)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.25rem",
          marginBottom: "0.5rem",
        }}
      >
        <span
          style={{
            fontSize: "0.65rem",
            fontWeight: 700,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            color: "#fbbf24",
            background: "rgba(251, 191, 36, 0.1)",
            padding: "2px 6px",
            borderRadius: "4px",
          }}
        >
          Witness Mode
        </span>
      </div>

      <div style={{ fontSize: "0.85rem", marginBottom: "0.4rem", color: "#e2e8f0" }}>
        <strong>Path summary:</strong> {path.summary}
      </div>

      <div style={{ fontSize: "0.85rem", marginBottom: "0.4rem", color: "#e2e8f0" }}>
        <strong>Totality regions:</strong> {path.bestViewingRegions.join(", ")}
      </div>

      <div style={{ fontSize: "0.85rem", marginBottom: "0.5rem", color: "#e2e8f0" }}>
        <strong>Duration:</strong> {path.duration}
      </div>

      <div
        data-testid="path-warning"
        style={{
          fontSize: "0.8rem",
          color: "#fca5a5",
          background: "rgba(239, 68, 68, 0.08)",
          padding: "6px 10px",
          borderRadius: "6px",
          marginBottom: "0.75rem",
          border: "1px solid rgba(239, 68, 68, 0.15)",
        }}
      >
        ⚠️ {path.visibilityFromObserver}
      </div>

      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <button
          type="button"
          data-testid="stand-in-path-btn"
          onClick={handleStandInPath}
          style={{
            flex: 1,
            minWidth: "120px",
            padding: "6px 12px",
            fontSize: "0.8rem",
            fontWeight: 500,
            borderRadius: "6px",
            background: "linear-gradient(135deg, #6366f1, #4f46e5)",
            color: "#ffffff",
            border: "none",
            cursor: "pointer",
            transition: "opacity 0.2s",
          }}
          onMouseOver={(e) => (e.currentTarget.style.opacity = "0.9")}
          onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
        >
          📍 Stand in the path
        </button>

        <button
          type="button"
          data-testid="ask-narrator-btn"
          onClick={handleAskNarrator}
          style={{
            flex: 1,
            minWidth: "150px",
            padding: "6px 12px",
            fontSize: "0.8rem",
            fontWeight: 500,
            borderRadius: "6px",
            background: "rgba(255, 255, 255, 0.08)",
            color: "#e2e8f0",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            cursor: "pointer",
            transition: "background 0.2s",
          }}
          onMouseOver={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.12)")}
          onMouseOut={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)")}
        >
          💬 Ask narrator what you would see
        </button>
      </div>
    </div>
  );
}
