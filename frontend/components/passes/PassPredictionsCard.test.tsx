/**
 * GYA-29 – Tests for PassPredictionsCard.
 */

import React from "react";
import { render, screen, cleanup } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { PassPredictionsCard } from "./PassPredictionsCard";
import type { PassPrediction } from "../../lib/passes";
import * as passesLib from "../../lib/passes";

vi.mock("../../hooks/usePassPredictions", () => ({
  usePassPredictions: vi.fn(),
}));

import { usePassPredictions } from "../../hooks/usePassPredictions";
const mockHook = usePassPredictions as ReturnType<typeof vi.fn>;

const FAKE_PASS: PassPrediction = {
  objectId: "sat-25544",
  name: "ISS (ZARYA)",
  riseTimeUtc: "2026-06-25T20:00:00.000Z",
  peakTimeUtc: "2026-06-25T20:02:30.000Z",
  setTimeUtc: "2026-06-25T20:05:00.000Z",
  durationSeconds: 300,
  maxElevationDeg: 45,
  riseDirection: "NW",
  setDirection: "SE",
  visible: false,
};

function idle() { mockHook.mockReturnValue({ passes: [], provenance: [], isLoading: false, error: null, refresh: vi.fn() }); }
function loading() { mockHook.mockReturnValue({ passes: [], provenance: [], isLoading: true, error: null, refresh: vi.fn() }); }
function withError(msg: string) { mockHook.mockReturnValue({ passes: [], provenance: [], isLoading: false, error: msg, refresh: vi.fn() }); }
function withPasses(ps: PassPrediction[]) { mockHook.mockReturnValue({ passes: ps, provenance: [], isLoading: false, error: null, refresh: vi.fn() }); }
function withPassesAndDemo(ps: PassPrediction[], isDemo: boolean) { mockHook.mockReturnValue({ passes: ps, provenance: [], demo: isDemo, isLoading: false, error: null, refresh: vi.fn() }); }

beforeEach(() => idle());
afterEach(() => cleanup());

// ---------------------------------------------------------------------------
// API helper — URL
// ---------------------------------------------------------------------------

describe("getPassPredictions – URL construction", () => {
  it("calls /api/passes with expected params", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ passes: [], provenance: [], location: {}, startUtc: "", endUtc: "" }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);
    await passesLib.getPassPredictions({ lat: 25.61, lon: 85.14, startUtc: "2026-06-25T00:00:00Z", endUtc: "2026-06-26T00:00:00Z" });
    const url = fetchMock.mock.calls[0]![0] as string;
    expect(url).toContain("/api/passes");
    expect(url).toContain("lat=25.61");
    expect(url).toContain("start=");
    vi.unstubAllGlobals();
  });
});

// ---------------------------------------------------------------------------
// Hook — missing inputs
// ---------------------------------------------------------------------------

describe("PassPredictionsCard – missing inputs", () => {
  it("shows empty state when no location", () => {
    render(<PassPredictionsCard />);
    expect(screen.getByTestId("passes-empty")).toBeInTheDocument();
  });

  it("shows empty state when no startUtc", () => {
    render(<PassPredictionsCard location={{ lat: 25.61, lon: 85.14 }} endUtc="2026-06-26T00:00:00Z" />);
    expect(screen.getByTestId("passes-empty")).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Card states
// ---------------------------------------------------------------------------

describe("PassPredictionsCard – card states", () => {
  it("shows loading indicator", () => {
    loading();
    render(<PassPredictionsCard location={{ lat: 25.61, lon: 85.14 }} startUtc="2026-06-25T00:00:00Z" endUtc="2026-06-26T00:00:00Z" />);
    expect(screen.getByTestId("passes-loading")).toBeInTheDocument();
  });

  it("shows unavailable state on error", () => {
    withError("CelesTrak offline");
    render(<PassPredictionsCard location={{ lat: 25.61, lon: 85.14 }} startUtc="2026-06-25T00:00:00Z" endUtc="2026-06-26T00:00:00Z" />);
    expect(screen.getByTestId("passes-unavailable")).toBeInTheDocument();
    expect(screen.getByTestId("passes-unavailable").textContent).toContain("CelesTrak offline");
  });

  it("shows empty state when no passes returned", () => {
    idle();
    render(<PassPredictionsCard location={{ lat: 25.61, lon: 85.14 }} startUtc="2026-06-25T00:00:00Z" endUtc="2026-06-26T00:00:00Z" />);
    expect(screen.getByTestId("passes-empty")).toBeInTheDocument();
  });

  it("renders a fixture pass with name, times, and elevation", () => {
    withPasses([FAKE_PASS]);
    render(<PassPredictionsCard location={{ lat: 25.61, lon: 85.14 }} startUtc="2026-06-25T00:00:00Z" endUtc="2026-06-26T00:00:00Z" />);
    expect(screen.getByTestId("passes-card")).toBeInTheDocument();
    expect(screen.getByTestId(`pass-${FAKE_PASS.objectId}`)).toBeInTheDocument();
    expect(screen.getByTestId("pass-name").textContent).toContain("ISS");
    expect(screen.getByTestId("pass-elevation").textContent).toContain("45");
  });

  it("renders a Demo fixture badge when demo is true", () => {
    withPassesAndDemo([FAKE_PASS], true);
    render(<PassPredictionsCard location={{ lat: 25.61, lon: 85.14 }} startUtc="2026-06-25T00:00:00Z" endUtc="2026-06-26T00:00:00Z" />);
    expect(screen.getByTestId("demo-fixture-label")).toBeInTheDocument();
    expect(screen.getByTestId("demo-fixture-label").textContent).toBe("Demo fixture");
  });

  it("does not render a Demo fixture badge when demo is false", () => {
    withPassesAndDemo([FAKE_PASS], false);
    render(<PassPredictionsCard location={{ lat: 25.61, lon: 85.14 }} startUtc="2026-06-25T00:00:00Z" endUtc="2026-06-26T00:00:00Z" />);
    expect(screen.queryByTestId("demo-fixture-label")).toBeNull();
  });
});
