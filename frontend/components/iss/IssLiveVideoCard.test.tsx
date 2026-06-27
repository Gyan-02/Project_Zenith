import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { IssLiveVideoCard } from "./IssLiveVideoCard";

describe("IssLiveVideoCard", () => {
  it("renders with header, disclaimer, and open NASA stream link", () => {
    render(<IssLiveVideoCard />);
    
    expect(screen.getByText("Live from the ISS")).toBeDefined();
    expect(screen.getByText(/Live feed may be unavailable/)).toBeDefined();
    
    const link = screen.getByText("Open NASA stream ↗");
    expect(link).toBeDefined();
    expect(link.getAttribute("href")).toBe("https://www.youtube.com/@NASA/live");
  });

  it("renders external badge only when isDemo is true", () => {
    const { rerender } = render(<IssLiveVideoCard isDemo={false} />);
    expect(screen.queryByTestId("iss-live-badge")).toBeNull();

    rerender(<IssLiveVideoCard isDemo={true} />);
    expect(screen.getByTestId("iss-live-badge")).toBeDefined();
  });
});
