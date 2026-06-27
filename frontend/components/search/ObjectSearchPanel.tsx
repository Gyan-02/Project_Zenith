"use client";

/**
 * GYA-40 — ObjectSearchPanel
 *
 * Lets the user search sky objects (planets, satellites, ISS, moon, stars,
 * meteor showers) by name and jump the globe to the selected object.
 *
 * Props:
 *   skyState        — current sky state (from useSkyState). When null/undefined
 *                     the input is disabled.
 *   onSelectObject  — called with the object id when the user picks a result.
 *                     Also publishes to navigationBus.
 *   placeholder     — optional input placeholder text
 *   className       — appended to root wrapper
 *
 * Keyboard:
 *   ArrowDown / ArrowUp  — move through results
 *   Enter                — select focused result
 *   Escape               — clear query and close results
 *
 * Accessibility:
 *   role="combobox" on input, role="listbox" on results,
 *   role="option" per row, aria-activedescendant tracks active row id.
 */

import React, { useCallback, useId, useMemo, useRef, useState } from "react";
import { getSkyObjects, type SkyObject, type SkyObjectKind, type SkyState } from "../../lib/skyState";
import { navigationBus } from "../../lib/navigationBus";
import "./search.css";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ObjectSearchPanelProps {
  skyState: SkyState | null | undefined;
  onSelectObject: (id: string) => void;
  placeholder?: string;
  className?: string;
}

// ---------------------------------------------------------------------------
// Kind → human-readable label
// ---------------------------------------------------------------------------

const KIND_LABEL: Record<SkyObjectKind, string> = {
  planet: "Planet",
  satellite: "Satellite",
  iss: "ISS",
  moon: "Moon",
  star: "Star",
  constellation: "Constellation",
  meteor_shower: "Shower",
};

// ---------------------------------------------------------------------------
// Filter helper
// ---------------------------------------------------------------------------

function filterObjects(objects: SkyObject[], query: string): SkyObject[] {
  if (!query.trim()) return [];
  const lower = query.toLowerCase();
  return objects
    .filter((o) => o.name.toLowerCase().includes(lower) && o.metadata?.searchable !== false)
    .slice(0, 12);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ObjectSearchPanel({
  skyState,
  onSelectObject,
  placeholder = "Search objects… (Saturn, ISS, Vega…)",
  className = "",
}: ObjectSearchPanelProps) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();
  const optionIdPrefix = useId();

  const allObjects = useMemo(
    () => (skyState ? getSkyObjects(skyState) : []),
    [skyState],
  );

  const results = useMemo(
    () => filterObjects(allObjects, query),
    [allObjects, query],
  );

  const isOpen = query.trim().length > 0;

  // Reset active index whenever results change
  const handleQueryChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setActiveIndex(-1);
  }, []);

  const selectObject = useCallback(
    (obj: SkyObject) => {
      // Publish to the navigation bus (picked up by CesiumScene)
      navigationBus.publish({
        kind: obj.kind === "meteor_shower" ? "planet" : (obj.kind as "planet" | "satellite" | "star" | "constellation" | "moon" | "iss"),
        id: obj.id,
        label: obj.name,
      });
      onSelectObject(obj.id);
      setQuery("");
      setActiveIndex(-1);
      inputRef.current?.blur();
    },
    [onSelectObject],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!isOpen) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, results.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const target = results[activeIndex] ?? results[0];
        if (target) selectObject(target);
      } else if (e.key === "Escape") {
        e.preventDefault();
        setQuery("");
        setActiveIndex(-1);
      }
    },
    [isOpen, results, activeIndex, selectObject],
  );

  const activeOptionId =
    activeIndex >= 0 ? `${optionIdPrefix}-option-${activeIndex}` : undefined;

  return (
    <div className={`zp-search-panel ${className}`}>
      {/* Combobox input */}
      <div className="zp-search-input-wrap">
        <span className="zp-search-icon" aria-hidden="true">⌕</span>
        <input
          ref={inputRef}
          id="object-search-input"
          className="zp-search-input"
          type="search"
          autoComplete="off"
          spellCheck={false}
          role="combobox"
          aria-label="Search sky objects"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-activedescendant={activeOptionId}
          aria-haspopup="listbox"
          placeholder={placeholder}
          value={query}
          disabled={!skyState}
          onChange={handleQueryChange}
          onKeyDown={handleKeyDown}
        />
        {query && (
          <button
            type="button"
            className="zp-search-clear"
            aria-label="Clear search"
            tabIndex={-1}
            onClick={() => {
              setQuery("");
              setActiveIndex(-1);
              inputRef.current?.focus();
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Results dropdown */}
      {isOpen && (
        <ul
          id={listboxId}
          className="zp-search-results"
          role="listbox"
          aria-label="Sky object results"
        >
          {results.length === 0 ? (
            <li className="zp-search-empty" role="option" aria-selected={false}>
              No objects match &ldquo;{query}&rdquo;
            </li>
          ) : (
            results.map((obj, idx) => (
              <li
                key={obj.id}
                id={`${optionIdPrefix}-option-${idx}`}
                role="option"
                aria-selected={idx === activeIndex}
                className="zp-search-option"
                onClick={() => selectObject(obj)}
                onMouseEnter={() => setActiveIndex(idx)}
              >
                <span className="zp-search-option-name">{obj.name}</span>
                <span
                  className={`zp-search-kind-badge zp-search-kind--${obj.kind}`}
                >
                  {KIND_LABEL[obj.kind]}
                </span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
