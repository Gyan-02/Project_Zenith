export type TraditionSlug = string;
export type ObjectCategory = "planet" | "moon" | "star" | "constellation" | "asterism";

export interface TraditionEntry {
  name: string;
  transliteration?: string;
  meaning?: string;
}

export interface CulturalObjectEntry {
  scientific: string;
  category: ObjectCategory;
  names: Record<TraditionSlug, TraditionEntry>;
}

export type CulturalNamesDataset = Record<string, CulturalObjectEntry>;

export interface TraditionMetadata {
  label: string;
  nativeLabel?: string;
  defaultForCountryCodes: string[];
}

export type TraditionsRegistry = Record<TraditionSlug, TraditionMetadata>;
