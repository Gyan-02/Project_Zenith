/**
 * GYA-46 — Tests for demo-smoke.ts
 *
 * No live servers required. All network calls are mocked.
 */

import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

// ---------------------------------------------------------------------------
// We mock `node:net` before importing runSmoke so Socket calls are intercepted.
// The mock factory builds a Socket that fires "error" (port closed) by default.
// Individual tests that need an open port override the implementation.
// ---------------------------------------------------------------------------

function makeSocket(eventToFire: "connect" | "error" = "error") {
  const handlers: Record<string, Array<() => void>> = {};
  return {
    setTimeout: vi.fn(),
    destroy: vi.fn(),
    connect: vi.fn().mockImplementation(() => {
      setTimeout(() => (handlers[eventToFire] ?? []).forEach((fn) => fn()), 0);
    }),
    once: vi.fn().mockImplementation((event: string, fn: () => void) => {
      if (!handlers[event]) handlers[event] = [];
      handlers[event].push(fn);
    }),
  };
}

vi.mock("node:net", () => ({
  Socket: vi.fn().mockImplementation(() => makeSocket("error")),
}));

// Import after the mock is in place
import { runSmoke } from "./demo-smoke.js";
import { Socket } from "node:net";

const MockSocket = Socket as unknown as ReturnType<typeof vi.fn>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function okResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), { status: 200 });
}

function badResponse(status: number): Response {
  return new Response(null, { status });
}

// ---------------------------------------------------------------------------
// Servers not running (default mock: Socket fires "error")
// ---------------------------------------------------------------------------

describe("runSmoke – backend not reachable", () => {
  it("returns structuralOk=true with WARN (not FAIL) when backend is down", async () => {
    MockSocket.mockImplementation(() => makeSocket("error"));
    const { results, structuralOk } = await runSmoke();
    expect(structuralOk).toBe(true);
    const statuses = results.map((r) => r.status);
    expect(statuses).not.toContain("FAIL");
    expect(statuses).toContain("WARN");
  });
});

// ---------------------------------------------------------------------------
// Backend up, all endpoints healthy
// ---------------------------------------------------------------------------

describe("runSmoke – backend up, all endpoints healthy", () => {
  beforeEach(() => {
    MockSocket.mockImplementation(() => makeSocket("connect"));
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((url: string) => {
        if (url.includes("/health"))            return Promise.resolve(okResponse({ status: "ok" }));
        if (url.includes("/api/demo/sky-state")) return Promise.resolve(okResponse({ planets: [] }));
        if (url.includes("/api/demo/conditions"))return Promise.resolve(okResponse({ quality: "Excellent" }));
        if (url.includes("/api/demo/events"))   return Promise.resolve(okResponse([]));
        if (url.includes("/api/demo/passes"))   return Promise.resolve(okResponse({ passes: [] }));
        return Promise.resolve(okResponse({}));
      }),
    );
  });
  afterEach(() => vi.unstubAllGlobals());

  it("returns structuralOk=true when all endpoints respond correctly", async () => {
    const { structuralOk } = await runSmoke();
    expect(structuralOk).toBe(true);
  });

  it("has no FAIL results when backend is healthy", async () => {
    const { results } = await runSmoke();
    expect(results.filter((r) => r.status === "FAIL")).toHaveLength(0);
  });

  it("includes an OK result for each demo endpoint", async () => {
    const { results } = await runSmoke();
    const paths = ["/api/demo/sky-state", "/api/demo/conditions", "/api/demo/events", "/api/demo/passes"];
    for (const p of paths) {
      expect(results.some((r) => r.label.includes(p) && r.status === "OK")).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// Backend up, a demo endpoint returns server error
// ---------------------------------------------------------------------------

describe("runSmoke – backend up, demo endpoint broken", () => {
  beforeEach(() => {
    MockSocket.mockImplementation(() => makeSocket("connect"));
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((url: string) => {
        if (url.includes("/health"))            return Promise.resolve(okResponse({ status: "ok" }));
        if (url.includes("/api/demo/sky-state")) return Promise.resolve(badResponse(500));
        return Promise.resolve(okResponse({}));
      }),
    );
  });
  afterEach(() => vi.unstubAllGlobals());

  it("returns structuralOk=false when a demo endpoint returns a server error", async () => {
    const { structuralOk } = await runSmoke();
    expect(structuralOk).toBe(false);
  });

  it("identifies the failing endpoint in results", async () => {
    const { results } = await runSmoke();
    const failed = results.filter((r) => r.status === "FAIL");
    expect(failed.length).toBeGreaterThan(0);
    expect(failed.some((r) => r.label.includes("sky-state"))).toBe(true);
  });
});
