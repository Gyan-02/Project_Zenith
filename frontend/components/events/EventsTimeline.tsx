/**
 * GYA-28 – EventsTimeline component.
 *
 * Wiring note (for GYA-36):
 *   import { EventsTimeline } from "@/components/events/EventsTimeline";
 *   <EventsTimeline location={observerLocation} startUtc={start} endUtc={end} />
 */

import React from "react";
import { useCelestialEvents } from "../../hooks/useCelestialEvents";
import type { CelestialEvent, CelestialEventType } from "../../lib/events";
import { EventPathCard } from "./EventPathCard";

export interface EventsTimelineProps {
  location?: { lat: number; lon: number };
  startUtc?: string;
  endUtc?: string;
  types?: CelestialEventType[];
}

const EVENT_TYPE_LABELS: Record<CelestialEventType, string> = {
  meteor_shower: "Meteor Shower",
  conjunction: "Conjunction",
  eclipse: "Eclipse",
  visibility_window: "Visibility Window",
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    });
  } catch {
    return iso;
  }
}

function EventCard({ event }: { event: CelestialEvent }) {
  return (
    <div data-testid={`event-${event.id}`} style={{ marginBottom: "1rem", borderLeft: "3px solid #6366f1", paddingLeft: "0.75rem" }}>
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
        <span data-testid="event-type-badge" style={{ fontSize: "0.75rem", background: "#1e1b4b", color: "#a5b4fc", padding: "2px 6px", borderRadius: 4 }}>
          {EVENT_TYPE_LABELS[event.type] ?? event.type}
        </span>
        <span data-testid="event-name" style={{ fontWeight: "bold" }}>{event.name}</span>
      </div>
      <div style={{ fontSize: "0.85rem", opacity: 0.75 }}>
        {formatDate(event.startUtc)}
        {event.peakUtc && ` · Peak: ${formatDate(event.peakUtc)}`}
      </div>
      <p data-testid="event-summary" style={{ margin: "0.25rem 0 0", fontSize: "0.875rem" }}>
        {event.summary}
      </p>
      <div data-testid="event-visibility" style={{ fontSize: "0.8rem", opacity: 0.65 }}>
        {event.visibility.rating} — {event.visibility.reason}
      </div>
      {event.metadata?.path && (
        <EventPathCard path={event.metadata.path} eventPeakUtc={event.peakUtc} />
      )}
    </div>
  );
}

export function EventsTimeline({ location, startUtc, endUtc, types }: EventsTimelineProps) {
  const { events, demo, isLoading, error } = useCelestialEvents(location, startUtc, endUtc, types);

  if (!location || !startUtc || !endUtc) {
    return (
      <div data-testid="events-empty">
        Select a location and time window to see upcoming celestial events.
      </div>
    );
  }

  if (isLoading) return <div data-testid="events-loading">Loading events…</div>;

  if (error) return <div data-testid="events-error">Could not load events: {error}</div>;

  if (events.length === 0) {
    return (
      <div data-testid="events-empty">
        {demo && (
          <div style={{ marginBottom: "8px" }}>
            <span
              data-testid="demo-fixture-label"
              style={{
                fontSize: "9px",
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "#fbbf24",
                border: "1px solid rgba(251,191,36,0.35)",
                borderRadius: "4px",
                padding: "1px 5px",
                opacity: 0.85,
              }}
            >
              Demo fixture
            </span>
          </div>
        )}
        No celestial events found for this window.
      </div>
    );
  }

  return (
    <div data-testid="events-timeline">
      {demo && (
        <div style={{ marginBottom: "8px" }}>
          <span
            data-testid="demo-fixture-label"
            style={{
              fontSize: "9px",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "#fbbf24",
              border: "1px solid rgba(251,191,36,0.35)",
              borderRadius: "4px",
              padding: "1px 5px",
              opacity: 0.85,
            }}
          >
            Demo fixture
          </span>
        </div>
      )}
      {events.map((evt) => (
        <EventCard key={evt.id} event={evt} />
      ))}
    </div>
  );
}
