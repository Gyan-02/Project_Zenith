/**
 * GYA-41 — selection-style unit tests
 *
 * We do not load Cesium in jsdom. Instead we build minimal mocks that
 * match the shape that selection-style.ts exercises.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  applySelectionStyle,
  clearSelectionStyle,
  highlightSelected,
} from "../selection-style";
import type { Entity } from "cesium";

// ---------------------------------------------------------------------------
// Minimal Cesium mock
// ---------------------------------------------------------------------------

/** Simulates Cesium.ConstantProperty — just stores the value */
class FakeConstantProperty {
  value: unknown;
  constructor(value: unknown) {
    this.value = value;
  }
}

function fakeColorOf(css: string) {
  return { css, withAlpha: (a: number) => ({ css, alpha: a }) };
}

const FakeCesium = {
  Color: {
    fromCssColorString: fakeColorOf,
    WHITE: { css: "white", withAlpha: (a: number) => ({ css: "white", alpha: a }) },
  },
  ConstantProperty: FakeConstantProperty,
};

// ---------------------------------------------------------------------------
// Entity factory
// ---------------------------------------------------------------------------

function makePointEntity(kind: string, pixelSize = 9): Partial<Entity> {
  return {
    properties: {
      kind: { getValue: () => kind },
    } as unknown as Entity["properties"],
    point: {
      pixelSize: new FakeConstantProperty(pixelSize) as unknown,
      outlineColor: new FakeConstantProperty(FakeCesium.Color.WHITE) as unknown,
      outlineWidth: new FakeConstantProperty(1) as unknown,
    } as unknown as Entity["point"],
  };
}

function makePolylineEntity(): Partial<Entity> {
  return {
    properties: {
      kind: { getValue: () => "constellation" },
    } as unknown as Entity["properties"],
    point: undefined,
  };
}

function makeBillboardEntity(kind: string, scale = 1.0): Partial<Entity> {
  return {
    properties: {
      kind: { getValue: () => kind },
    } as unknown as Entity["properties"],
    point: undefined,
    billboard: {
      scale: new FakeConstantProperty(scale) as unknown,
    } as unknown as Entity["billboard"],
  };
}

// ---------------------------------------------------------------------------
// applySelectionStyle
// ---------------------------------------------------------------------------

