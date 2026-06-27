/**
 * GYA-26 – Tests for EducationalReferenceCard and related helpers.
 */

import React from "react";
import { render, screen, cleanup } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { EducationalReferenceCard } from "./EducationalReferenceCard";
import * as eduRefLib from "../../lib/educationalReference";
import type { EducationalReference } from "../../lib/educationalReference";

// ---------------------------------------------------------------------------
// Mock the hook
// ---------------------------------------------------------------------------

vi.mock("../../hooks/useEducationalReference", () => ({
  useEducationalReference: vi.fn(),
}));

import { useEducationalReference } from "../../hooks/useEducationalReference";

const mockHook = useEducationalReference as ReturnType<typeof vi.fn>;

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const SATURN_REF: EducationalReference = {
  objectId: "saturn",
  name: "Saturn",
  kind: "planet",
  oneLine: "The ringed giant of the solar system.",
  whyItMatters: "Saturn's rings are one of the most iconic sights through a telescope.",
  quickFacts: [
    { label: "Distance from Sun", value: "1.4 billion km" },
    { label: "Ring width", value: "~282,000 km" },
  ],
  observationTips: [
    "Use 25× or more to resolve the rings.",
    "Look during opposition for best visibility.",
  ],
  kidFriendlySummary: "Saturn has beautiful rings made of ice and rock!",
  sourceNotes: "IAU / NASA fact sheets",
};

function idle() {
  mockHook.mockReturnValue({ reference: null, isLoading: false, error: null });
}
function loading() {
  mockHook.mockReturnValue({ reference: null, isLoading: true, error: null });
}
function withRef(ref: EducationalReference) {
  mockHook.mockReturnValue({ reference: ref, isLoading: false, error: null });
}
function withError(msg: string) {
  mockHook.mockReturnValue({ reference: null, isLoading: false, error: msg });
}

beforeEach(() => idle());
afterEach(() => cleanup());

// ---------------------------------------------------------------------------
// API helper
// ---------------------------------------------------------------------------

describe("getEducationalReference – URL construction", () => {
  it("builds the correct URL for a given objectId", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(SATURN_REF), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await eduRefLib.getEducationalReference("saturn");

    const calledUrl = fetchMock.mock.calls[0][0] as string;
    expect(calledUrl).toContain("/api/reference/saturn");

    vi.unstubAllGlobals();
  });

  it("returns null for a 404 response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 404 })));
    const result = await eduRefLib.getEducationalReference("nonexistent");
    expect(result).toBeNull();
    vi.unstubAllGlobals();
  });

  it("throws for non-404 HTTP errors", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 503 })));
    await expect(eduRefLib.getEducationalReference("saturn")).rejects.toThrow("503");
    vi.unstubAllGlobals();
  });
});

// ---------------------------------------------------------------------------
// Hook – undefined objectId
// ---------------------------------------------------------------------------

describe("useEducationalReference – undefined objectId", () => {
  it("stays idle when objectId is undefined", () => {
    idle();
    // Render the card without objectId — it will call hook with undefined
    render(<EducationalReferenceCard />);
    expect(screen.getByTestId("edu-ref-empty")).toBeInTheDocument();
    // Hook should have been called with undefined (skipped internally)
    expect(mockHook).toHaveBeenCalledWith(undefined);
  });
});

// ---------------------------------------------------------------------------
// Card – empty state
// ---------------------------------------------------------------------------

describe("EducationalReferenceCard – empty state", () => {
  it("shows empty state when no objectId is provided", () => {
    render(<EducationalReferenceCard />);
    expect(screen.getByTestId("edu-ref-empty")).toBeInTheDocument();
  });

  it("shows empty state when hook returns null data", () => {
    idle();
    render(<EducationalReferenceCard objectId="unknown" />);
    expect(screen.getByTestId("edu-ref-empty")).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Card – loading / error
// ---------------------------------------------------------------------------

describe("EducationalReferenceCard – loading and error states", () => {
  it("renders loading indicator", () => {
    loading();
    render(<EducationalReferenceCard objectId="saturn" />);
    expect(screen.getByTestId("edu-ref-loading")).toBeInTheDocument();
  });

  it("renders error message", () => {
    withError("Backend offline");
    render(<EducationalReferenceCard objectId="saturn" />);
    expect(screen.getByTestId("edu-ref-error")).toBeInTheDocument();
    expect(screen.getByTestId("edu-ref-error").textContent).toContain("Backend offline");
  });
});

// ---------------------------------------------------------------------------
// Card – Saturn reference rendering
// ---------------------------------------------------------------------------

describe("EducationalReferenceCard – Saturn reference", () => {
  it("renders name and one-line summary", () => {
    withRef(SATURN_REF);
    render(<EducationalReferenceCard objectId="saturn" />);
    expect(screen.getByTestId("edu-ref-name").textContent).toBe("Saturn");
    expect(screen.getByTestId("edu-ref-one-line").textContent).toContain("ringed giant");
  });

  it("renders why it matters", () => {
    withRef(SATURN_REF);
    render(<EducationalReferenceCard objectId="saturn" />);
    expect(screen.getByTestId("edu-ref-why").textContent).toContain("rings");
  });

  it("renders all quick facts", () => {
    withRef(SATURN_REF);
    render(<EducationalReferenceCard objectId="saturn" />);
    const factsEl = screen.getByTestId("edu-ref-quick-facts");
    expect(factsEl.textContent).toContain("Distance from Sun");
    expect(factsEl.textContent).toContain("1.4 billion km");
    expect(factsEl.textContent).toContain("Ring width");
  });

  it("renders observation tips", () => {
    withRef(SATURN_REF);
    render(<EducationalReferenceCard objectId="saturn" />);
    const tipsEl = screen.getByTestId("edu-ref-tips");
    expect(tipsEl.querySelectorAll("li")).toHaveLength(2);
    expect(tipsEl.textContent).toContain("25×");
  });

  it("renders kid-friendly summary", () => {
    withRef(SATURN_REF);
    render(<EducationalReferenceCard objectId="saturn" />);
    expect(screen.getByTestId("edu-ref-kid-summary").textContent).toContain("ice and rock");
  });

  it("accepts a preloaded reference and skips fetching", () => {
    render(<EducationalReferenceCard reference={SATURN_REF} />);
    expect(screen.getByTestId("edu-ref-card")).toBeInTheDocument();
    expect(screen.getByTestId("edu-ref-name").textContent).toBe("Saturn");
    // Hook called with undefined because preloaded was supplied
    expect(mockHook).toHaveBeenCalledWith(undefined);
  });
});
