import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { EventPathCard } from "./EventPathCard";
import type { EventPath } from "../../lib/events";

describe("EventPathCard", () => {
  afterEach(() => cleanup());
  const dummyPath: EventPath = {
    type: "eclipse",
    summary: "Totality crosses Reykjavik",
    bestViewingRegions: ["Iceland", "Spain"],
    duration: "2m 18s",
    visibilityFromObserver: "Not visible from current location",
  };

  it("renders path details correctly", () => {
    render(<EventPathCard path={dummyPath} eventPeakUtc="2026-08-12T18:14:00.000Z" />);

    expect(screen.getByText(/Totality crosses Reykjavik/)).toBeDefined();
    expect(screen.getByText(/Iceland, Spain/)).toBeDefined();
    expect(screen.getByText(/2m 18s/)).toBeDefined();
    expect(screen.getByText(/Not visible from current location/)).toBeDefined();
  });

  it("dispatches custom event on Stand in the path click", () => {
    const dispatchSpy = vi.spyOn(window, "dispatchEvent");
    render(<EventPathCard path={dummyPath} eventPeakUtc="2026-08-12T18:14:00.000Z" />);

    const standBtn = screen.getByTestId("stand-in-path-btn");
    fireEvent.click(standBtn);

    expect(dispatchSpy).toHaveBeenCalled();
    const eventArg = dispatchSpy.mock.calls[0]?.[0] as CustomEvent;
    expect(eventArg.type).toBe("zenith-change-location");
    expect(eventArg.detail.location.id).toBe("reykjavik");
    expect(eventArg.detail.timeIso).toBe("2026-08-12T18:14:00.000Z");

    dispatchSpy.mockRestore();
  });

  it("dispatches custom event on Ask narrator click", () => {
    const dispatchSpy = vi.spyOn(window, "dispatchEvent");
    render(<EventPathCard path={dummyPath} eventPeakUtc="2026-08-12T18:14:00.000Z" />);

    const askBtn = screen.getByTestId("ask-narrator-btn");
    fireEvent.click(askBtn);

    expect(dispatchSpy).toHaveBeenCalled();
    const eventArg = dispatchSpy.mock.calls[0]?.[0] as CustomEvent;
    expect(eventArg.type).toBe("zenith-prefill-narrator");
    expect(eventArg.detail.query).toContain("What would an observer see during the eclipse");

    dispatchSpy.mockRestore();
  });
});
