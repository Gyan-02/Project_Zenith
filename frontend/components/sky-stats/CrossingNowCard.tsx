import React, { useEffect, useMemo, useState } from "react";
import { computeCrossingStats } from "../../lib/skyStats";
import type { SkyState } from "../../lib/skyState";
import "./crossing-now.css";

interface CrossingNowCardProps {
  skyState: SkyState | null | undefined;
}

export function CrossingNowCard({ skyState }: CrossingNowCardProps) {
  const [tick, setTick] = useState(0);

  // Set up 30-second interval to refresh counts if in live/now mode
  useEffect(() => {
    if (!skyState) return;
    
    // Determine if skyState timestamp is close to current system time (live/now mode)
    const isLive = Math.abs(new Date(skyState.timestampUtc).getTime() - Date.now()) < 120_000;
    if (!isLive) return;

    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 30_000);

    return () => clearInterval(interval);
  }, [skyState]);

  const stats = useMemo(() => {
    if (!skyState) return null;
    return computeCrossingStats(skyState);
  }, [skyState, tick]);

  if (!skyState || !stats) {
    return (
      <div className="crossing-card-loading" data-testid="crossing-card-loading">
        <span className="crossing-loading-pulse" />
        <span>Calibrating...</span>
      </div>
    );
  }

  return (
    <div className="crossing-card" data-testid="crossing-card">
      <div className="crossing-total-section">
        <span className="crossing-total-num" data-testid="crossing-total">
          {stats.total}
        </span>
        <div className="crossing-total-label-wrap">
          <span className="crossing-total-label">Objects above horizon</span>
          <span className="crossing-tooltip-trigger" title="Based on the currently loaded Zenith tracking subset.">
            ⓘ
          </span>
        </div>
      </div>

      <div className="crossing-breakdown-grid">
        <div className="crossing-breakdown-item" data-testid="crossing-satellites">
          <span className="crossing-item-count">{stats.satellites}</span>
          <span className="crossing-item-name">Satellites</span>
        </div>
        <div className="crossing-breakdown-item" data-testid="crossing-iss">
          <span className="crossing-item-count">{stats.iss}</span>
          <span className="crossing-item-name">ISS</span>
        </div>
        <div className="crossing-breakdown-item" data-testid="crossing-planets">
          <span className="crossing-item-count">{stats.planets}</span>
          <span className="crossing-item-name">Planets</span>
        </div>
        <div className="crossing-breakdown-item" data-testid="crossing-stars">
          <span className="crossing-item-count">{stats.brightStars}</span>
          <span className="crossing-item-name">Stars</span>
        </div>
      </div>
    </div>
  );
}