describe("applySelectionStyle", () => {
  it("sets pixelSize to 16 (SELECTED_PIXEL_SIZE) for point entities", () => {
    const entity = makePointEntity("planet") as Entity;
    applySelectionStyle(entity, FakeCesium as any);
    const prop = entity.point!.pixelSize as unknown as FakeConstantProperty;
    expect(prop.value).toBe(16);
  });

  it("sets outlineWidth to 3 for point entities", () => {
    const entity = makePointEntity("planet") as Entity;
    applySelectionStyle(entity, FakeCesium as any);
    const prop = entity.point!.outlineWidth as unknown as FakeConstantProperty;
    expect(prop.value).toBe(3);
  });

  it("sets outlineColor to cyan (#64e9ff) with alpha 0.9 for point entities", () => {
    const entity = makePointEntity("satellite") as Entity;
    applySelectionStyle(entity, FakeCesium as any);
    const prop = entity.point!.outlineColor as unknown as FakeConstantProperty;
    const color = prop.value as { css: string; alpha: number };
    expect(color.css).toBe("#64e9ff");
    expect(color.alpha).toBe(0.9);
  });

  it("sets scale to 1.5 for billboard entities", () => {
    const entity = makeBillboardEntity("planet", 1.0) as Entity;
    applySelectionStyle(entity, FakeCesium as any);
    const scaleProp = entity.billboard!.scale as unknown as FakeConstantProperty;
    expect(scaleProp.value).toBe(1.5);
  });

  it("is a no-op for polyline (constellation) entities", () => {
    const entity = makePolylineEntity() as Entity;
    // Should not throw and should not set point properties
    expect(() => applySelectionStyle(entity, FakeCesium as any)).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// clearSelectionStyle
// ---------------------------------------------------------------------------

describe("clearSelectionStyle", () => {
  it("restores pixelSize to 11 for planet point", () => {
    const entity = makePointEntity("planet", 16) as Entity;
    clearSelectionStyle(entity, FakeCesium as any);
    const prop = entity.point!.pixelSize as unknown as FakeConstantProperty;
    expect(prop.value).toBe(11);
  });

  it("restores pixelSize to 15 for ISS point", () => {
    const entity = makePointEntity("iss", 16) as Entity;
    clearSelectionStyle(entity, FakeCesium as any);
    const prop = entity.point!.pixelSize as unknown as FakeConstantProperty;
    expect(prop.value).toBe(15);
  });

  it("restores outlineWidth to 1 for point", () => {
    const entity = makePointEntity("satellite", 16) as Entity;
    clearSelectionStyle(entity, FakeCesium as any);
    const prop = entity.point!.outlineWidth as unknown as FakeConstantProperty;
    expect(prop.value).toBe(1);
  });

  it("restores outlineColor to WHITE for point", () => {
    const entity = makePointEntity("moon", 16) as Entity;
    clearSelectionStyle(entity, FakeCesium as any);
    const prop = entity.point!.outlineColor as unknown as FakeConstantProperty;
    const color = prop.value as { css: string };
    expect(color.css).toBe("white");
  });

  it("restores scale to 1.0 for billboard", () => {
    const entity = makeBillboardEntity("planet", 1.5) as Entity;
    clearSelectionStyle(entity, FakeCesium as any);
    const scaleProp = entity.billboard!.scale as unknown as FakeConstantProperty;
    expect(scaleProp.value).toBe(1.0);
  });

  it("is a no-op for polyline entities", () => {
    const entity = makePolylineEntity() as Entity;
    expect(() => clearSelectionStyle(entity, FakeCesium as any)).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// highlightSelected
// ---------------------------------------------------------------------------

describe("highlightSelected", () => {
  let entities: Map<string, Partial<Entity>>;
  let renderer: { getEntity: (id: string) => Entity | undefined };

  beforeEach(() => {
    entities = new Map([
      ["saturn", makePointEntity("planet") as Entity],
      ["jupiter", makePointEntity("planet") as Entity],
    ]);
    renderer = { getEntity: (id: string) => entities.get(id) as Entity | undefined };
  });

  it("applies style to the next entity", () => {
    highlightSelected(renderer, "saturn", undefined, FakeCesium as any);
    const prop = (entities.get("saturn")!.point!.pixelSize as unknown) as FakeConstantProperty;
    expect(prop.value).toBe(16);
  });

  it("clears style from the previous entity when swapping", () => {
    // First select saturn
    highlightSelected(renderer, "saturn", undefined, FakeCesium as any);
    // Then swap to jupiter
    highlightSelected(renderer, "jupiter", "saturn", FakeCesium as any);

    const saturnProp = (entities.get("saturn")!.point!.pixelSize as unknown) as FakeConstantProperty;
    const jupiterProp = (entities.get("jupiter")!.point!.pixelSize as unknown) as FakeConstantProperty;
    expect(saturnProp.value).toBe(11); // cleared
    expect(jupiterProp.value).toBe(16); // applied
  });

  it("does not clear when nextId === prevId (same selection)", () => {
    highlightSelected(renderer, "saturn", undefined, FakeCesium as any);
    highlightSelected(renderer, "saturn", "saturn", FakeCesium as any);
    // Should still be applied
    const prop = (entities.get("saturn")!.point!.pixelSize as unknown) as FakeConstantProperty;
    expect(prop.value).toBe(16);
  });

  it("clears previous without applying when nextId is undefined (deselect)", () => {
    highlightSelected(renderer, "saturn", undefined, FakeCesium as any);
    highlightSelected(renderer, undefined, "saturn", FakeCesium as any);
    const prop = (entities.get("saturn")!.point!.pixelSize as unknown) as FakeConstantProperty;
    expect(prop.value).toBe(11); // cleared
  });

  it("does not throw when entity ids are not found", () => {
    expect(() =>
      highlightSelected(renderer, "unknown-id", "also-unknown", FakeCesium as any)
    ).not.toThrow();
  });
});
