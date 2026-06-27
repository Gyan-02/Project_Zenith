/**
 * GYA-39 — demoMode unit tests
 *
 * These tests exercise the pure demoMode module in a jsdom environment.
 * localStorage is provided by jsdom; window.location is manipulated via
 * Object.defineProperty / delete to simulate URL params.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  isDemoActive,
  enableDemo,
  disableDemo,
  toggleDemo,
  resolvePath,
} from "../demoMode";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Set window.location.search without triggering navigation */
function setSearch(qs: string) {
  Object.defineProperty(window, "location", {
    writable: true,
    value: { ...window.location, search: qs },
  });
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.unstubAllEnvs();
  window.localStorage.clear();
  setSearch("");
});

afterEach(() => {
  vi.unstubAllEnvs();
  setSearch("");
  window.localStorage.clear();
});

// ---------------------------------------------------------------------------
// isDemoActive
// ---------------------------------------------------------------------------

describe("isDemoActive", () => {
  it("returns false when neither URL nor localStorage set", () => {
    expect(isDemoActive()).toBe(false);
  });

  it("returns true when ?demo=1 in URL", () => {
    setSearch("?demo=1");
    expect(isDemoActive()).toBe(true);
  });

  it("returns false when ?demo=0 in URL", () => {
    setSearch("?demo=0");
    expect(isDemoActive()).toBe(false);
  });

  it("returns true when localStorage has zenith_demo=1", () => {
    window.localStorage.setItem("zenith_demo", "1");
    expect(isDemoActive()).toBe(true);
  });

  it("returns true when NEXT_PUBLIC_DEMO_MODE=1", () => {
    vi.stubEnv("NEXT_PUBLIC_DEMO_MODE", "1");
    expect(isDemoActive()).toBe(true);
  });

  it("URL param wins over blank localStorage", () => {
    setSearch("?demo=1");
    window.localStorage.removeItem("zenith_demo");
    expect(isDemoActive()).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// enableDemo / disableDemo
// ---------------------------------------------------------------------------

describe("enableDemo / disableDemo", () => {
  it("enableDemo persists to localStorage", () => {
    enableDemo();
    expect(window.localStorage.getItem("zenith_demo")).toBe("1");
  });

  it("isDemoActive returns true after enableDemo", () => {
    enableDemo();
    expect(isDemoActive()).toBe(true);
  });

  it("disableDemo removes localStorage key", () => {
    enableDemo();
    disableDemo();
    expect(window.localStorage.getItem("zenith_demo")).toBeNull();
  });

  it("isDemoActive returns false after disableDemo (no URL param)", () => {
    enableDemo();
    disableDemo();
    expect(isDemoActive()).toBe(false);
  });

  it("round-trip enable → disable → enable works", () => {
    enableDemo();
    disableDemo();
    enableDemo();
    expect(isDemoActive()).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// toggleDemo
// ---------------------------------------------------------------------------

describe("toggleDemo", () => {
  it("toggles off when currently active via localStorage", () => {
    enableDemo();
    const next = toggleDemo();
    expect(next).toBe(false);
    expect(isDemoActive()).toBe(false);
  });

  it("toggles on when currently inactive", () => {
    const next = toggleDemo();
    expect(next).toBe(true);
    expect(window.localStorage.getItem("zenith_demo")).toBe("1");
  });
});

// ---------------------------------------------------------------------------
// resolvePath
// ---------------------------------------------------------------------------

describe("resolvePath — demo inactive", () => {
  it("returns path unchanged when demo is off", () => {
    expect(resolvePath("/api/conditions")).toBe("/api/conditions");
    expect(resolvePath("/api/passes")).toBe("/api/passes");
    expect(resolvePath("/some/other")).toBe("/some/other");
  });
});

describe("resolvePath — demo active", () => {
  beforeEach(() => enableDemo());

  it("remaps /api/conditions → /api/demo/conditions", () => {
    expect(resolvePath("/api/conditions")).toBe("/api/demo/conditions");
  });

  it("remaps /sky-state → /api/demo/sky-state", () => {
    expect(resolvePath("/sky-state")).toBe("/api/demo/sky-state");
  });

  it("remaps /api/passes → /api/demo/passes", () => {
    expect(resolvePath("/api/passes")).toBe("/api/demo/passes");
  });

  it("remaps /api/events → /api/demo/events", () => {
    expect(resolvePath("/api/events")).toBe("/api/demo/events");
  });

  it("does not remap unsupported API paths", () => {
    expect(resolvePath("/api/narrate")).toBe("/api/narrate");
    expect(resolvePath("/api/reference/saturn")).toBe("/api/reference/saturn");
    expect(resolvePath("/api/cultural-names/saturn")).toBe("/api/cultural-names/saturn");
  });

  it("does not double-wrap /api/demo/... paths", () => {
    expect(resolvePath("/api/demo/conditions")).toBe("/api/demo/conditions");
  });

  it("does not remap non-API paths", () => {
    expect(resolvePath("/health")).toBe("/health");
    expect(resolvePath("/static/file.js")).toBe("/static/file.js");
  });
});
