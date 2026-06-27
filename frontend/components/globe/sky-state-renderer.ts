import type { Entity, Viewer as CesiumViewer } from "cesium";
import { getSkyObjects, type SkyObject, type SkyObjectKind, type SkyState } from "../../lib/skyState";
import { altAzToEnu, raDecToAltAz, type AltAz } from "./celestial-projection";
import { buildConstellationSegments } from "./constellation-lines";

type CesiumNamespace = typeof import("cesium");
type PickHandler = (picked: { id: string; kind: SkyObjectKind }) => void;

const COLORS: Record<SkyObjectKind, string> = {
  planet: "#f1d2aa",
  satellite: "#64e9ff",
  iss: "#ffffff",
  moon: "#dfe8ff",
  star: "#fff6d8",
  constellation: "#9e7bff",
  meteor_shower: "#ff9e66",
};

const BASE_POINT_SIZE: Record<SkyObjectKind, number> = {
  planet: 11,
  satellite: 7,
  iss: 15,
  moon: 12,
  star: 6,
  constellation: 6,
  meteor_shower: 10,
};

const PLANET_COLORS: Record<string, string> = {
  mercury: "#c9b8a2",
  venus: "#ffe0a8",
  mars: "#ff8d66",
  jupiter: "#f4c28d",
  saturn: "#f2d49b",
  uranus: "#9ee7ff",
  neptune: "#7fa7ff",
};

