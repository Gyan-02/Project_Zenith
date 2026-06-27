"use client";

import { OBSERVER_LOCATIONS, type ObserverLocationPreset } from "../../lib/locations";
import { SKY_LAYER_LABELS, type LayerVisibility } from "../../lib/skyLayers";
import { fromDateTimeLocalValue, shiftIsoTime, toDateTimeLocalValue } from "../../lib/timeMachine";
import { DataProvenanceLegend } from "../provenance/DataProvenanceLegend";

interface ObserverControlsProps {
  location: ObserverLocationPreset;
  timeIso: string;
  layers: LayerVisibility;
  shareStatus?: string;
  onLocationChange(location: ObserverLocationPreset): void;
  onTimeChange(timeIso: string): void;
  onLayerChange(layers: LayerVisibility): void;
  onCopyShareLink(): void;
}

export function ObserverControls({
  location,
  timeIso,
  layers,
  shareStatus,
  onLocationChange,
  onTimeChange,
  onLayerChange,
  onCopyShareLink,
}: ObserverControlsProps) {
  const locationOptions = OBSERVER_LOCATIONS.some((preset) => preset.id === location.id)
    ? OBSERVER_LOCATIONS
    : [location, ...OBSERVER_LOCATIONS];

  return (
    <section className="control-panel" aria-label="Sky controls">
      <div>
        <p className="eyebrow">Observer</p>
        <label className="field-label" htmlFor="observer-location">Location</label>
        <select
          id="observer-location"
          value={location.id}
          onChange={(event) => {
            const nextLocation = locationOptions.find((preset) => preset.id === event.target.value);
            if (nextLocation) onLocationChange(nextLocation);
          }}
        >
          {locationOptions.map((preset) => (
            <option key={preset.id} value={preset.id}>{preset.label}</option>
          ))}
        </select>
        <span className="location-readout">
          {location.lat.toFixed(2)}° {location.lat >= 0 ? "N" : "S"} · {Math.abs(location.lon).toFixed(2)}°{" "}
          {location.lon >= 0 ? "E" : "W"}
        </span>
      </div>

      <div>
        <label className="field-label" htmlFor="sky-time">Time machine</label>
        <input
          id="sky-time"
          type="datetime-local"
          value={toDateTimeLocalValue(timeIso)}
          onChange={(event) => onTimeChange(fromDateTimeLocalValue(event.target.value))}
        />
        <div className="time-actions" aria-label="Quick time controls">
          <button type="button" onClick={() => onTimeChange(shiftIsoTime(timeIso, -1))}>−1h</button>
          <button type="button" onClick={() => onTimeChange(new Date().toISOString())}>Now</button>
          <button type="button" onClick={() => onTimeChange(shiftIsoTime(timeIso, 1))}>+1h</button>
        </div>
      </div>

      <div>
        <p className="eyebrow">Layers</p>
        <div className="layer-list" role="group" aria-label="Sky layer visibility">
          {SKY_LAYER_LABELS.map(({ kind, label }) => (
            <label key={kind} className="layer-toggle">
              <input
                type="checkbox"
                aria-label={`Toggle ${label} layer`}
                checked={layers[kind]}
                onChange={(event) => onLayerChange({ ...layers, [kind]: event.target.checked })}
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </div>

      <DataProvenanceLegend />

      <div>
        <button
          className="share-button"
          type="button"
          aria-label="Copy shareable sky link to clipboard"
          onClick={onCopyShareLink}
        >
          Copy sky link
        </button>
        {shareStatus ? <span className="share-status" role="status">{shareStatus}</span> : null}
      </div>
    </section>
  );
}
