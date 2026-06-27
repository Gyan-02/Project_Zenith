"use client";

const LEGEND_ITEMS = [
  { label: "Live provider", variant: "live", description: "Fetched or computed from an upstream sky data provider." },
  { label: "Demo fixture", variant: "demo", description: "Offline demo data for reliable presentations." },
  { label: "Static catalog", variant: "static", description: "Real catalog values bundled with Zenith." },
  { label: "Fallback/cache", variant: "fallback", description: "Provider fallback or cached data when live data is degraded." },
] as const;

export function DataProvenanceLegend() {
  return (
    <div className="data-legend" aria-label="Data source legend">
      <p className="eyebrow">Data legend</p>
      <div className="data-legend-list">
        {LEGEND_ITEMS.map((item) => (
          <div key={item.label} className="data-legend-item">
            <span className={`provenance-pill provenance-pill-${item.variant}`}>{item.label}</span>
            <small>{item.description}</small>
          </div>
        ))}
      </div>
    </div>
  );
}