function metadataNumber(object: SkyObject, key: string): number | undefined {
  const value = object.metadata?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function metadataString(object: SkyObject, key: string): string | undefined {
  const value = object.metadata?.[key];
  return typeof value === "string" && value.trim() ? value : undefined;
}

function sampledPath(object: SkyObject): AltAz[] | undefined {
  const value = object.metadata?.pathSamples;
  if (!Array.isArray(value)) return undefined;

  const samples = value.flatMap((sample): AltAz[] => {
    if (!sample || typeof sample !== "object") return [];
    const altDeg = (sample as Record<string, unknown>).altDeg;
    const azDeg = (sample as Record<string, unknown>).azDeg;
    if (typeof altDeg !== "number" || typeof azDeg !== "number") return [];
    if (!Number.isFinite(altDeg) || !Number.isFinite(azDeg)) return [];
    return [{ altDeg, azDeg }];
  });

  return samples.length >= 2 ? samples : undefined;
}

function darkenColor(hex: string, percent: number): string {
  const cleanHex = hex.replace("#", "");
  const num = parseInt(cleanHex, 16);
  const amt = Math.round(2.55 * (percent * 100));
  const R = (num >> 16) - amt;
  const G = (num >> 8 & 0x00FF) - amt;
  const B = (num & 0x0000FF) - amt;
  const rClamp = Math.min(255, Math.max(0, R));
  const gClamp = Math.min(255, Math.max(0, G));
  const bClamp = Math.min(255, Math.max(0, B));
  return "#" + (0x1000000 + rClamp * 0x10000 + gClamp * 0x100 + bClamp).toString(16).slice(1);
}

function createPlanetCanvas(id: string, colorHex: string): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = 48;
  canvas.height = 48;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  const cx = 24;
  const cy = 24;
  const r = id === "moon" ? 10 : id === "jupiter" ? 12 : id === "saturn" ? 9 : 8;

  ctx.clearRect(0, 0, 48, 48);

  if (id === "saturn") {
    // Draw rings (behind the planet)
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-Math.PI / 8);
    ctx.scale(2.2, 0.4);
    const ringGrad = ctx.createRadialGradient(0, 0, r * 1.1, 0, 0, r * 2.2);
    ringGrad.addColorStop(0, "rgba(240, 210, 160, 0)");
    ringGrad.addColorStop(0.1, "rgba(240, 210, 160, 0.7)");
    ringGrad.addColorStop(0.5, "rgba(220, 190, 140, 0.8)");
    ringGrad.addColorStop(0.9, "rgba(200, 170, 120, 0.7)");
    ringGrad.addColorStop(1, "rgba(200, 170, 120, 0)");
    ctx.fillStyle = ringGrad;
    ctx.beginPath();
    ctx.arc(0, 0, r * 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Draw 3D radial gradient sphere
  const grad = ctx.createRadialGradient(cx - r / 3, cy - r / 3, r / 10, cx, cy, r);
  grad.addColorStop(0, "#ffffff");
  grad.addColorStop(0.3, colorHex);
  grad.addColorStop(1, darkenColor(colorHex, 0.5));
  ctx.fillStyle = grad;

  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  // Add detail bands / textures
  if (id === "jupiter") {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = "rgba(139, 69, 19, 0.22)";
    ctx.fillRect(cx - r, cy - r / 3, r * 2, r / 5);
    ctx.fillRect(cx - r, cy + r / 4, r * 2, r / 6);
    ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
    ctx.fillRect(cx - r, cy - r / 1.5, r * 2, r / 6);
    ctx.restore();
  } else if (id === "mars") {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(cx, cy - r, r / 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else if (id === "moon") {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();
    ctx.strokeStyle = "rgba(0, 0, 0, 0.12)";
    ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
    ctx.lineWidth = 1;
    const craters = [
      { x: cx - r / 3, y: cy - r / 3, cr: r / 5 },
      { x: cx + r / 4, y: cy + r / 5, cr: r / 4 },
      { x: cx - r / 5, y: cy + r / 3, cr: r / 6 }
    ];
    for (const c of craters) {
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.cr, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fill();
    }
    ctx.restore();
  }

  // Draw thin atmospheric glow/stroke
  ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();

  return canvas;
}

const planetCanvasCache = new Map<string, HTMLCanvasElement>();

function getPlanetCanvas(id: string, colorHex: string): HTMLCanvasElement {
  const cacheKey = `${id}:${colorHex}`;
  let canvas = planetCanvasCache.get(cacheKey);
  if (!canvas) {
    canvas = createPlanetCanvas(id, colorHex);
    planetCanvasCache.set(cacheKey, canvas);
  }
  return canvas;
}

function colorFor(object: SkyObject): string {
  if (object.kind === "planet") return PLANET_COLORS[object.id] ?? COLORS.planet;

  if (object.kind === "star") {
    const spectralType = metadataString(object, "spectralType")?.toUpperCase();
    if (spectralType?.startsWith("O") || spectralType?.startsWith("B")) return "#b9d9ff";
    if (spectralType?.startsWith("A")) return "#e3ecff";
    if (spectralType?.startsWith("F")) return "#fff4d2";
    if (spectralType?.startsWith("G")) return "#ffe5a3";
    if (spectralType?.startsWith("K")) return "#ffc078";
    if (spectralType?.startsWith("M")) return "#ff9a72";
  }

  return COLORS[object.kind];
}

function pointSizeFor(object: SkyObject): number {
  if (object.kind !== "star") return BASE_POINT_SIZE[object.kind];

  const magnitude = metadataNumber(object, "magnitudeV");
  if (magnitude === undefined) return BASE_POINT_SIZE.star;
  if (magnitude <= 0) return 9;
  if (magnitude <= 1) return 8;
  if (magnitude <= 2) return 7;
  return BASE_POINT_SIZE.star;
}

function shouldShowLabel(object: SkyObject): boolean {
  if (object.kind === "planet" || object.kind === "moon" || object.kind === "iss") return true;
  if (object.kind === "star") return (metadataNumber(object, "magnitudeV") ?? 99) <= 0.5;
  return false;
}

function normalizeDegrees(value: number): number {
  return ((value % 360) + 360) % 360;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function isPathObject(object: SkyObject): boolean {
  return object.kind === "iss" || object.kind === "satellite";
}

export class SkyStateRenderer {
  private readonly entitiesById = new Map<string, Entity>();
  private readonly visibility = new Map<SkyObjectKind, boolean>();
  private readonly handlers = new Set<PickHandler>();
  private removeSelectionListener?: () => void;

  constructor(
    private readonly viewer: CesiumViewer,
    private readonly Cesium: CesiumNamespace,
    private readonly sphereRadiusM = 18_000_000,
  ) {
    this.removeSelectionListener = viewer.selectedEntityChanged.addEventListener((entity) => {
      const kind = entity?.properties?.kind?.getValue() as SkyObjectKind | undefined;
      const pathFor = entity?.properties?.pathFor?.getValue() as string | undefined;
      if (!entity || !kind) return;
      for (const handler of this.handlers) handler({ id: pathFor ?? entity.id, kind });
    });
  }

  updateSkyState(state: SkyState): void {
    const nextIds = new Set<string>();
    const at = new Date(state.timestampUtc);

    for (const object of getSkyObjects(state)) {
      nextIds.add(object.id);
      const altAz = object.position.altDeg !== undefined && object.position.azDeg !== undefined
        ? { altDeg: object.position.altDeg, azDeg: object.position.azDeg }
        : raDecToAltAz(object.position.ra, object.position.dec, state.location, at);
      this.upsertPointEntity(object, state, altAz);
      this.upsertPathHint(object, state, altAz, nextIds);
    }

    for (const segment of buildConstellationSegments(state, at)) {
      nextIds.add(segment.id);
      const startPosition = this.project(state.location, segment.start.altDeg, segment.start.azDeg);
      const endPosition = this.project(state.location, segment.end.altDeg, segment.end.azDeg);
      let entity = this.entitiesById.get(segment.id);

      if (!entity) {
        entity = this.viewer.entities.add({
          id: segment.id,
          name: segment.name,
          properties: { kind: "constellation" },
          polyline: {
            positions: [startPosition, endPosition],
            width: 1.2,
            material: this.Cesium.Color.fromCssColorString(COLORS.constellation).withAlpha(0.52),
          },
          show: this.visibility.get("constellation") ?? true,
        });
        this.entitiesById.set(segment.id, entity);
      } else {
        entity.name = segment.name;
        if (entity.polyline) {
          entity.polyline.positions = new this.Cesium.ConstantProperty([startPosition, endPosition]);
        }
        entity.show = this.visibility.get("constellation") ?? true;
      }
    }

    for (const [id, entity] of this.entitiesById) {
      if (nextIds.has(id)) continue;
      this.viewer.entities.remove(entity);
      this.entitiesById.delete(id);
    }
  }

  setLayerVisible(kind: SkyObjectKind, visible: boolean): void {
    this.visibility.set(kind, visible);
    for (const entity of this.entitiesById.values()) {
      if (entity.properties?.kind?.getValue() === kind) entity.show = visible;
    }
  }

  onEntityPick(handler: PickHandler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  getEntity(id: string): Entity | undefined {
    return this.entitiesById.get(id);
  }

  destroy(): void {
    this.removeSelectionListener?.();
    this.handlers.clear();
    this.entitiesById.clear();
  }

  private upsertPointEntity(object: SkyObject, state: SkyState, altAz: AltAz): void {
    const position = this.project(state.location, altAz.altDeg, altAz.azDeg);
    const pixelSize = pointSizeFor(object);
    const color = this.Cesium.Color.fromCssColorString(colorFor(object));
    const outlineColor = object.kind === "iss"
      ? this.Cesium.Color.fromCssColorString("#64e9ff")
      : this.Cesium.Color.WHITE;
    const outlineWidth = object.kind === "star" ? 0.6 : object.kind === "iss" ? 2 : 1;
    const labelVisible = shouldShowLabel(object);
    let entity = this.entitiesById.get(object.id);

    const isBillboard = object.kind === "planet" || object.kind === "moon";

    if (!entity) {
      const entityOptions: any = {
        id: object.id,
        name: object.name,
        position,
        properties: { kind: object.kind, defaultPixelSize: pixelSize },
        label: {
          text: object.name,
          fillColor: this.Cesium.Color.WHITE,
          outlineColor: this.Cesium.Color.BLACK,
          outlineWidth: 2,
          pixelOffset: new this.Cesium.Cartesian2(0, -22),
          show: labelVisible,
        },
        show: this.visibility.get(object.kind) ?? true,
      };

      if (isBillboard) {
        entityOptions.billboard = {
          image: getPlanetCanvas(object.id, colorFor(object)),
          horizontalOrigin: this.Cesium.HorizontalOrigin.CENTER,
          verticalOrigin: this.Cesium.VerticalOrigin.CENTER,
          scale: 1.0,
        };
      } else {
        entityOptions.point = {
          pixelSize,
          color,
          outlineColor,
          outlineWidth,
        };
      }

      entity = this.viewer.entities.add(entityOptions);
      this.entitiesById.set(object.id, entity);
      return;
    }

    entity.name = object.name;
    entity.position = new this.Cesium.ConstantPositionProperty(position);
    entity.show = this.visibility.get(object.kind) ?? true;

    if (isBillboard) {
      if (entity.billboard) {
        entity.billboard.image = new this.Cesium.ConstantProperty(getPlanetCanvas(object.id, colorFor(object)));
      }
    } else {
      if (entity.point) {
        entity.point.pixelSize = new this.Cesium.ConstantProperty(pixelSize);
        entity.point.color = new this.Cesium.ConstantProperty(color);
        entity.point.outlineColor = new this.Cesium.ConstantProperty(outlineColor);
        entity.point.outlineWidth = new this.Cesium.ConstantProperty(outlineWidth);
      }
    }

    if (entity.label) {
      entity.label.text = new this.Cesium.ConstantProperty(object.name);
      entity.label.show = new this.Cesium.ConstantProperty(labelVisible);
    }
  }

  private upsertPathHint(object: SkyObject, state: SkyState, altAz: AltAz, nextIds: Set<string>): void {
    if (!isPathObject(object)) return;

    const id = `path:${object.id}`;
    nextIds.add(id);
    const samples = sampledPath(object);
    const positions = (samples ?? this.buildPathHintSamples(altAz, object.kind)).map((sample) =>
      this.project(state.location, sample.altDeg, sample.azDeg)
    );
    const pathMode = metadataString(object, "pathMode");
    const hasSampledPath = Boolean(samples);
    const isTleSampledPath = pathMode === "tle-sampled" && hasSampledPath;
    const color = this.Cesium.Color.fromCssColorString(COLORS[object.kind]).withAlpha(
      hasSampledPath ? object.kind === "iss" ? 0.72 : 0.48 : object.kind === "iss" ? 0.52 : 0.3,
    );
    const pathLabel = isTleSampledPath ? "TLE sampled path" : hasSampledPath ? "sampled path" : "path hint";
    let entity = this.entitiesById.get(id);

    if (!entity) {
      entity = this.viewer.entities.add({
        id,
        name: `${object.name} ${pathLabel}`,
        properties: { kind: object.kind, pathFor: object.id, pathMode: hasSampledPath ? pathMode ?? "sampled" : "hint" },
        polyline: {
          positions,
          width: hasSampledPath ? object.kind === "iss" ? 3 : 1.6 : object.kind === "iss" ? 2.2 : 1.1,
          material: color,
        },
        show: this.visibility.get(object.kind) ?? true,
      });
      this.entitiesById.set(id, entity);
      return;
    }

    entity.name = `${object.name} ${pathLabel}`;
    entity.show = this.visibility.get(object.kind) ?? true;
    if (entity.polyline) {
      entity.polyline.positions = new this.Cesium.ConstantProperty(positions);
      entity.polyline.material = new this.Cesium.ColorMaterialProperty(color);
      entity.polyline.width = new this.Cesium.ConstantProperty(
        hasSampledPath ? object.kind === "iss" ? 3 : 1.6 : object.kind === "iss" ? 2.2 : 1.1,
      );
    }
  }

  private buildPathHintSamples(altAz: AltAz, kind: SkyObjectKind): AltAz[] {
    const halfSpan = kind === "iss" ? 18 : 10;
    const altitudeBend = kind === "iss" ? 5 : 2.5;
    const samples = [-1, -0.5, 0, 0.5, 1];

    return samples.map((sample) => {
      const altDeg = clamp(altAz.altDeg - Math.abs(sample) * altitudeBend, -5, 89);
      const azDeg = normalizeDegrees(altAz.azDeg + sample * halfSpan);
      return { altDeg, azDeg };
    });
  }

  private project(location: SkyState["location"], altDeg: number, azDeg: number) {
    const origin = this.Cesium.Cartesian3.fromDegrees(location.lon, location.lat, location.elevationM ?? 0);
    const direction = altAzToEnu(altDeg, azDeg);
    const local = new this.Cesium.Cartesian3(
      direction.east * this.sphereRadiusM,
      direction.north * this.sphereRadiusM,
      direction.up * this.sphereRadiusM,
    );
    const transform = this.Cesium.Transforms.eastNorthUpToFixedFrame(origin);
    const fixedDirection = this.Cesium.Matrix4.multiplyByPointAsVector(
      transform,
      local,
      new this.Cesium.Cartesian3(),
    );
    return this.Cesium.Cartesian3.add(origin, fixedDirection, new this.Cesium.Cartesian3());
  }
}
