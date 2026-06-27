/**
 * GYA-41 — Globe selection highlight helpers
 *
 * Pure helper functions; do NOT import CesiumScene or app/page.tsx.
 * Call these from the component that already holds the SkyStateRenderer
 * and Cesium namespace reference.
 *
 * Usage example (inside CesiumScene or a caller):
 *
 *   import { highlightSelected } from "./selection-style";
 *
 *   // When selected object changes:
 *   highlightSelected(renderer, nextId, prevId, Cesium);
 *
 * API:
 *   applySelectionStyle(entity, Cesium)   — emphasise a single entity
 *   clearSelectionStyle(entity, Cesium)   — restore a single entity to defaults
 *   highlightSelected(renderer, nextId, prevId?, Cesium) — swap old → new
 */

import type { Entity } from "cesium";
import type { SkyObjectKind } from "../../lib/skyState";
import type { SkyStateRenderer } from "./sky-state-renderer";

// ---------------------------------------------------------------------------
// Internal constants — mirror the renderer's COLORS table so we can reset
// exactly, without importing the renderer module.
// ---------------------------------------------------------------------------

const DEFAULT_PIXEL_SIZE: Record<SkyObjectKind, number> = {
  planet: 11,
  satellite: 7,
  iss: 15,
  moon: 12,
  star: 6,
  constellation: 6, // constellation entities are polylines, not points
  meteor_shower: 10,
};

const SELECTED_PIXEL_SIZE = 16;
const SELECTED_OUTLINE_WIDTH = 3;
const SELECTED_OUTLINE_ALPHA = 0.9; // rgba alpha for glow colour
const DEFAULT_OUTLINE_WIDTH = 1;

// ---------------------------------------------------------------------------
// Typed Cesium subset (avoids importing the full cesium package at test time)
// ---------------------------------------------------------------------------

type CesiumColor = {
  fromCssColorString(css: string): CesiumColorInstance;
  WHITE: CesiumColorInstance;
};

type CesiumColorInstance = {
  withAlpha(alpha: number): CesiumColorInstance;
};

type CesiumNamespace = {
  Color: CesiumColor;
};

// ---------------------------------------------------------------------------
// applySelectionStyle
// ---------------------------------------------------------------------------

/**
 * Enlarge a sky object entity and add a cyan outline glow to indicate selection.
 * Safe to call on constellation polyline entities — they have no `point` property
 * so the function exits early.
 */
export function applySelectionStyle(
  entity: Entity,
  Cesium: CesiumNamespace,
): void {
  if (entity.point) {
    entity.point.pixelSize = new (Cesium as any).ConstantProperty(SELECTED_PIXEL_SIZE);
    entity.point.outlineColor = new (Cesium as any).ConstantProperty(
      Cesium.Color.fromCssColorString("#64e9ff").withAlpha(SELECTED_OUTLINE_ALPHA),
    );
    entity.point.outlineWidth = new (Cesium as any).ConstantProperty(SELECTED_OUTLINE_WIDTH);
  }
  if (entity.billboard) {
    entity.billboard.scale = new (Cesium as any).ConstantProperty(1.5);
  }
}

// ---------------------------------------------------------------------------
// clearSelectionStyle
// ---------------------------------------------------------------------------

/**
 * Restore a previously highlighted entity to its default appearance.
 * Safe to call on polyline entities.
 */
export function clearSelectionStyle(
  entity: Entity,
  Cesium: CesiumNamespace,
): void {
  if (entity.point) {
    const kind = entity.properties?.kind?.getValue() as SkyObjectKind | undefined;
    const entityDefaultSize = entity.properties?.defaultPixelSize?.getValue() as number | undefined;
    const defaultSize = typeof entityDefaultSize === "number"
      ? entityDefaultSize
      : kind ? (DEFAULT_PIXEL_SIZE[kind] ?? 9) : 9;

    entity.point.pixelSize = new (Cesium as any).ConstantProperty(defaultSize);
    entity.point.outlineColor = new (Cesium as any).ConstantProperty(Cesium.Color.WHITE);
    entity.point.outlineWidth = new (Cesium as any).ConstantProperty(DEFAULT_OUTLINE_WIDTH);
  }
  if (entity.billboard) {
    entity.billboard.scale = new (Cesium as any).ConstantProperty(1.0);
  }
}

// ---------------------------------------------------------------------------
// highlightSelected
// ---------------------------------------------------------------------------

/**
 * Swap the selection highlight from a previous entity to a new one.
 *
 * @param renderer  — the SkyStateRenderer instance (provides getEntity)
 * @param nextId    — id of the newly selected entity (undefined = deselect all)
 * @param prevId    — id of the previously selected entity (optional)
 * @param Cesium    — the Cesium namespace
 */
export function highlightSelected(
  renderer: Pick<SkyStateRenderer, "getEntity">,
  nextId: string | undefined,
  prevId: string | undefined,
  Cesium: CesiumNamespace,
): void {
  // Clear previous selection
  if (prevId && prevId !== nextId) {
    const prev = renderer.getEntity(prevId);
    if (prev) clearSelectionStyle(prev, Cesium);
  }

  // Apply to next selection
  if (nextId) {
    const next = renderer.getEntity(nextId);
    if (next) applySelectionStyle(next, Cesium);
  }
}
