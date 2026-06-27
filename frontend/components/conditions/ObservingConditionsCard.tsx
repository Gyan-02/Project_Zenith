/**
 * GYA-27 – ObservingConditionsCard component.
 *
 * Wiring note (for GYA-36):
 *   import { ObservingConditionsCard } from
 *     "@/components/conditions/ObservingConditionsCard";
 *   <ObservingConditionsCard location={observerLocation} />
 */

import React from "react";
import { useObservingConditions } from "../../hooks/useObservingConditions";
import type { ObservingConditionsResponse, ObservingQuality } from "../../lib/conditions";

export interface ObservingConditionsCardProps {
  location?: { lat: number; lon: number; label?: string };
  timeUtc?: string;
}

// Quality badge color
function qualityColor(q: ObservingQuality): string {
  switch (q) {
    case "Excellent": return "#22c55e";
    case "Good":      return "#facc15";
    case "Poor":      return "#f97316";
    default:          return "#94a3b8";
  }
}

function ConditionsData({ data }: { data: ObservingConditionsResponse }) {
  return (
    <div data-testid="conditions-card">
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
        <div
          data-testid="conditions-quality"
          style={{ color: qualityColor(data.quality), fontWeight: "bold", fontSize: "1.1rem" }}
        >
          {data.quality}
        </div>
        {data.demo && (
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
        )}
      </div>
      <p data-testid="conditions-summary">{data.summary}</p>
      {data.unavailable && (
        <p data-testid="conditions-unavailable" style={{ opacity: 0.7 }}>
          Weather data is currently unavailable.
        </p>
      )}
      {!data.unavailable && (
        <dl data-testid="conditions-details">
          {data.cloudCoverPct !== null && (
            <><dt>Cloud cover</dt><dd data-testid="conditions-cloud">{data.cloudCoverPct}%</dd></>
          )}
          {data.visibilityMeters !== null && (
            <><dt>Visibility</dt><dd data-testid="conditions-visibility">{(data.visibilityMeters / 1000).toFixed(1)} km</dd></>
          )}
          {data.humidityPct !== null && (
            <><dt>Humidity</dt><dd>{data.humidityPct}%</dd></>
          )}
          {data.temperatureC !== null && (
            <><dt>Temperature</dt><dd>{data.temperatureC.toFixed(1)} °C</dd></>
          )}
          {data.windSpeedMps !== null && (
            <><dt>Wind</dt><dd>{data.windSpeedMps.toFixed(1)} m/s</dd></>
          )}
        </dl>
      )}
    </div>
  );
}


export function ObservingConditionsCard({ location, timeUtc }: ObservingConditionsCardProps) {
  const { conditions, isLoading, error } = useObservingConditions(location, timeUtc);

  if (!location) {
    return (
      <div data-testid="conditions-empty">
        Select a location to see observing conditions.
      </div>
    );
  }

  if (isLoading) {
    return <div data-testid="conditions-loading">Loading conditions…</div>;
  }

  if (error) {
    return <div data-testid="conditions-error">Could not load conditions: {error}</div>;
  }

  if (!conditions) {
    return <div data-testid="conditions-empty">No conditions data available.</div>;
  }

  return <ConditionsData data={conditions} />;
}
