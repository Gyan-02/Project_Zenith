/**
 * GYA-28 – Tests for EventsTimeline.
 */

import React from "react";
import { render, screen, cleanup } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { EventsTimeline } from "./EventsTimeline";
import type { CelestialEvent } from "../../lib/events";
import * as eventsLib from "../../lib/events";

vi.mock("../../hooks/useCelestialEvents", () => ({
  useCelestialEvents: vi.fn(),
}));

import { useCelestialEvents } from "../../hooks/useCelestialEvents";
const mockHook = useCelestialEvents as ReturnType<typeof vi.fn>;

const PERSEIDS: CelestialEvent = {
  id: "perseids-2026",
  type: "meteor_shower",
  name: "Perseids Meteor Shower",
  startUtc: "2026-08-05T00:00:00.000Z",
  endUtc: "2026-08-16T00:00:00.000Z",
  peakUtc: "2026-08-12T00:00:00.000Z",
  summary: "The most popular meteor shower of the year.",
  visibility: { rating: "Excellent", reason: "High ZHR in summer nights." },
  source: "Annual catalog",
  confidence: "high",
};

function idle() { mockHook.mockReturnValue({ events: [], isLoading: false, error: null, refresh: vi.fn() }); }
function loading() { mockHook.mockReturnValue({ events: [], isLoading: true, error: null, refresh: vi.fn() }); }
function withEvents(evts: CelestialEvent[]) { mockHook.mockReturnValue({ events: evts, isLoading: false, error: null, refresh: vi.fn() }); }
function withEventsAndDemo(evts: CelestialEvent[], isDemo: boolean) { mockHook.mockReturnValue({ events: evts, demo: isDemo, isLoading: false, error: null, refresh: vi.fn() }); }

beforeEach(() => idle());
afterEach(() => cleanup());

// ---------------------------------------------------------------------------
// API helper — multiple type params
// ---------------------------------------------------------------------------

describe("getCelestialEvents – query serialisation", () => {
  it("serialises multiple types as repeated query params", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([PERSEIDS]), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await eventsLib.getCelestialEvents({
      lat: 51.5,
      lon: -0.1,
      startUtc: "2026-08-01T00:00:00Z",
      endUtc: "2026-08-31T23:59:59Z",
      types: ["meteor_shower", "eclipse"],
    });

    const url = fetchMock.mock.calls[0]![0] as string;
    expect(url).toContain("type=meteor_shower");
    expect(url).toContain("type=eclipse");
    vi.unstubAllGlobals();
  });
});

// ---------------------------------------------------------------------------
// EventsTimeline
// ---------------------------------------------------------------------------

describe("EventsTimeline – states", () => {
  it("shows empty state when no location", () => {
    render(<EventsTimeline />);
    expect(screen.getByTestId("events-empty")).toBeInTheDocument();
  });

  it("shows empty state when no events returned", () => {
    idle();
    render(<EventsTimeline location={{ lat: 51.5, lon: -0.1 }} startUtc="2026-08-01T00:00:00Z" endUtc="2026-08-31T23:59:59Z" />);
    expect(screen.getByTestId("events-empty")).toBeInTheDocument();
  });

  it("shows loading indicator", () => {
    loading();
    render(<EventsTimeline location={{ lat: 51.5, lon: -0.1 }} startUtc="2026-08-01T00:00:00Z" endUtc="2026-08-31T23:59:59Z" />);
    expect(screen.getByTestId("events-loading")).toBeInTheDocument();
  });

  it("renders a Perseids-like fixture event", () => {
    withEvents([PERSEIDS]);
    render(<EventsTimeline location={{ lat: 51.5, lon: -0.1 }} startUtc="2026-08-01T00:00:00Z" endUtc="2026-08-31T23:59:59Z" />);
    expect(screen.getByTestId("events-timeline")).toBeInTheDocument();
    expect(screen.getByTestId(`event-${PERSEIDS.id}`)).toBeInTheDocument();
    expect(screen.getByTestId("event-name").textContent).toContain("Perseids");
    expect(screen.getByTestId("event-summary").textContent).toContain("most popular");
    expect(screen.getByTestId("event-visibility").textContent).toContain("Excellent");
  });

  it("renders type badge for meteor_shower", () => {
    withEvents([PERSEIDS]);
    render(<EventsTimeline location={{ lat: 51.5, lon: -0.1 }} startUtc="2026-08-01T00:00:00Z" endUtc="2026-08-31T23:59:59Z" />);
    expect(screen.getByTestId("event-type-badge").textContent).toBe("Meteor Shower");
  });

  it("renders a Demo fixture badge when demo is true", () => {
    withEventsAndDemo([PERSEIDS], true);
    render(<EventsTimeline location={{ lat: 51.5, lon: -0.1 }} startUtc="2026-08-01T00:00:00Z" endUtc="2026-08-31T23:59:59Z" />);
    expect(screen.getByTestId("demo-fixture-label")).toBeInTheDocument();
    expect(screen.getByTestId("demo-fixture-label").textContent).toBe("Demo fixture");
  });

  it("does not render a Demo fixture badge when demo is false", () => {
    withEventsAndDemo([PERSEIDS], false);
    render(<EventsTimeline location={{ lat: 51.5, lon: -0.1 }} startUtc="2026-08-01T00:00:00Z" endUtc="2026-08-31T23:59:59Z" />);
    expect(screen.queryByTestId("demo-fixture-label")).toBeNull();
  });
});
