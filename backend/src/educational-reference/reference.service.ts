/**
 * GYA-12 – Educational Reference service.
 *
 * Pure in-memory service over the loaded dataset.  No AI calls, no network.
 */

import { loadReferenceObjects } from "./reference.loader.js";
import type {
  ListReferencesOptions,
  ReferenceObject,
  ReferenceObjectKind,
  ReferenceResult,
} from "./reference.types.js";

// ---------------------------------------------------------------------------
// Search helpers
// ---------------------------------------------------------------------------

function normalise(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9 ]/g, " ");
}

function score(obj: ReferenceObject, tokens: string[]): number {
  const fields = [
    obj.objectId,
    obj.name,
    obj.oneLine,
    obj.whyItMatters,
    ...obj.quickFacts.map((f) => `${f.label} ${f.value}`),
    ...obj.observationTips,
    obj.kidFriendlySummary,
  ]
    .map(normalise)
    .join(" ");

  return tokens.reduce((sum, token) => {
    const regex = new RegExp(`\\b${token}\\b`, "g");
    const matches = fields.match(regex);
    return sum + (matches ? matches.length : 0);
  }, 0);
}

// ---------------------------------------------------------------------------
// Service class
// ---------------------------------------------------------------------------

export class EducationalReferenceService {
  private readonly objects: ReadonlyArray<ReferenceObject>;
  /** Index by objectId for O(1) lookup. */
  private readonly byId: ReadonlyMap<string, ReferenceObject>;

  constructor(objects?: ReferenceObject[]) {
    this.objects = objects ?? loadReferenceObjects();
    this.byId = new Map(this.objects.map((o) => [o.objectId, o]));
  }

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  /**
   * Look up a reference by its objectId.
   *
   * @returns `{ found: true, ...ReferenceObject }` or `{ found: false, objectId }`.
   */
  getReferenceByObjectId(objectId: string): ReferenceResult {
    const found = this.byId.get(objectId.toLowerCase().trim());
    if (!found) return { found: false, objectId };
    return { found: true, ...found };
  }

  /**
   * Full-text search across all fields.  Returns results ranked by relevance,
   * descending.  Unmatched entries are excluded.
   *
   * @param query - Free-form search string.
   * @param limit - Maximum results (default 10).
   */
  searchReferences(query: string, limit = 10): ReferenceObject[] {
    if (!query.trim()) return [];
    const tokens = normalise(query).split(/\s+/).filter(Boolean);
    return [...this.objects]
      .map((obj) => ({ obj, s: score(obj, tokens) }))
      .filter(({ s }) => s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, limit)
      .map(({ obj }) => obj);
  }

  /**
   * List all reference objects, optionally filtered by kind.
   */
  listReferences(options: ListReferencesOptions = {}): ReferenceObject[] {
    if (options.kind) {
      return this.objects.filter((o) => o.kind === options.kind) as ReferenceObject[];
    }
    return [...this.objects];
  }
}
