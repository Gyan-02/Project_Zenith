"use client";

import { DemoModeToggle } from "../demo/DemoModeToggle";
import { ObjectSearchPanel } from "../search/ObjectSearchPanel";
import { OBSERVER_LOCATIONS, type ObserverLocationPreset } from "../../lib/locations";
import type { SkyState } from "../../lib/skyState";
import { fromDateTimeLocalValue, toDateTimeLocalValue } from "../../lib/timeMachine";

interface TopCommandBarProps {
  location: ObserverLocationPreset;
  timeIso: string;
  skyState: SkyState | null;
  shareStatus?: string;
  onLocationChange(location: ObserverLocationPreset): void;
  onTimeChange(timeIso: string): void;
  onSelectObject(id: string): void;
  onCopyShareLink(): void;
}

export function TopCommandBar({
  location,
  timeIso,
  skyState,
  shareStatus,
  onLocationChange,
  onTimeChange,
  onSelectObject,
  onCopyShareLink,
}: TopCommandBarProps) {
  const locationOptions = OBSERVER_LOCATIONS.some((preset) => preset.id === location.id)
    ? OBSERVER_LOCATIONS
    : [location, ...OBSERVER_LOCATIONS];

  return (
    <header className="top-command-bar" aria-label="Project Zenith command bar">
      <div className="top-brand">
        <div className="brand-mark" aria-hidden="true">Z</div>
        <div>
          <p>Project Zenith</p>
          <span>Cosmic digital twin</span>
        </div>
      </div>

      <div className="top-search" aria-label="Search sky objects">
        <ObjectSearchPanel skyState={skyState} onSelectObject={onSelectObject} />
      </div>

      <div className="top-controls" aria-label="Observer and time controls">
        <label className="top-control-field">
          <span>Location</span>
          <select
            value={location.id}
            onChange={(event) => {
              const nextLocation = locationOptions.find((preset) => preset.id === event.target.value);
              if (nextLocation) onLocationChange(nextLocation);
            }}
            aria-label="Observer location"
          >
            {locationOptions.map((preset) => (
              <option key={preset.id} value={preset.id}>{preset.label}</option>
            ))}
          </select>
        </label>

        <label className="top-control-field top-time-field">
          <span>Time</span>
          <input
            type="datetime-local"
            value={toDateTimeLocalValue(timeIso)}
            onChange={(event) => onTimeChange(fromDateTimeLocalValue(event.target.value))}
            aria-label="Sky time"
          />
        </label>

        <button className="top-now-button" type="button" onClick={() => onTimeChange(new Date().toISOString())}>
          Now
        </button>
      </div>

      <div className="top-status-actions">
        <DemoModeToggle />
        <button className="top-share-button" type="button" onClick={onCopyShareLink}>
          {shareStatus ?? "Share"}
        </button>
      </div>
    </header>
  );
}
