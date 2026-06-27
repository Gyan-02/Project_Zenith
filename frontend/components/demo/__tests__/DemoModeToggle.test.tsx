/**
 * GYA-43 – Tests for DemoModeToggle and DemoModeBadge.
 */

import React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

// ---------------------------------------------------------------------------
// Mock useDemoMode so we don't hit localStorage / window.location
// ---------------------------------------------------------------------------

vi.mock("../../../hooks/useDemoMode", () => ({
  useDemoMode: vi.fn(),
}));

import { useDemoMode } from "../../../hooks/useDemoMode";
import { DemoModeToggle } from "../DemoModeToggle";
import { DemoModeBadge } from "../DemoModeBadge";

const mockHook = useDemoMode as ReturnType<typeof vi.fn>;

// Also mock window.location.reload
const reloadMock = vi.fn();
const assignMock = vi.fn();
Object.defineProperty(window, "location", {
  value: { ...window.location, href: "http://localhost:3000/?demo=1", reload: reloadMock, assign: assignMock },
  writable: true,
});

beforeEach(() => {
  reloadMock.mockClear();
  assignMock.mockClear();
});
afterEach(() => cleanup());

// ---------------------------------------------------------------------------
// DemoModeBadge
// ---------------------------------------------------------------------------

describe("DemoModeBadge – live mode", () => {
  it('renders "Live data" when isDemo=false', () => {
    render(<DemoModeBadge isDemo={false} />);
    expect(screen.getByTestId("demo-badge").textContent).toContain("Live data");
  });

  it("has data-demo=false in live mode", () => {
    render(<DemoModeBadge isDemo={false} />);
    expect(screen.getByTestId("demo-badge").getAttribute("data-demo")).toBe("false");
  });
});

describe("DemoModeBadge – demo mode", () => {
  it('renders "Demo data" when isDemo=true', () => {
    render(<DemoModeBadge isDemo={true} />);
    expect(screen.getByTestId("demo-badge").textContent).toContain("Demo data");
  });

  it("has data-demo=true in demo mode", () => {
    render(<DemoModeBadge isDemo={true} />);
    expect(screen.getByTestId("demo-badge").getAttribute("data-demo")).toBe("true");
  });
});

// ---------------------------------------------------------------------------
// DemoModeToggle – live mode
// ---------------------------------------------------------------------------

describe("DemoModeToggle – live mode", () => {
  const enableMock = vi.fn();
  const disableMock = vi.fn();

  beforeEach(() => {
    enableMock.mockClear();
    disableMock.mockClear();
    mockHook.mockReturnValue({ isDemo: false, enable: enableMock, disable: disableMock, toggle: vi.fn() });
  });

  it('renders "Live data" label', () => {
    render(<DemoModeToggle />);
    expect(screen.getByTestId("demo-toggle").textContent).toContain("Live data");
  });

  it("aria-pressed is false in live mode", () => {
    render(<DemoModeToggle />);
    expect(screen.getByTestId("demo-toggle").getAttribute("aria-pressed")).toBe("false");
  });

  it("calls enable() and reloads page when clicked in live mode", () => {
    render(<DemoModeToggle />);
    fireEvent.click(screen.getByTestId("demo-toggle"));
    expect(enableMock).toHaveBeenCalledOnce();
    expect(reloadMock).toHaveBeenCalledOnce();
  });
});

// ---------------------------------------------------------------------------
// DemoModeToggle – demo mode
// ---------------------------------------------------------------------------

describe("DemoModeToggle – demo mode", () => {
  const enableMock = vi.fn();
  const disableMock = vi.fn();

  beforeEach(() => {
    enableMock.mockClear();
    disableMock.mockClear();
    mockHook.mockReturnValue({ isDemo: true, enable: enableMock, disable: disableMock, toggle: vi.fn() });
  });

  it('renders "Demo data" label', () => {
    render(<DemoModeToggle />);
    expect(screen.getByTestId("demo-toggle").textContent).toContain("Demo data");
  });

  it("aria-pressed is true in demo mode", () => {
    render(<DemoModeToggle />);
    expect(screen.getByTestId("demo-toggle").getAttribute("aria-pressed")).toBe("true");
  });

  it("calls disable() and navigates without demo query when clicked in demo mode", () => {
    render(<DemoModeToggle />);
    fireEvent.click(screen.getByTestId("demo-toggle"));
    expect(disableMock).toHaveBeenCalledOnce();
    expect(assignMock).toHaveBeenCalledOnce();
    expect(assignMock.mock.calls[0]?.[0]).toBe("http://localhost:3000/");
  });
});
