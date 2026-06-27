"use client";

import { CulturalNamesCard } from "../cultural-names/CulturalNamesCard";
import { EducationalReferenceCard } from "../educational-reference/EducationalReferenceCard";
import { getSkyObjects, type SkyObject, type SkyState } from "../../lib/skyState";
import { raDecToAltAz } from "./celestial-projection";

interface ObjectDetailsPanelProps {
  skyState: SkyState | null;
  selectedObjectId?: string;
  onClear(): void;
}

function findSelectedObject(skyState: SkyState | null, selectedObjectId?: string): SkyObject | undefined {
  if (!skyState || !selectedObjectId) return undefined;
  return getSkyObjects(skyState).find((object) => object.id === selectedObjectId);
}

function formatDistance(distanceKm?: number): string | undefined {
  if (distanceKm === undefined) return undefined;

  const lightYearKm = 9_460_730_472_580.8;
  if (distanceKm >= lightYearKm * 0.1) {
    const lightYears = distanceKm / lightYearKm;
    const precision = lightYears >= 100 ? 0 : lightYears >= 10 ? 1 : 2;
    return `${lightYears.toFixed(precision)} ly`;
  }

  if (distanceKm >= 1_000_000) return `${(distanceKm / 1_000_000).toFixed(2)} million km`;
  return `${Math.round(distanceKm).toLocaleString()} km`;
}

function metadataValue(object: SkyObject, key: string): unknown {
  return object.metadata?.[key];
}

function metadataString(object: SkyObject, key: string): string | undefined {
  const value = metadataValue(object, key);
  return typeof value === "string" && value.trim() ? value : undefined;
}

function metadataNumber(object: SkyObject, key: string): number | undefined {
  const value = metadataValue(object, key);
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function metadataFlag(object: SkyObject, key: string): boolean {
  const value = metadataValue(object, key);
  return value === true || value === "true";
}

function getProvenance(object: SkyObject): { label: string; variant: string; source: string; note?: string } {
  const source = metadataString(object, "source") ?? "Unknown sky-state source";
  const sourceLower = source.toLowerCase();
  const mode = metadataString(object, "dataMode");
  const isStale = metadataFlag(object, "staleEphemeris") || metadataFlag(object, "staleTle") || mode === "stale-cache";
  const isFallback = metadataFlag(object, "fallback") || mode === "provider-fallback";

  if (mode === "demo-fixture" || sourceLower.includes("demo fixture")) {
    return { label: "Demo fixture", variant: "demo", source };
  }

  if (mode === "static-catalog") {
    return { label: "Static catalog", variant: "static", source };
  }

  if (isStale) {
    return { label: "Stale cache", variant: "stale", source, note: "Using the latest cached provider data." };
  }

  if (isFallback) {
    return { label: "Provider fallback", variant: "fallback", source, note: "Live source fell back to a secondary provider." };
  }

  if (mode === "live-provider" || source !== "Unknown sky-state source") {
    return { label: "Live provider", variant: "live", source };
  }

  return { label: "Unknown source", variant: "unknown", source };
}

export function ObjectDetailsPanel({ skyState, selectedObjectId, onClear }: ObjectDetailsPanelProps) {
  const object = findSelectedObject(skyState, selectedObjectId);
  if (!object) return null;

  const derivedAltAz = object.position.altDeg !== undefined && object.position.azDeg !== undefined
    ? { altDeg: object.position.altDeg, azDeg: object.position.azDeg }
    : skyState
      ? raDecToAltAz(object.position.ra, object.position.dec, skyState.location, new Date(skyState.timestampUtc))
      : undefined;
  const distance = formatDistance(object.position.distanceKm);
  const altitude = derivedAltAz ? `${derivedAltAz.altDeg.toFixed(1)}°` : undefined;
  const azimuth = derivedAltAz ? `${derivedAltAz.azDeg.toFixed(1)}°` : undefined;
  const provenance = getProvenance(object);
  const magnitude = metadataNumber(object, "magnitudeV");
  const spectralType = metadataString(object, "spectralType");
  const constellation = metadataString(object, "constellation");
  const pathMode = metadataString(object, "pathMode");
  const pathSource = metadataString(object, "pathSource");
  const trackLabel = pathMode === "tle-sampled"
    ? "TLE sampled path"
    : pathMode === "fixture-sampled"
      ? "Demo sampled path"
    : object.kind === "iss" || object.kind === "satellite"
      ? "Visual path hint"
      : undefined;

  return (
    <aside className="object-card" aria-label={`${object.name} details`}>
      <button className="object-card-close" type="button" onClick={onClear} aria-label="Clear selected object">×</button>
      <p className="eyebrow">{object.kind.replace("_", " ")}</p>
      <h2>{object.name}</h2>

      <div className="object-provenance" aria-label="Object data provenance">
        <span className={`provenance-pill provenance-pill-${provenance.variant}`}>{provenance.label}</span>
        <p>{provenance.source}</p>
        {provenance.note ? <small>{provenance.note}</small> : null}
      </div>

      <dl>
        <div>
          <dt>Right ascension</dt>
          <dd>{object.position.ra.toFixed(2)}°</dd>
        </div>
        <div>
          <dt>Declination</dt>
          <dd>{object.position.dec.toFixed(2)}°</dd>
        </div>
        {altitude ? (
          <div>
            <dt>Altitude</dt>
            <dd>{altitude}</dd>
          </div>
        ) : null}
        {azimuth ? (
          <div>
            <dt>Azimuth</dt>
            <dd>{azimuth}</dd>
          </div>
        ) : null}
        {distance ? (
          <div>
            <dt>Distance</dt>
            <dd>{distance}</dd>
          </div>
        ) : null}
        {magnitude !== undefined ? (
          <div>
            <dt>Magnitude</dt>
            <dd>{magnitude.toFixed(2)}</dd>
          </div>
        ) : null}
        {spectralType ? (
          <div>
            <dt>Spectral type</dt>
            <dd>{spectralType}</dd>
          </div>
        ) : null}
        {constellation ? (
          <div>
            <dt>Constellation</dt>
            <dd>{constellation}</dd>
          </div>
        ) : null}
        {trackLabel ? (
          <div>
            <dt>Track</dt>
            <dd title={pathSource}>{trackLabel}</dd>
          </div>
        ) : null}
      </dl>

      <div className="object-card-section">
        <EducationalReferenceCard objectId={object.id} />
      </div>
      <div className="object-card-section">
        <CulturalNamesCard objectId={object.id} selectedTraditionId="vedic" />
      </div>
    </aside>
  );
}
