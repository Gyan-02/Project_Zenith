import type { SkyObjectKind } from "./skyState";

export type LayerVisibility = Record<SkyObjectKind, boolean>;

export const DEFAULT_LAYER_VISIBILITY: LayerVisibility = {
  planet: true,
  satellite: true,
  iss: true,
  moon: true,
  star: true,
  constellation: true,
  meteor_shower: true,
};

export const SKY_LAYER_LABELS: Array<{ kind: SkyObjectKind; label: string }> = [
  { kind: "planet", label: "Planets" },
  { kind: "moon", label: "Moon" },
  { kind: "iss", label: "ISS" },
  { kind: "satellite", label: "Satellites" },
  { kind: "star", label: "Stars" },
  { kind: "constellation", label: "Constellations" },
  { kind: "meteor_shower", label: "Meteor showers" },
];
