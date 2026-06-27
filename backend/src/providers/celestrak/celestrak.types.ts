import type { SkyObject } from "../../contracts.js";

export interface ObserverLocation {
  lat: number;
  lon: number;
  elevationM?: number;
}

export interface TleRecord {
  id: string;
  catalogNumber: string;
  name: string;
  line1: string;
  line2: string;
}

export interface CatalogResult {
  records: TleRecord[];
  stale: boolean;
  fetchedAt: string;
}

export interface SatelliteQueryOptions {
  limit?: number;
}

export interface SatelliteResult {
  objects: SkyObject[];
  stale: boolean;
  fetchedAt: string;
}
