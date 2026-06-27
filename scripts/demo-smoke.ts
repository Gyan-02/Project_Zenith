#!/usr/bin/env tsx
/**
 * GYA-46 — Demo Smoke Script
 *
 * Lightweight pre-demo check: validates backend health, demo endpoint JSON,
 * and frontend reachability. No Playwright, no heavy deps.
 *
 * Run via:
 *   npm run smoke
 *
 * Exit code 0 — OK or servers not running (WARN only).
 * Exit code 1 — structural payload error on a reachable server.
 */

import { Socket } from "node:net";

// ---------------------------------------------------------------------------
// Types (matches doctor.ts tone)
// ---------------------------------------------------------------------------

type Status = "OK" | "WARN" | "FAIL";

interface CheckResult {
  label: string;
  status: Status;
  detail: string;
}

// ---------------------------------------------------------------------------
// Colour helpers
// ---------------------------------------------------------------------------

const green  = (s: string) => `\x1b[32m${s}\x1b[0m`;
const yellow = (s: string) => `\x1b[33m${s}\x1b[0m`;
const red    = (s: string) => `\x1b[31m${s}\x1b[0m`;

function icon(s: Status): string {
  if (s === "OK")   return green("✓");
  if (s === "WARN") return yellow("⚠");
  return red("✗");
}

function labelStr(s: Status): string {
  if (s === "OK")   return green("OK  ");
  if (s === "WARN") return yellow("WARN");
  return red("FAIL");
}

function ok(label: string, detail: string): CheckResult   { return { label, status: "OK",   detail }; }
function warn(label: string, detail: string): CheckResult { return { label, status: "WARN", detail }; }
function fail(label: string, detail: string): CheckResult { return { label, status: "FAIL", detail }; }

// ---------------------------------------------------------------------------
// Port reachability (same approach as doctor.ts)
// ---------------------------------------------------------------------------

function isPortOpen(host: string, port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new Socket();
    socket.setTimeout(800);
    socket.once("connect", () => { socket.destroy(); resolve(true); });
    socket.once("timeout", () => { socket.destroy(); resolve(false); });
    socket.once("error",   () => { socket.destroy(); resolve(false); });
    socket.connect(port, host);
  });
}

// ---------------------------------------------------------------------------
// HTTP helpers (no external deps — uses Node built-in fetch if available,
// otherwise falls back to http module)
// ---------------------------------------------------------------------------

async function fetchJson(url: string): Promise<{ ok: boolean; status: number; body: unknown }> {
  const response = await fetch(url, { signal: AbortSignal.timeout(3_000) });
  let body: unknown = null;
  try { body = await response.json(); } catch { /* ignore */ }
  return { ok: response.ok, status: response.status, body };
}

// ---------------------------------------------------------------------------
// Individual checks
// ---------------------------------------------------------------------------

async function checkBackendHealth(base: string): Promise<CheckResult> {
  try {
    const { ok: isOk, body } = await fetchJson(`${base}/health`);
    if (isOk && typeof body === "object" && body !== null && (body as Record<string, unknown>).status === "ok") {
      return ok("Backend health", "GET /health → { status: 'ok' }");
    }
    return fail("Backend health", `Unexpected response: ${JSON.stringify(body)}`);
  } catch (err) {
    return fail("Backend health", `Request failed: ${String(err)}`);
  }
}

async function checkDemoEndpoint(base: string, path: string): Promise<CheckResult> {
  const url = `${base}${path}`;
  const label = `Demo endpoint ${path}`;
  try {
    const { ok: isOk, status, body } = await fetchJson(url);
    if (!isOk) return fail(label, `HTTP ${status}`);
    if (body === null || typeof body !== "object") {
      return fail(label, "Response is not a JSON object/array");
    }
    return ok(label, "Valid JSON response");
  } catch (err) {
    return fail(label, `Request failed: ${String(err)}`);
  }
}

// ---------------------------------------------------------------------------
// Main orchestration
// ---------------------------------------------------------------------------

export interface SmokeResult {
  results: CheckResult[];
  structuralOk: boolean;
}

export async function runSmoke(
  backendBase = "http://localhost:4000",
  frontendBase = "http://localhost:3000",
): Promise<SmokeResult> {
  const results: CheckResult[] = [];

  // 1. Backend reachability
  const backendUp = await isPortOpen("127.0.0.1", 4000);
  if (!backendUp) {
    results.push(warn("Backend port 4000", "Not reachable — start the backend for a full smoke check"));
    results.push(warn("Frontend port 3000", "Skipping frontend check (backend not running)"));
    return { results, structuralOk: true };
  }

  results.push(ok("Backend port 4000", "Reachable"));

  // 2. Health
  results.push(await checkBackendHealth(backendBase));

  // 3. Demo endpoints
  const DEMO_PATHS = [
    "/api/demo/sky-state",
    "/api/demo/conditions",
    "/api/demo/events",
    "/api/demo/passes",
  ];
  for (const path of DEMO_PATHS) {
    results.push(await checkDemoEndpoint(backendBase, path));
  }

  // 4. Frontend
  const frontendUp = await isPortOpen("127.0.0.1", 3000);
  results.push(
    frontendUp
      ? ok("Frontend port 3000", `Reachable at ${frontendBase}`)
      : warn("Frontend port 3000", "Not reachable — run `npm run dev -w frontend`"),
  );

  const structuralOk = results.every((r) => r.status !== "FAIL");
  return { results, structuralOk };
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------

if (
  process.argv[1]?.endsWith("demo-smoke.ts") ||
  process.argv[1]?.endsWith("demo-smoke.js")
) {
  void (async () => {
    console.log("\n🔭  Project Zenith — Demo Smoke Check\n");

    const { results, structuralOk } = await runSmoke();

    for (const r of results) {
      console.log(`  ${icon(r.status)}  [${labelStr(r.status)}]  ${r.label.padEnd(32)} ${r.detail}`);
    }

    const warns = results.filter((r) => r.status === "WARN").length;
    const fails = results.filter((r) => r.status === "FAIL").length;

    console.log();
    if (structuralOk && warns === 0) {
      console.log(green("  All smoke checks passed — demo environment is ready! 🚀"));
    } else if (structuralOk) {
      console.log(yellow(`  ${warns} warning(s) — demo can proceed but some services may be unavailable.`));
    } else {
      console.log(red(`  ${fails} structural failure(s) — fix before running the demo.`));
    }
    console.log();

    process.exit(structuralOk ? 0 : 1);
  })();
}
