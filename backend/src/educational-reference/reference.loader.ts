/**
 * GYA-12 – Educational Reference loader.
 *
 * Reads `data/educational-reference/objects.json` relative to the repo root
 * and validates every entry against the JSON Schema at load time.  Throws a
 * descriptive error immediately so bad data is caught at startup, not lazily.
 *
 * No network calls, no AI calls — purely static data.
 */

import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { ReferenceObject } from "./reference.types.js";

// ---------------------------------------------------------------------------
// Path resolution
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Resolve a path relative to the repository root (three directories up from
 * `backend/src/educational-reference/`).
 */
function repoRoot(...segments: string[]): string {
  return resolve(__dirname, "..", "..", "..", ...segments);
}

// ---------------------------------------------------------------------------
// Minimal schema validation
// ---------------------------------------------------------------------------

const REQUIRED_KEYS: ReadonlyArray<keyof ReferenceObject> = [
  "objectId",
  "name",
  "kind",
  "oneLine",
  "whyItMatters",
  "quickFacts",
  "observationTips",
  "kidFriendlySummary",
  "sourceNotes",
] as const;

const VALID_KINDS = new Set([
  "star",
  "planet",
  "moon",
  "satellite",
  "constellation",
  "cluster",
  "sun",
]);

function validateEntry(entry: unknown, index: number): ReferenceObject {
  if (typeof entry !== "object" || entry === null || Array.isArray(entry)) {
    throw new TypeError(`objects.json[${index}] is not an object`);
  }
  const obj = entry as Record<string, unknown>;

  for (const key of REQUIRED_KEYS) {
    if (!(key in obj)) {
      throw new TypeError(
        `objects.json[${index}] missing required field "${key}"`,
      );
    }
  }

  if (typeof obj.objectId !== "string" || obj.objectId.length === 0) {
    throw new TypeError(`objects.json[${index}].objectId must be a non-empty string`);
  }
  if (typeof obj.name !== "string" || obj.name.length === 0) {
    throw new TypeError(`objects.json[${index}].name must be a non-empty string`);
  }
  if (!VALID_KINDS.has(obj.kind as string)) {
    throw new TypeError(
      `objects.json[${index}].kind "${obj.kind}" is not a valid ReferenceObjectKind`,
    );
  }
  if (typeof obj.oneLine !== "string" || obj.oneLine.length === 0) {
    throw new TypeError(`objects.json[${index}].oneLine must be a non-empty string`);
  }
  if (typeof obj.whyItMatters !== "string" || obj.whyItMatters.length === 0) {
    throw new TypeError(`objects.json[${index}].whyItMatters must be a non-empty string`);
  }
  if (!Array.isArray(obj.quickFacts) || obj.quickFacts.length < 2) {
    throw new TypeError(`objects.json[${index}].quickFacts must be an array with at least 2 items`);
  }
  for (const [fi, fact] of (obj.quickFacts as unknown[]).entries()) {
    if (
      typeof fact !== "object" ||
      fact === null ||
      typeof (fact as Record<string, unknown>).label !== "string" ||
      typeof (fact as Record<string, unknown>).value !== "string"
    ) {
      throw new TypeError(
        `objects.json[${index}].quickFacts[${fi}] must have string label and value`,
      );
    }
  }
  if (!Array.isArray(obj.observationTips) || obj.observationTips.length < 1) {
    throw new TypeError(
      `objects.json[${index}].observationTips must be an array with at least 1 item`,
    );
  }
  if (typeof obj.kidFriendlySummary !== "string" || obj.kidFriendlySummary.length === 0) {
    throw new TypeError(`objects.json[${index}].kidFriendlySummary must be a non-empty string`);
  }
  if (typeof obj.sourceNotes !== "string" || obj.sourceNotes.length === 0) {
    throw new TypeError(`objects.json[${index}].sourceNotes must be a non-empty string`);
  }

  return obj as unknown as ReferenceObject;
}

// ---------------------------------------------------------------------------
// Public loader
// ---------------------------------------------------------------------------

/**
 * Load and validate the educational reference dataset.
 *
 * @param dataPath - Override the path to objects.json (for testing).
 */
export function loadReferenceObjects(
  dataPath?: string,
): ReferenceObject[] {
  const filePath = dataPath ?? repoRoot("data", "educational-reference", "objects.json");
  const raw = readFileSync(filePath, "utf8");

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new SyntaxError(
      `Failed to parse educational reference JSON at ${filePath}: ${String(err)}`,
    );
  }

  if (!Array.isArray(parsed)) {
    throw new TypeError("objects.json must be a JSON array");
  }

  return parsed.map((entry, index) => validateEntry(entry, index));
}
