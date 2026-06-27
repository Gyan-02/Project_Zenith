/**
 * GYA-29 – PassPredictionsCard component.
 *
 * Wiring note (for GYA-36):
 *   import { PassPredictionsCard } from "@/components/passes/PassPredictionsCard";
 *   <PassPredictionsCard location={observerLocation} startUtc={start} endUtc={end} />
 */

import React from "react";
import { usePassPredictions } from "../../hooks/usePassPredictions";
import type { PassPrediction } from "../../lib/passes";

export interface PassPredictionsCardProps {
  location?: { lat: number; lon: number; elevationM?: number; label?: string };
  startUtc?: string;
  endUtc?: string;
  minElevationDeg?: number;
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
      timeZoneName: "short",
    });
  } catch {
    return iso;
  }
}

function PassRow({ pass }: { pass: PassPrediction }) {
  return (
    <div
      data-testid={`pass-${pass.objectId}`}
      style={{ marginBottom: "0.75rem", borderLeft: "3px solid #38bdf8", paddingLeft: "0.75rem" }}
    >
      <div style={{ fontWeight: "bold" }} data-testid="pass-name">
        {pass.name ?? pass.objectId}
      </div>
      <div style={{ fontSize: "0.85rem" }}>
        <span data-testid="pass-rise">Rise: {formatTime(pass.riseTimeUtc)}</span>
        {" · "}
        <span data-testid="pass-peak">Peak: {formatTime(pass.peakTimeUtc)}</span>
        {" · "}
        <span data-testid="pass-set">Set: {formatTime(pass.setTimeUtc)}</span>
      </div>
      <div style={{ fontSize: "0.8rem", opacity: 0.75 }}>
        Max elevation: <span data-testid="pass-elevation">{pass.maxElevationDeg.toFixed(1)}°</span>
        {pass.riseDirection && ` · ${pass.riseDirection} → ${pass.setDirection ?? "?"}`}
      </div>
    </div>
  );
}

export function PassPredictionsCard({
  location,
  startUtc,
  endUtc,
  minElevationDeg,
}: PassPredictionsCardProps) {
  const { passes, demo, isLoading, error } = usePassPredictions(
    location,
    startUtc,
    endUtc,
    minElevationDeg,
  );

  if (!location || !startUtc || !endUtc) {
    return (
      <div data-testid="passes-empty">
        Select a location and time window to see upcoming satellite passes.
      </div>
    );
  }

  if (isLoading) return <div data-testid="passes-loading">Loading pass predictions…</div>;

  if (error) {
    return (
      <div data-testid="passes-unavailable">
        Pass predictions are temporarily unavailable: {error}
      </div>
    );
  }

  if (passes.length === 0) {
    return (
      <div data-testid="passes-empty">
        {demo && (
          <div style={{ marginBottom: "8px" }}>
            <span
              data-testid="demo-fixture-label"
              style={{
                fontSize: "9px",
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "#fbbf24",
                border: "1px solid rgba(251,191,36,0.35)",
                borderRadius: "4px",
                padding: "1px 5px",
                opacity: 0.85,
              }}
            >
              Demo fixture
            </span>
          </div>
        )}
        No satellite passes found for this window.
      </div>
    );
  }

  return (
    <div data-testid="passes-card">
      {demo && (
        <div style={{ marginBottom: "8px" }}>
          <span
            data-testid="demo-fixture-label"
            style={{
              fontSize: "9px",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "#fbbf24",
              border: "1px solid rgba(251,191,36,0.35)",
              borderRadius: "4px",
              padding: "1px 5px",
              opacity: 0.85,
            }}
          >
            Demo fixture
          </span>
        </div>
      )}
      {passes.map((pass) => (
        <PassRow key={`${pass.objectId}-${pass.riseTimeUtc}`} pass={pass} />
      ))}
    </div>
  );
}
