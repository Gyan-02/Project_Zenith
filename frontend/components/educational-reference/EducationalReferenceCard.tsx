/**
 * GYA-26 – EducationalReferenceCard React component.
 *
 * Displays an educational summary for a selected sky object.
 * Does not wire into the main page yet.
 *
 * Wiring note (for GYA-36 / ObjectDetailsPanel integration):
 *   import { EducationalReferenceCard } from
 *     "@/components/educational-reference/EducationalReferenceCard";
 *   <EducationalReferenceCard objectId={selectedObjectId} />
 *
 * Props also accept a pre-loaded `reference` for server-side or storybook use.
 */

import React from "react";
import { useEducationalReference } from "../../hooks/useEducationalReference";
import type { EducationalReference } from "../../lib/educationalReference";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface EducationalReferenceCardProps {
  /** Lower-case sky object id (e.g. "saturn"). */
  objectId?: string;
  /**
   * Optional pre-loaded reference — bypasses the fetch hook entirely.
   * Useful for SSR or Storybook scenarios.
   */
  reference?: EducationalReference;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function EducationalReferenceCard({
  objectId,
  reference: preloaded,
}: EducationalReferenceCardProps) {
  const {
    reference: fetched,
    isLoading,
    error,
  } = useEducationalReference(preloaded ? undefined : objectId);

  const ref = preloaded ?? fetched;

  // ── Empty / idle ──────────────────────────────────────────────────────────

  if (!objectId && !preloaded) {
    return (
      <div data-testid="edu-ref-empty">
        Select a sky object to see educational facts.
      </div>
    );
  }

  // ── Loading ───────────────────────────────────────────────────────────────

  if (isLoading) {
    return <div data-testid="edu-ref-loading">Loading educational reference…</div>;
  }

  // ── Error ─────────────────────────────────────────────────────────────────

  if (error) {
    return (
      <div data-testid="edu-ref-error">
        Could not load reference: {error}
      </div>
    );
  }

  // ── No data ───────────────────────────────────────────────────────────────

  if (!ref) {
    return (
      <div data-testid="edu-ref-empty">
        No educational reference available for this object.
      </div>
    );
  }

  // ── Data ──────────────────────────────────────────────────────────────────

  return (
    <div data-testid="edu-ref-card">
      {/* Header */}
      <h3 data-testid="edu-ref-name">{ref.name}</h3>
      <p data-testid="edu-ref-one-line">{ref.oneLine}</p>

      {/* Why it matters */}
      <section>
        <h4>Why it matters</h4>
        <p data-testid="edu-ref-why">{ref.whyItMatters}</p>
      </section>

      {/* Quick facts */}
      {ref.quickFacts.length > 0 && (
        <section>
          <h4>Quick facts</h4>
          <dl data-testid="edu-ref-quick-facts">
            {ref.quickFacts.map((fact) => (
              <React.Fragment key={fact.label}>
                <dt>{fact.label}</dt>
                <dd>{fact.value}</dd>
              </React.Fragment>
            ))}
          </dl>
        </section>
      )}

      {/* Observation tips */}
      {ref.observationTips.length > 0 && (
        <section>
          <h4>Observation tips</h4>
          <ul data-testid="edu-ref-tips">
            {ref.observationTips.map((tip, i) => (
              <li key={i}>{tip}</li>
            ))}
          </ul>
        </section>
      )}

      {/* Kid-friendly summary */}
      <section>
        <h4>Did you know?</h4>
        <p data-testid="edu-ref-kid-summary">{ref.kidFriendlySummary}</p>
      </section>
    </div>
  );
}
