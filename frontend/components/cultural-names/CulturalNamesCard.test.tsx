/**
 * GYA-19 – Tests for CulturalNamesCard and related helpers.
 */

import React from "react";
import { render, screen, cleanup } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { CulturalNamesCard } from "./CulturalNamesCard";
import * as culturalNamesLib from "../../lib/culturalNames";
import type { CulturalObjectEntry } from "../../lib/culturalNames";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Mock the hook so we control data/loading/error in tests. */
vi.mock("../../hooks/useCulturalNames", () => ({
  useCulturalNames: vi.fn(),
}));

import { useCulturalNames } from "../../hooks/useCulturalNames";

const mockHook = useCulturalNames as ReturnType<typeof vi.fn>;

const JUPITER_DATA: CulturalObjectEntry = {
  scientific: "Jupiter",
  category: "planet",
  names: {
    vedic: {
      name: "Brihaspati",
      transliteration: "Bṛhaspati",
      meaning: "Lord of prayer and devotion",
    },
    greek: {
      name: "Zeus",
    },
  },
};

function idle() {
  mockHook.mockReturnValue({ data: null, isLoading: false, error: null });
}
function loading() {
  mockHook.mockReturnValue({ data: null, isLoading: true, error: null });
}
function withData(data: CulturalObjectEntry) {
  mockHook.mockReturnValue({ data, isLoading: false, error: null });
}
function withError(msg: string) {
  mockHook.mockReturnValue({ data: null, isLoading: false, error: msg });
}

beforeEach(() => idle());
afterEach(() => cleanup());

// ---------------------------------------------------------------------------
// API helper
// ---------------------------------------------------------------------------

describe("getCulturalNamesForObject – URL construction", () => {
  it("builds the correct URL for a given objectId", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(JUPITER_DATA), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await culturalNamesLib.getCulturalNamesForObject("jupiter");

    const calledUrl = fetchMock.mock.calls[0][0] as string;
    expect(calledUrl).toContain("/api/cultural-names/jupiter");

    vi.unstubAllGlobals();
  });

  it("returns null for a 404 response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 404 })));
    const result = await culturalNamesLib.getCulturalNamesForObject("nonexistent");
    expect(result).toBeNull();
    vi.unstubAllGlobals();
  });

  it("throws for non-404 errors", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 503 })));
    await expect(culturalNamesLib.getCulturalNamesForObject("jupiter")).rejects.toThrow("503");
    vi.unstubAllGlobals();
  });
});

// ---------------------------------------------------------------------------
// CulturalNamesCard – empty state (no objectId)
// ---------------------------------------------------------------------------

describe("CulturalNamesCard – empty state", () => {
  it("renders empty state when no objectId is provided", () => {
    render(<CulturalNamesCard />);
    expect(screen.getByTestId("cultural-names-empty")).toBeInTheDocument();
    expect(screen.getByTestId("cultural-names-empty").textContent).toContain(
      "No cultural names loaded",
    );
  });

  it("renders empty state when hook returns no data", () => {
    idle();
    render(<CulturalNamesCard objectId="unknown-object" />);
    // data is null → empty state after hook resolves
    expect(screen.getByTestId("cultural-names-empty")).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// CulturalNamesCard – loading / error
// ---------------------------------------------------------------------------

describe("CulturalNamesCard – loading and error states", () => {
  it("shows a loading indicator while fetching", () => {
    loading();
    render(<CulturalNamesCard objectId="jupiter" />);
    expect(screen.getByTestId("cultural-names-loading")).toBeInTheDocument();
  });

  it("shows an error message on failure", () => {
    withError("Network error");
    render(<CulturalNamesCard objectId="jupiter" />);
    expect(screen.getByTestId("cultural-names-error")).toBeInTheDocument();
    expect(screen.getByTestId("cultural-names-error").textContent).toContain("Network error");
  });
});

// ---------------------------------------------------------------------------
// CulturalNamesCard – rendering a Vedic/Jupiter entry
// ---------------------------------------------------------------------------

describe("CulturalNamesCard – data rendering", () => {
  it("renders all tradition rows when no selectedTraditionId is given", () => {
    withData(JUPITER_DATA);
    render(<CulturalNamesCard objectId="jupiter" />);
    expect(screen.getByTestId("cultural-names-card")).toBeInTheDocument();
    expect(screen.getByTestId("tradition-vedic")).toBeInTheDocument();
    expect(screen.getByTestId("tradition-greek")).toBeInTheDocument();
  });

  it("renders the Vedic entry with name, transliteration, and meaning", () => {
    withData(JUPITER_DATA);
    render(<CulturalNamesCard objectId="jupiter" />);
    const vedicRow = screen.getByTestId("tradition-vedic");
    expect(vedicRow.textContent).toContain("Brihaspati");
    expect(vedicRow.textContent).toContain("Bṛhaspati");
    expect(vedicRow.textContent).toContain("Lord of prayer");
  });

  it("filters to a single tradition when selectedTraditionId is set", () => {
    withData(JUPITER_DATA);
    render(<CulturalNamesCard objectId="jupiter" selectedTraditionId="vedic" />);
    expect(screen.getByTestId("tradition-vedic")).toBeInTheDocument();
    expect(screen.queryByTestId("tradition-greek")).not.toBeInTheDocument();
  });

  it("shows the scientific name in the heading", () => {
    withData(JUPITER_DATA);
    render(<CulturalNamesCard objectId="jupiter" />);
    expect(screen.getByRole("heading").textContent).toContain("Jupiter");
  });
});
