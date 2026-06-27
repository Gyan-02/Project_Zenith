import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type {
  CulturalNamesDataset,
  CulturalObjectEntry,
  TraditionEntry,
  TraditionsRegistry,
  TraditionSlug,
} from "./types.js";

const datasetPath = fileURLToPath(new URL("../../../data/cultural-names/dataset.json", import.meta.url));
const traditionsPath = fileURLToPath(new URL("../../../data/cultural-names/traditions.json", import.meta.url));

const dataset = JSON.parse(readFileSync(datasetPath, "utf8")) as CulturalNamesDataset;
const traditions = JSON.parse(readFileSync(traditionsPath, "utf8")) as TraditionsRegistry;

export function getDataset(): CulturalNamesDataset {
  return dataset;
}

export function getTraditions(): TraditionsRegistry {
  return traditions;
}

export function getNamesForObject(objectId: string): CulturalObjectEntry | undefined {
  return dataset[objectId.toLowerCase()];
}

export function getNameInTradition(
  objectId: string,
  tradition: TraditionSlug,
): TraditionEntry | undefined {
  return getNamesForObject(objectId)?.names[tradition];
}
