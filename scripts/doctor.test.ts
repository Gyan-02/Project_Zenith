/**
 * GYA-34 – Tests for the readiness doctor.
 *
 * Uses the exported `runDoctor()` function so we can inject a fake root path
 * and env vars without live network calls (ports are always WARN in CI).
 */

import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { join } from "node:path";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { runDoctor } from "./doctor.js";

// ---------------------------------------------------------------------------
// Fake filesystem root builder
// ---------------------------------------------------------------------------

function makeFakeRoot(opts: {
  includeBackend?: boolean;
  includeFrontend?: boolean;
  includeCesium?: boolean;
}): string {
  const root = join(tmpdir(), `zenith-doctor-test-${Date.now()}`);

  if (opts.includeBackend) {
    mkdirSync(join(root, "backend"), { recursive: true });
    writeFileSync(join(root, "backend", "package.json"), "{}");
  }
  if (opts.includeFrontend) {
    mkdirSync(join(root, "frontend"), { recursive: true });
    writeFileSync(join(root, "frontend", "package.json"), "{}");
  }
  if (opts.includeCesium) {
    mkdirSync(join(root, "frontend", "public", "cesium"), { recursive: true });
    writeFileSync(join(root, "frontend", "public", "cesium", "Cesium.js"), "// mock");
  }

  return root;
}

function cleanupRoot(root: string) {
  rmSync(root, { recursive: true, force: true });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("runDoctor – env vars", () => {
  beforeEach(() => {
    delete process.env.GEMINI_API_KEY;
    delete process.env.OPENWEATHER_API_KEY;
    delete process.env.NEXT_PUBLIC_API_URL;
  });
  afterEach(() => {
    delete process.env.GEMINI_API_KEY;
    delete process.env.OPENWEATHER_API_KEY;
    delete process.env.NEXT_PUBLIC_API_URL;
  });

  it("reports WARN for missing optional env vars (not FAIL)", async () => {
    const root = makeFakeRoot({ includeBackend: true, includeFrontend: true });
    try {
      const { results } = await runDoctor(root);
      const geminiCheck = results.find((r) => r.label === "Env: GEMINI_API_KEY");
      expect(geminiCheck?.status).toBe("WARN");
      expect(geminiCheck?.detail).not.toContain("secret");
    } finally {
      cleanupRoot(root);
    }
  });

  it("does NOT print the secret value when env is set", async () => {
    process.env.GEMINI_API_KEY = "super-secret-key-abc123";
    const root = makeFakeRoot({ includeBackend: true, includeFrontend: true });
    try {
      const { results } = await runDoctor(root);
      const geminiCheck = results.find((r) => r.label === "Env: GEMINI_API_KEY");
      expect(geminiCheck?.status).toBe("OK");
      // Detail must mention length but NEVER the actual value
      expect(geminiCheck?.detail).toContain("hidden");
      expect(geminiCheck?.detail).not.toContain("super-secret-key-abc123");
    } finally {
      cleanupRoot(root);
    }
  });
});

describe("runDoctor – Cesium asset", () => {
  it("reports OK when Cesium.js exists", async () => {
    const root = makeFakeRoot({ includeBackend: true, includeFrontend: true, includeCesium: true });
    try {
      const { results } = await runDoctor(root);
      const cesiumCheck = results.find((r) => r.label === "Cesium assets");
      expect(cesiumCheck?.status).toBe("OK");
    } finally {
      cleanupRoot(root);
    }
  });

  it("reports WARN (not FAIL) when Cesium.js is missing", async () => {
    const root = makeFakeRoot({ includeBackend: true, includeFrontend: true, includeCesium: false });
    try {
      const { results } = await runDoctor(root);
      const cesiumCheck = results.find((r) => r.label === "Cesium assets");
      expect(cesiumCheck?.status).toBe("WARN");
    } finally {
      cleanupRoot(root);
    }
  });
});

describe("runDoctor – workspace packages", () => {
  it("reports FAIL when backend package.json is missing", async () => {
    const root = makeFakeRoot({ includeBackend: false, includeFrontend: true });
    try {
      const { results, structuralOk } = await runDoctor(root);
      const backendCheck = results.find((r) => r.label === "Workspace: backend");
      expect(backendCheck?.status).toBe("FAIL");
      expect(structuralOk).toBe(false);
    } finally {
      cleanupRoot(root);
    }
  });

  it("reports OK when both workspaces are present", async () => {
    const root = makeFakeRoot({ includeBackend: true, includeFrontend: true });
    try {
      const { results } = await runDoctor(root);
      const backendCheck = results.find((r) => r.label === "Workspace: backend");
      const frontendCheck = results.find((r) => r.label === "Workspace: frontend");
      expect(backendCheck?.status).toBe("OK");
      expect(frontendCheck?.status).toBe("OK");
    } finally {
      cleanupRoot(root);
    }
  });
});

describe("runDoctor – output stability", () => {
  it("always includes a Node version check", async () => {
    const root = makeFakeRoot({ includeBackend: true, includeFrontend: true });
    try {
      const { results } = await runDoctor(root);
      const nodeCheck = results.find((r) => r.label === "Node version");
      expect(nodeCheck).toBeDefined();
      expect(nodeCheck?.detail).toMatch(/v\d+\.\d+\.\d+/);
    } finally {
      cleanupRoot(root);
    }
  });
});
