#!/usr/bin/env tsx
/**
 * GYA-34 – Project Zenith Readiness Doctor
 *
 * Run before demos:
 *   npm run doctor
 *
 * Exit code 0 — project is structurally OK (warnings are non-fatal).
 * Exit code 1 — structural problem detected (missing workspace, broken Node version, etc.).
 */

import { existsSync } from "node:fs";
import { join } from "node:path";
import { Socket } from "node:net";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Status = "OK" | "WARN" | "FAIL";

interface CheckResult {
  label: string;
  status: Status;
  detail: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const green  = (s: string) => `\x1b[32m${s}\x1b[0m`;
const yellow = (s: string) => `\x1b[33m${s}\x1b[0m`;
const red    = (s: string) => `\x1b[31m${s}\x1b[0m`;

function icon(s: Status): string {
  if (s === "OK")   return green("✓");
  if (s === "WARN") return yellow("⚠");
  return red("✗");
}

function label(s: Status): string {
  if (s === "OK")   return green("OK  ");
  if (s === "WARN") return yellow("WARN");
  return red("FAIL");
}

function check(checkLabel: string, status: Status, detail: string): CheckResult {
  return { label: checkLabel, status, detail };
}

// ---------------------------------------------------------------------------
// Checks
// ---------------------------------------------------------------------------

/** Node version — must be >= 20 */
function checkNode(): CheckResult {
  const raw = process.version.slice(1); // e.g. "22.0.0"
  const major = parseInt(raw.split(".")[0] ?? "0", 10);
  return major >= 20
    ? check("Node version", "OK",   `v${raw}`)
    : check("Node version", "FAIL", `v${raw} — requires Node >=20`);
}

/** Workspace packages exist as directories */
function checkWorkspaces(root: string): CheckResult[] {
  const workspaces = ["backend", "frontend"];
  return workspaces.map((ws) => {
    const exists = existsSync(join(root, ws, "package.json"));
    return check(
      `Workspace: ${ws}`,
      exists ? "OK" : "FAIL",
      exists ? `${ws}/package.json found` : `${ws}/package.json MISSING`,
    );
  });
}

/** Cesium static assets */
function checkCesium(root: string): CheckResult {
  const path = join(root, "frontend", "public", "cesium", "Cesium.js");
  return existsSync(path)
    ? check("Cesium assets", "OK",   "frontend/public/cesium/Cesium.js found")
    : check("Cesium assets", "WARN", "frontend/public/cesium/Cesium.js not found — globe will be degraded");
}

/** Environment variable checks */
function checkEnvVar(name: string, required: boolean): CheckResult {
  const val = process.env[name];
  if (val && val.length > 0) {
    return check(`Env: ${name}`, "OK", `set (${val.length} chars, value hidden)`);
  }
  return check(
    `Env: ${name}`,
    required ? "FAIL" : "WARN",
    `not set${required ? " — required" : " — optional, some features will be degraded"}`,
  );
}

/** Try to reach a port with a short timeout */
function checkPort(host: string, port: number, portLabel: string): Promise<CheckResult> {
  return new Promise((resolve) => {
    const socket = new Socket();
    const timeout = 800;
    socket.setTimeout(timeout);
    socket.once("connect", () => {
      socket.destroy();
      resolve(check(portLabel, "OK", `${host}:${port} reachable`));
    });
    socket.once("timeout", () => {
      socket.destroy();
      resolve(check(portLabel, "WARN", `${host}:${port} not reachable (timeout ${timeout}ms)`));
    });
    socket.once("error", () => {
      socket.destroy();
      resolve(check(portLabel, "WARN", `${host}:${port} not reachable`));
    });
    socket.connect(port, host);
  });
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export async function runDoctor(root = process.cwd()): Promise<{
  results: CheckResult[];
  structuralOk: boolean;
}> {
  const portChecks = await Promise.all([
    checkPort("127.0.0.1", 4000, "Backend port 4000"),
    checkPort("127.0.0.1", 3000, "Frontend port 3000"),
  ]);

  const results: CheckResult[] = [
    checkNode(),
    ...checkWorkspaces(root),
    checkCesium(root),
    checkEnvVar("GEMINI_API_KEY", false),
    checkEnvVar("OPENWEATHER_API_KEY", false),
    checkEnvVar("NEXT_PUBLIC_API_URL", false),
    ...portChecks,
  ];

  const structuralOk = results.every((r) => r.status !== "FAIL");
  return { results, structuralOk };
}

// Run when executed directly (not when imported by tests)
if (process.argv[1]?.endsWith("doctor.ts") || process.argv[1]?.endsWith("doctor.js")) {
  void (async () => {
    console.log("\n🔭  Project Zenith — Readiness Doctor\n");

    const { results, structuralOk } = await runDoctor();

    for (const r of results) {
      console.log(`  ${icon(r.status)}  [${label(r.status)}]  ${r.label.padEnd(28)} ${r.detail}`);
    }

    const warns = results.filter((r) => r.status === "WARN").length;
    const fails = results.filter((r) => r.status === "FAIL").length;

    console.log();
    if (structuralOk && warns === 0) {
      console.log(green("  All checks passed — demo environment is ready! 🚀"));
    } else if (structuralOk) {
      console.log(yellow(`  ${warns} warning(s) — demo can proceed but some features may be degraded.`));
    } else {
      console.log(red(`  ${fails} structural failure(s) — fix before running the demo.`));
    }
    console.log();

    process.exit(structuralOk ? 0 : 1);
  })();
}
