/**
 * GYA-19 – CulturalNamesCard React component.
 *
 * Displays cultural name entries for a selected sky object.
 * Does not wire into any page yet — integration left for a later ticket.
 *
 * Wiring note (for GYA-36 / ObjectDetailsPanel integration):
 *   Import and render inside ObjectDetailsPanel.tsx:
 *   <CulturalNamesCard objectId={selectedObjectId} selectedTraditionId="vedic" />
 */

import React from "react";
import { useCulturalNames } from "../../hooks/useCulturalNames";
import type { CulturalObjectEntry, TraditionEntry } from "../../lib/culturalNames";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface CulturalNamesCardProps {
  /** Lower-case sky object id (e.g. "jupiter"). When undefined shows empty state. */
  objectId?: string;
  /**
   * Which tradition to display first.
   * If not set, all available traditions are shown.
   */
  selectedTraditionId?: string;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function TraditionRow({
  slug,
  entry,
}: {
  slug: string;
  entry: TraditionEntry;
}) {
  return (
    <div data-testid={`tradition-${slug}`} style={{ marginBottom: "0.75rem" }}>
      <strong style={{ textTransform: "capitalize" }}>{slug}</strong>
      <div>
        <span>{entry.name}</span>
        {entry.transliteration && (
          <span style={{ marginLeft: "0.5rem", opacity: 0.7 }}>
            ({entry.transliteration})
          </span>
        )}
      </div>
      {entry.meaning && (
        <div style={{ fontSize: "0.875rem", opacity: 0.8 }}>{entry.meaning}</div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main card
// ---------------------------------------------------------------------------

export function CulturalNamesCard({
  objectId,
  selectedTraditionId,
}: CulturalNamesCardProps) {
  const { data, isLoading, error } = useCulturalNames(objectId);

  if (!objectId) {
    return (
      <div data-testid="cultural-names-empty">
        No cultural names loaded for this object yet.
      </div>
    );
  }

  if (isLoading) {
    return <div data-testid="cultural-names-loading">Loading cultural names…</div>;
  }

  if (error) {
    return (
      <div data-testid="cultural-names-error">
        Could not load cultural names: {error}
      </div>
    );
  }

  if (!data || Object.keys(data.names).length === 0) {
    return (
      <div data-testid="cultural-names-empty">
        No cultural names loaded for this object yet.
      </div>
    );
  }

  // Determine which traditions to show
  const entries: [string, TraditionEntry][] = selectedTraditionId
    ? Object.entries(data.names).filter(([slug]) => slug === selectedTraditionId)
    : Object.entries(data.names);

  return (
    <div data-testid="cultural-names-card">
      <h3 style={{ marginBottom: "0.5rem" }}>{data.scientific} — Cultural Names</h3>
      {entries.length === 0 ? (
        <div data-testid="cultural-names-empty">
          No cultural names loaded for this object yet.
        </div>
      ) : (
        entries.map(([slug, entry]) => (
          <TraditionRow key={slug} slug={slug} entry={entry} />
        ))
      )}
    </div>
  );
}
