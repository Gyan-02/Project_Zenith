import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { CrossingNowCard } from "./CrossingNowCard";
import type { SkyState } from "../../lib/skyState";

const mockSkyState: SkyState = {
  location: { lat: 25.61, lon: 85.14, label: "Patna" },
  timestampUtc: "2026-08-12T20:30:00.000Z",
  planets: [
    {
      id: "saturn",
      kind: "planet",
      name: "Saturn",
      position: { ra: 317.4, dec: -12.8, altDeg: 32.5, azDeg: 138.2, distanceKm: 1340000000 },
      metadata: {},
    },
    {
      id: "jupiter",
      kind: "planet",
      name: "Jupiter",
      position: { ra: 51.2, dec: 18.6, altDeg: -5.0, azDeg: 72.4, distanceKm: 793000000 },
      metadata: {},
    },
  ],
  stars: [
    {
      id: "sirius",
      kind: "star",
      name: "Sirius",
      position: { ra: 101.2872, dec: -16.7161, altDeg: 12.5, azDeg: 105.4, distanceKm: 81390000000000 },
      metadata: {},
    },
  ],
  satellites: [
    {
      id: "sat-1",
      kind: "satellite",
      name: "ISS (ZARYA)",
      position: { ra: 212.5, dec: 42.3, altDeg: 62.1, azDeg: 308.4, distanceKm: 418 },
      metadata: {},
    },
    {
      id: "sat-2",
      kind: "satellite",
      name: "Starlink",
      position: { ra: 212.5, dec: 42.3, altDeg: -10.0, azDeg: 308.4, distanceKm: 550 },
      metadata: {},
    },
  ],
  iss: {
    id: "iss",
    kind: "iss",
    name: "International Space Station",
    position: { ra: 212.5, dec: 42.3, altDeg: 62.1, azDeg: 308.4, distanceKm: 418 },
    metadata: {},
  },
  moon: {
    id: "moon",
    kind: "moon",
    name: "Moon",
    position: { ra: 302.8, dec: -24.1, altDeg: 15.4, azDeg: 112.7, distanceKm: 368000 },
    metadata: {},
  },
  constellations: [],
  meteorShowers: [],
  provenance: [],
};

describe("CrossingNowCard", () => {
  it("renders 'Calibrating...' when skyState is null or undefined", () => {
    const { rerender } = render(<CrossingNowCard skyState={undefined} />);
    expect(screen.getByText("Calibrating...")).toBeDefined();

    rerender(<CrossingNowCard skyState={null} />);
    expect(screen.getByText("Calibrating...")).toBeDefined();
  });

  it("computes and renders stats for visible objects (altDeg > 0)", () => {
    render(<CrossingNowCard skyState={mockSkyState} />);
    
    // Alt > 0 items in mockSkyState:
    // Planets: saturn (jupiter is -5) -> 1
    // Stars: sirius -> 1
    // Satellites: sat-1 (sat-2 is -10) -> 1
    // ISS: iss -> 1
    // Moon: moon -> 1 (Note: moon is currently not explicitly counted separately but included in getSkyObjects. Wait, computeCrossingStats doesn't count moon in subcategories, so total = sat (1) + iss (1) + planet (1) + star (1) = 4)
    
    expect(screen.getByTestId("crossing-card")).toBeDefined();
    expect(screen.getByTestId("crossing-total").textContent).toBe("4");
    expect(screen.getByTestId("crossing-satellites").textContent).toContain("1");
    expect(screen.getByTestId("crossing-iss").textContent).toContain("1");
    expect(screen.getByTestId("crossing-planets").textContent).toContain("1");
    expect(screen.getByTestId("crossing-stars").textContent).toContain("1");
  });
});
