/**
 * GYA-33 – Sky snapshot metadata model.
 *
 * Creates a serialisable, shareable metadata artifact representing the current
 * sky view. Does NOT capture the Cesium canvas — that is deferred to GYA-35.
 *
 * Integration note (for canvas export — GYA-35):
 *   const metadata = createSkySnapshotMetadata({ ... });
 *   const canvas   = viewer.scene.canvas;
 *   const blob     = await new Promise<Blob>((resolve) =>
 *     canvas.toBlob((b) => resolve(b!), "image/png")
 *   );
 *   const fileName = buildSnapshotFileName(metadata);
 *   // zip metadata JSON + PNG blob and offer download.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SnapshotSelectedObject {
  id: string;
  name: string;
}

export interface SnapshotLocation {
  lat: number;
  lon: number;
  label?: string;
}

export type SnapshotLayer =
  | "planets"
  | "satellites"
  | "iss"
  | "moon"
  | "constellations"
  | "meteor_showers"
  | "passes"
  | "events";

export interface SkySnapshotMetadata {
  /** Always "Project Zenith" */
  project: "Project Zenith";
  location: SnapshotLocation;
  timeUtc: string;
  selectedObject?: SnapshotSelectedObject;
  visibleLayers: SnapshotLayer[];
  shareUrl?: string;
  /** ISO timestamp when this snapshot was created */
  generatedAt: string;
}

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------

export interface CreateSnapshotInput {
  location: SnapshotLocation;
  timeUtc: string;
  selectedObject?: SnapshotSelectedObject;
  visibleLayers?: SnapshotLayer[];
  shareUrl?: string;
  /** Inject a fixed timestamp for deterministic tests */
  nowOverride?: string;
}

// ---------------------------------------------------------------------------
// createSkySnapshotMetadata
// ---------------------------------------------------------------------------

export function createSkySnapshotMetadata(input: CreateSnapshotInput): SkySnapshotMetadata {
  return {
    project: "Project Zenith",
    location: input.location,
    timeUtc: input.timeUtc,
    ...(input.selectedObject ? { selectedObject: input.selectedObject } : {}),
    visibleLayers: input.visibleLayers ?? [],
    ...(input.shareUrl ? { shareUrl: input.shareUrl } : {}),
    generatedAt: input.nowOverride ?? new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// buildSnapshotFileName
// ---------------------------------------------------------------------------

/** e.g. "zenith-patna-2026-08-12T203000-saturn.png" */
export function buildSnapshotFileName(
  metadata: SkySnapshotMetadata,
  extension = "json",
): string {
  const locationSlug = (metadata.location.label ?? `${metadata.location.lat},${metadata.location.lon}`)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  const dateSlug = metadata.timeUtc
    .replace(/:/g, "")
    .replace(/\..+$/, "")
    .replace("T", "T");

  const objectSlug = metadata.selectedObject
    ? `-${metadata.selectedObject.id.toLowerCase().replace(/[^a-z0-9]/g, "-")}`
    : "";

  return `zenith-${locationSlug}-${dateSlug}${objectSlug}.${extension}`;
}

// ---------------------------------------------------------------------------
// serializeSnapshotMetadata
// ---------------------------------------------------------------------------

export function serializeSnapshotMetadata(metadata: SkySnapshotMetadata): string {
  return JSON.stringify(metadata, null, 2);
}
