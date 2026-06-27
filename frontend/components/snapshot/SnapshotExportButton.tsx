"use client";

import React from "react";
import { useMemo, useState } from "react";
import {
  createSkySnapshotMetadata,
  serializeSnapshotMetadata,
  type SnapshotLayer,
  type SnapshotLocation,
  type SnapshotSelectedObject,
} from "../../lib/snapshot";

export interface SnapshotExportButtonProps {
  location: SnapshotLocation;
  timeUtc: string;
  selectedObject?: SnapshotSelectedObject;
  layers: SnapshotLayer[];
  shareUrl?: string;
}

export function SnapshotExportButton({
  location,
  timeUtc,
  selectedObject,
  layers,
  shareUrl,
}: SnapshotExportButtonProps) {
  const [status, setStatus] = useState<string>();
  const [fallbackText, setFallbackText] = useState<string>();

  const serialized = useMemo(() => serializeSnapshotMetadata(createSkySnapshotMetadata({
    location,
    timeUtc,
    selectedObject,
    visibleLayers: layers,
    shareUrl,
  })), [layers, location, selectedObject, shareUrl, timeUtc]);

  async function copySnapshot() {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(serialized);
      setFallbackText(undefined);
      setStatus("Snapshot copied");
      window.setTimeout(() => setStatus(undefined), 1_800);
    } catch {
      setFallbackText(serialized);
      setStatus("Copy manually");
    }
  }

  return (
    <div className="snapshot-export">
      <button className="secondary-action-button" type="button" onClick={copySnapshot}>
        Copy snapshot metadata
      </button>
      {status ? <span className="share-status" role="status">{status}</span> : null}
      {fallbackText ? (
        <textarea
          className="snapshot-fallback"
          readOnly
          aria-label="Snapshot metadata"
          value={fallbackText}
        />
      ) : null}
    </div>
  );
}
