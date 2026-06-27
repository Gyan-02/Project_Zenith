/**
 * GYA-27 – Tests for ObservingConditionsCard.
 */

import React from "react";
import { render, screen, cleanup } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { ObservingConditionsCard } from "./ObservingConditionsCard";
import type { ObservingConditionsResponse } from "../../lib/conditions";
import * as conditionsLib from "../../lib/conditions";

vi.mock("../../hooks/useObservingConditions", () => ({
  useObservingConditions: vi.fn(),
}));

import { useObservingConditions } from "../../hooks/useObservingConditions";
const mockHook = useObservingConditions as ReturnType<typeof vi.fn>;

const EXCELLENT: ObservingConditionsResponse = {
  location: { lat: 51.5, lon: -0.1 },
  observedAt: "2026-08-12T21:00:00.000Z",
  quality: "Excellent",
  summary: "Excellent viewing: low cloud cover (5%).",
  cloudCoverPct: 5,
  visibilityMeters: 10000,
  humidityPct: 40,
  temperatureC: 18,
  windSpeedMps: 2,
  cached: false,
  unavailable: false,
  source: "OpenWeatherMap",
};

const UNAVAILABLE: ObservingConditionsResponse = {
  ...EXCELLENT,
  quality: "Unknown",
  summary: "Observing conditions unavailable: weather API key not configured.",
  cloudCoverPct: null,
  visibilityMeters: null,
  humidityPct: null,
  temperatureC: null,
  windSpeedMps: null,
  unavailable: true,
};

const GOOD: ObservingConditionsResponse = {
  ...EXCELLENT,
  quality: "Good",
  summary: "Good viewing: partial cloud cover (40%).",
  cloudCoverPct: 40,
};

function idle() { mockHook.mockReturnValue({ conditions: null, isLoading: false, error: null, refresh: vi.fn() }); }
function loading() { mockHook.mockReturnValue({ conditions: null, isLoading: true, error: null, refresh: vi.fn() }); }
function withData(d: ObservingConditionsResponse) { mockHook.mockReturnValue({ conditions: d, isLoading: false, error: null, refresh: vi.fn() }); }

beforeEach(() => idle());
afterEach(() => cleanup());

// ---------------------------------------------------------------------------
// API helper
// ---------------------------------------------------------------------------

describe("getObservingConditions – URL construction", () => {
  it("calls /api/conditions with lat and lon", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(EXCELLENT), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);
    await conditionsLib.getObservingConditions({ lat: 51.5, lon: -0.1 });
    const url = fetchMock.mock.calls[0]![0] as string;
    expect(url).toContain("/api/conditions");
    expect(url).toContain("lat=51.5");
    expect(url).toContain("lon=-0.1");
    vi.unstubAllGlobals();
  });
});

// ---------------------------------------------------------------------------
// Card states
// ---------------------------------------------------------------------------

describe("ObservingConditionsCard", () => {
  it("shows empty state when no location provided", () => {
    render(<ObservingConditionsCard />);
    expect(screen.getByTestId("conditions-empty")).toBeInTheDocument();
  });

  it("shows loading indicator", () => {
    loading();
    render(<ObservingConditionsCard location={{ lat: 51.5, lon: -0.1 }} />);
    expect(screen.getByTestId("conditions-loading")).toBeInTheDocument();
  });

  it("renders Excellent quality card", () => {
    withData(EXCELLENT);
    render(<ObservingConditionsCard location={{ lat: 51.5, lon: -0.1 }} />);
    expect(screen.getByTestId("conditions-card")).toBeInTheDocument();
    expect(screen.getByTestId("conditions-quality").textContent).toBe("Excellent");
    expect(screen.getByTestId("conditions-cloud").textContent).toBe("5%");
  });

  it("renders Good quality card", () => {
    withData(GOOD);
    render(<ObservingConditionsCard location={{ lat: 51.5, lon: -0.1 }} />);
    expect(screen.getByTestId("conditions-quality").textContent).toBe("Good");
  });

  it("renders unavailable state", () => {
    withData(UNAVAILABLE);
    render(<ObservingConditionsCard location={{ lat: 51.5, lon: -0.1 }} />);
    expect(screen.getByTestId("conditions-unavailable")).toBeInTheDocument();
    expect(screen.getByTestId("conditions-quality").textContent).toBe("Unknown");
  });
});
