/**
 * GYA-12 – Tests for reference.loader.ts
 *
 * Validates dataset integrity, schema enforcement, and error paths.
 */

import { writeFileSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { loadReferenceObjects } from "./reference.loader.js";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { ReferenceObject } from "./reference.types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** Resolve path to the real objects.json in the repo. */
function realDataPath(): string {
  // __tests__/ → educational-reference/ → src/ → backend/ → repo root
  return resolve(__dirname, "..", "..", "..", "data", "educational-reference", "objects.json");
}

// ---------------------------------------------------------------------------
// Temporary file helpers
// ---------------------------------------------------------------------------

let tmpDir: string;

beforeAll(() => {
  tmpDir = join(tmpdir(), `zenith-edu-test-${Date.now()}`);
  mkdirSync(tmpDir, { recursive: true });
});

afterAll(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

function writeTmp(name: string, content: string): string {
  const p = join(tmpDir, name);
  writeFileSync(p, content, "utf8");
  return p;
}

// ---------------------------------------------------------------------------
// Real dataset validation
// ---------------------------------------------------------------------------

describe("loadReferenceObjects – real dataset", () => {
  it("loads without throwing", () => {
    expect(() => loadReferenceObjects(realDataPath())).not.toThrow();
  });

  it("returns at least 14 entries", () => {
    const objects = loadReferenceObjects(realDataPath());
    expect(objects.length).toBeGreaterThanOrEqual(14);
  });

  it("all entries have the required top-level fields", () => {
    const objects = loadReferenceObjects(realDataPath());
    for (const obj of objects) {
      expect(obj).toHaveProperty("objectId");
      expect(obj).toHaveProperty("name");
      expect(obj).toHaveProperty("kind");
      expect(obj).toHaveProperty("oneLine");
      expect(obj).toHaveProperty("whyItMatters");
      expect(obj).toHaveProperty("quickFacts");
      expect(obj).toHaveProperty("observationTips");
      expect(obj).toHaveProperty("kidFriendlySummary");
      expect(obj).toHaveProperty("sourceNotes");
    }
  });

  it("all objectIds are unique", () => {
    const objects = loadReferenceObjects(realDataPath());
    const ids = objects.map((o: ReferenceObject) => o.objectId);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it("each entry has at least 2 quickFacts", () => {
    const objects = loadReferenceObjects(realDataPath());
    for (const obj of objects) {
      expect(obj.quickFacts.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("required object IDs are present (sun, moon, planets, iss, key stars)", () => {
    const objects = loadReferenceObjects(realDataPath());
    const ids = new Set(objects.map((o: ReferenceObject) => o.objectId));
    const required = [
      "sun", "moon",
      "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune",
      "iss", "sirius", "polaris", "orion", "pleiades",
    ];
    for (const id of required) {
      expect(ids.has(id), `Missing required objectId: "${id}"`).toBe(true);
    }
  });

  it("all kind values are valid ReferenceObjectKind strings", () => {
    const validKinds = new Set(["star", "planet", "moon", "satellite", "constellation", "cluster", "sun"]);
    const objects = loadReferenceObjects(realDataPath());
    for (const obj of objects) {
      expect(validKinds.has(obj.kind), `Invalid kind "${obj.kind}" for ${obj.objectId}`).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// Error paths
// ---------------------------------------------------------------------------

describe("loadReferenceObjects – error paths", () => {
  it("throws SyntaxError for malformed JSON", () => {
    const p = writeTmp("bad.json", "{ not valid json");
    expect(() => loadReferenceObjects(p)).toThrow(SyntaxError);
  });

  it("throws TypeError when root is not an array", () => {
    const p = writeTmp("obj.json", '{"objectId":"x"}');
    expect(() => loadReferenceObjects(p)).toThrow(TypeError);
  });

  it("throws TypeError when a required field is missing", () => {
    const p = writeTmp("missing-field.json", JSON.stringify([
      { objectId: "x", name: "X", kind: "star" /* missing other fields */ },
    ]));
    expect(() => loadReferenceObjects(p)).toThrow(TypeError);
  });

  it("throws TypeError for an invalid kind value", () => {
    const validBase = {
      objectId: "x",
      name: "X",
      kind: "INVALID_KIND",
      oneLine: "...",
      whyItMatters: "...",
      quickFacts: [{ label: "A", value: "B" }, { label: "C", value: "D" }],
      observationTips: ["tip"],
      kidFriendlySummary: "...",
      sourceNotes: "...",
    };
    const p = writeTmp("bad-kind.json", JSON.stringify([validBase]));
    expect(() => loadReferenceObjects(p)).toThrow(TypeError);
  });
});
