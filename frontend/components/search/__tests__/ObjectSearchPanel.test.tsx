/**
 * GYA-40 — ObjectSearchPanel tests
 */

import React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ObjectSearchPanel } from "../ObjectSearchPanel";
import type { SkyState } from "../../../lib/skyState";
import { navigationBus } from "../../../lib/navigationBus";

// Ensure DOM is cleaned up between tests to avoid element collision
afterEach(cleanup);

// ---------------------------------------------------------------------------
// Mock sky state
// ---------------------------------------------------------------------------

const MOCK_SKY_STATE: SkyState = {
  location: { lat: 25.61, lon: 85.14 },
  timestampUtc: "2026-06-25T12:00:00.000Z",
  planets: [
    {
      id: "saturn",
      kind: "planet",
      name: "Saturn",
      position: { ra: 21.1, dec: -17.5 },
    },
    {
      id: "jupiter",
      kind: "planet",
      name: "Jupiter",
      position: { ra: 22.5, dec: -14.2 },
    },
    {
      id: "mars",
      kind: "planet",
      name: "Mars",
      position: { ra: 1.1, dec: 8.4 },
    },
  ],
  stars: [
    {
      id: "sirius",
      kind: "star",
      name: "Sirius",
      position: { ra: 101.2872, dec: -16.7161 },
      metadata: { source: "test bright-star subset", dataMode: "static-catalog" },
    },
  ],
  satellites: [
    {
      id: "iss-fake",
      kind: "satellite",
      name: "ISS (Z)",
      position: { ra: 0, dec: 0, altDeg: 45, azDeg: 90 },
    },
  ],
  iss: {
    id: "iss",
    kind: "iss",
    name: "ISS",
    position: { ra: 0, dec: 0, altDeg: 45, azDeg: 90 },
  },
  moon: {
    id: "moon",
    kind: "moon",
    name: "Moon",
    position: { ra: 5.5, dec: 22.1 },
  },
  constellations: [],
  meteorShowers: [
    {
      id: "perseids",
      kind: "meteor_shower",
      name: "Perseids",
      position: { ra: 3.5, dec: 57.1 },
    },
  ],
  provenance: [],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderSearch(overrides?: { skyState?: SkyState | null }) {
  const onSelect = vi.fn();
  const result = render(
    <ObjectSearchPanel
      skyState={overrides?.skyState !== undefined ? overrides.skyState : MOCK_SKY_STATE}
      onSelectObject={onSelect}
    />,
  );
  return { onSelect, ...result };
}

function getInput(container: HTMLElement) {
  return container.querySelector("input[role='combobox']") as HTMLInputElement;
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe("ObjectSearchPanel — rendering", () => {
  it("renders the search input", () => {
    const { container } = renderSearch();
    expect(getInput(container)).toBeInTheDocument();
  });

  it("input is disabled when skyState is null", () => {
    const { container } = renderSearch({ skyState: null });
    expect(getInput(container)).toBeDisabled();
  });

  it("input is enabled when skyState is provided", () => {
    const { container } = renderSearch();
    expect(getInput(container)).not.toBeDisabled();
  });

  it("does not show results when query is empty", () => {
    const { queryByRole } = renderSearch();
    expect(queryByRole("listbox")).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Filtering
// ---------------------------------------------------------------------------

describe("ObjectSearchPanel — filtering", () => {
  it("shows results matching query (case-insensitive)", () => {
    const { container, getByText } = renderSearch();
    fireEvent.change(getInput(container), { target: { value: "saturn" } });
    expect(getByText("Saturn")).toBeInTheDocument();
  });

  it("shows kind badge for planet result", () => {
    const { container, getByText } = renderSearch();
    fireEvent.change(getInput(container), { target: { value: "saturn" } });
    expect(getByText("Planet")).toBeInTheDocument();
  });

  it("shows multiple matching results", () => {
    const { container, getAllByRole } = renderSearch();
    fireEvent.change(getInput(container), { target: { value: "s" } });
    const results = getAllByRole("option");
    expect(results.length).toBeGreaterThan(1);
  });

  it("shows empty state for unmatched query", () => {
    const { container, getByText } = renderSearch();
    fireEvent.change(getInput(container), { target: { value: "zzznomatch" } });
    expect(getByText(/no objects match/i)).toBeInTheDocument();
  });

  it("shows Moon with Moon badge", () => {
    const { container, getByText } = renderSearch();
    fireEvent.change(getInput(container), { target: { value: "moon" } });
    expect(getByText("Moon", { selector: ".zp-search-option-name" })).toBeInTheDocument();
    expect(getByText("Moon", { selector: ".zp-search-kind-badge" })).toBeInTheDocument();
  });

  it("shows first-class stars with Star badge", () => {
    const { container, getByText } = renderSearch();
    fireEvent.change(getInput(container), { target: { value: "sirius" } });
    expect(getByText("Sirius", { selector: ".zp-search-option-name" })).toBeInTheDocument();
    expect(getByText("Star", { selector: ".zp-search-kind-badge" })).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Keyboard navigation
// ---------------------------------------------------------------------------

describe("ObjectSearchPanel — keyboard navigation", () => {
  it("ArrowDown moves active index to first result", () => {
    const { container, getAllByRole } = renderSearch();
    const input = getInput(container);
    fireEvent.change(input, { target: { value: "saturn" } });
    fireEvent.keyDown(input, { key: "ArrowDown" });
    const options = getAllByRole("option");
    expect(options[0]).toHaveAttribute("aria-selected", "true");
  });

  it("Escape clears the query", () => {
    const { container, queryByRole } = renderSearch();
    const input = getInput(container);
    fireEvent.change(input, { target: { value: "saturn" } });
    fireEvent.keyDown(input, { key: "Escape" });
    expect(input).toHaveValue("");
    expect(queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("Enter selects the first result when none is focused", () => {
    const { container, onSelect } = renderSearch();
    const input = getInput(container);
    fireEvent.change(input, { target: { value: "saturn" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onSelect).toHaveBeenCalledWith("saturn");
  });

  it("Enter selects the aria-active result after ArrowDown", () => {
    const { container, onSelect } = renderSearch();
    const input = getInput(container);
    fireEvent.change(input, { target: { value: "s" } });
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect.mock.calls[0][0]).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// navigationBus integration
// ---------------------------------------------------------------------------

describe("ObjectSearchPanel — navigationBus", () => {
  beforeEach(() => {
    navigationBus.clear();
  });

  it("publishes navigation target on selection", () => {
    const { container } = renderSearch();
    const input = getInput(container);
    fireEvent.change(input, { target: { value: "saturn" } });
    fireEvent.keyDown(input, { key: "Enter" });
    const target = navigationBus.current();
    expect(target).not.toBeNull();
    expect(target?.label).toBe("Saturn");
    expect(target?.id).toBe("saturn");
  });

  it("clears query after selection", () => {
    const { container } = renderSearch();
    const input = getInput(container);
    fireEvent.change(input, { target: { value: "saturn" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(input).toHaveValue("");
  });
});
