import rawConditionsFixture from "../../data/demo/conditions-patna.json";
import rawPassesFixture from "../../data/demo/passes-patna.json";
import rawSkyStateFixture from "../../data/demo/sky-state-patna.json";
import type { ObservingConditionsResponse } from "./conditions";
import type { PassesParams, PassesResponse } from "./passes";
import { SkyStateSchema, type SkyState } from "./skyState";

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function getDemoSkyStateFallback(
  location: SkyState["location"],
  timestampUtc: string,
): SkyState {
  const fixture = SkyStateSchema.parse(clone(rawSkyStateFixture));
  const fetchedAt = new Date().toISOString();

  return {
    ...fixture,
    location: {
      ...fixture.location,
      lat: location.lat,
      lon: location.lon,
      elevationM: location.elevationM ?? fixture.location.elevationM,
      label: location.label ?? fixture.location.label,
    },
    timestampUtc,
    provenance: [
      ...fixture.provenance,
      { source: "frontend bundled demo fallback", fetchedAt },
    ],
  };
}

export function getDemoConditionsFallback(
  location: { lat: number; lon: number },
  observedAt?: string,
): ObservingConditionsResponse {
  const fixture = clone(rawConditionsFixture) as ObservingConditionsResponse;

  return {
    ...fixture,
    location: { lat: location.lat, lon: location.lon },
    observedAt: observedAt ?? new Date().toISOString(),
    cached: true,
    demo: true,
  };
}

function shiftIso(iso: string, deltaMs: number): string {
  return new Date(Date.parse(iso) + deltaMs).toISOString();
}

export function getDemoPassesFallback(params: PassesParams): PassesResponse {
  const fixture = clone(rawPassesFixture) as PassesResponse;
  const deltaMs = Date.parse(params.startUtc) - Date.parse(fixture.startUtc);
  const fetchedAt = new Date().toISOString();

  return {
    ...fixture,
    location: {
      lat: params.lat,
      lon: params.lon,
      ...(params.elevationM !== undefined ? { elevationM: params.elevationM } : {}),
    },
    startUtc: params.startUtc,
    endUtc: params.endUtc,
    passes: fixture.passes.map((pass) => ({
      ...pass,
      riseTimeUtc: shiftIso(pass.riseTimeUtc, deltaMs),
      peakTimeUtc: shiftIso(pass.peakTimeUtc, deltaMs),
      setTimeUtc: shiftIso(pass.setTimeUtc, deltaMs),
      source: pass.source ?? "frontend bundled demo fallback",
    })),
    provenance: [
      ...fixture.provenance,
      { source: "frontend bundled demo pass fallback", fetchedAt },
    ],
    demo: true,
  };
}
