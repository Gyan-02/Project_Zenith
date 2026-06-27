"use client";

import { useEffect, useMemo, useState } from "react";
import { ObservingConditionsCard } from "../components/conditions/ObservingConditionsCard";
import { EventsTimeline } from "../components/events/EventsTimeline";
import { CesiumScene } from "../components/globe/CesiumScene";
import { ObjectDetailsPanel } from "../components/globe/ObjectDetailsPanel";
import { PassPredictionsCard } from "../components/passes/PassPredictionsCard";
import { PanelErrorBoundary } from "../components/errors/PanelErrorBoundary";
import { SnapshotExportButton } from "../components/snapshot/SnapshotExportButton";
import { CrossingNowCard } from "../components/sky-stats/CrossingNowCard";
import { IssLiveVideoCard } from "../components/iss/IssLiveVideoCard";
import { DataProvenanceLegend } from "../components/provenance/DataProvenanceLegend";
import { BottomTray } from "../components/shell/BottomTray";
import { LeftToolRail } from "../components/shell/LeftToolRail";
import { MobileTabBar } from "../components/shell/MobileTabBar";
import { RightDock } from "../components/shell/RightDock";
import { TopCommandBar } from "../components/shell/TopCommandBar";
import { ZenithShell } from "../components/shell/ZenithShell";
import type { ZenithPanel } from "../components/shell/shell.types";
import { useNavigationTarget } from "../hooks/useNavigationTarget";
import { useSkyState } from "../hooks/useSkyState";
import { useDemoMode } from "../hooks/useDemoMode";
import {
  DEFAULT_OBSERVER_LOCATION,
  OBSERVER_LOCATIONS,
  type ObserverLocationPreset,
} from "../lib/locations";
import { buildShareUrl, decodeShareState, type ShareSkyState } from "../lib/share";
import type { SnapshotLayer } from "../lib/snapshot";
import { DEFAULT_LAYER_VISIBILITY, SKY_LAYER_LABELS, type LayerVisibility } from "../lib/skyLayers";
import { getSkyObjects } from "../lib/skyState";
import { shiftIsoTime } from "../lib/timeMachine";

export default function HomePage() {
  const { isDemo } = useDemoMode();
  const [location, setLocation] = useState<ObserverLocationPreset>(DEFAULT_OBSERVER_LOCATION);
  const [selectedObjectId, setSelectedObjectId] = useState<string | undefined>();
  const [timeIso, setTimeIso] = useState<string>();
  const [layers, setLayers] = useState<LayerVisibility>(DEFAULT_LAYER_VISIBILITY);
  const [shareStatus, setShareStatus] = useState<string>();
  const [activePanel, setActivePanel] = useState<ZenithPanel | null>(null);
  const [expandedPanel, setExpandedPanel] = useState<ZenithPanel | null>(null);
  const [isNarratorOpen, setIsNarratorOpen] = useState(false);
  const [isTrayCollapsed, setIsTrayCollapsed] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const navigationTarget = useNavigationTarget();
  const effectiveTimeIso = timeIso ?? "2000-01-01T00:00:00.000Z";
  const next24HoursIso = shiftIsoTime(effectiveTimeIso, 24);
  const next180DaysIso = shiftIsoTime(effectiveTimeIso, 24 * 180);
  const { state: skyState, isLoading, error } = useSkyState(location, effectiveTimeIso, 15_000);

  useEffect(() => {
    setHasMounted(true);
    const shared = decodeShareState(window.location.search);

    if (shared.location) {
      setLocation(locationFromShare(shared.location));
    }
    setTimeIso(shared.timeUtc ?? new Date().toISOString());
    if (shared.selectedObjectId) setSelectedObjectId(shared.selectedObjectId);
    if (shared.layers) setLayers((current) => shareLayersToVisibility(shared.layers!, current));
  }, []);

  useEffect(() => {
    const handleLocationChange = (e: Event) => {
      const customEvent = e as CustomEvent<{
        location: ObserverLocationPreset;
        timeIso?: string;
      }>;
      if (customEvent.detail?.location) {
        setLocation(customEvent.detail.location);
        setSelectedObjectId(undefined);
      }
      if (customEvent.detail?.timeIso) {
        setTimeIso(customEvent.detail.timeIso);
      }
    };
    window.addEventListener("zenith-change-location", handleLocationChange);
    return () => {
      window.removeEventListener("zenith-change-location", handleLocationChange);
    };
  }, []);

  const context = useMemo(
    () => ({
      location: { lat: location.lat, lon: location.lon, label: location.label },
      timeIso: effectiveTimeIso,
      ...(selectedObjectId ? { selectedObjectId } : {}),
    }),
    [effectiveTimeIso, location.label, location.lat, location.lon, selectedObjectId],
  );
  const selectedObject = useMemo(() => {
    if (!skyState || !selectedObjectId) return undefined;
    const object = getSkyObjects(skyState).find((candidate) => candidate.id === selectedObjectId);
    return object ? { id: object.id, name: object.name } : undefined;
  }, [selectedObjectId, skyState]);

  const activePanelMeta = getPanelMeta(activePanel);

  function togglePanel(panel: ZenithPanel) {
    setActivePanel((current) => {
      const next = current === panel ? null : panel;
      if (next !== panel) setExpandedPanel(null);
      return next;
    });
  }

  function closePanel() {
    setActivePanel(null);
    setExpandedPanel(null);
  }

  function toggleExpandedPanel() {
    setExpandedPanel((current) => (current === activePanel ? null : activePanel));
  }

  async function handleCopyShareLink() {
    const baseUrl = new URL(`${window.location.origin}${window.location.pathname}`);
    if (new URLSearchParams(window.location.search).get("demo") === "1") {
      baseUrl.searchParams.set("demo", "1");
    }

    const url = buildShareUrl(baseUrl.toString(), {
      location: { lat: location.lat, lon: location.lon, label: location.label },
      timeUtc: effectiveTimeIso,
      ...(selectedObjectId ? { selectedObjectId } : {}),
      layers: visibilityToShareLayers(layers),
    });

    await navigator.clipboard.writeText(url);
    window.history.replaceState(null, "", url);
    setShareStatus("Copied");
    window.setTimeout(() => setShareStatus(undefined), 1_800);
  }

  const activePanelContent = activePanel ? (
    <PanelErrorBoundary fallback={`${activePanelMeta?.title ?? "This panel"} is unavailable.`}>
      {renderPanelContent({
        activePanel,
        location,
        effectiveTimeIso,
        next24HoursIso,
        next180DaysIso,
        skyState,
        isDemo,
        layers,
        selectedObjectId,
        selectedObject,
        setSelectedObjectId,
        setLayers,
        shareStatus,
        handleCopyShareLink,
      })}
    </PanelErrorBoundary>
  ) : null;

  return (
    <ZenithShell
      activePanel={activePanel}
      expandedPanel={expandedPanel}
      panelTitle={activePanelMeta?.title}
      panelEyebrow={activePanelMeta?.eyebrow}
      panelContent={activePanelContent}
      onClosePanel={closePanel}
      onToggleExpand={toggleExpandedPanel}
      topBar={(
        <TopCommandBar
          location={location}
          timeIso={effectiveTimeIso}
          skyState={skyState}
          shareStatus={shareStatus}
          onLocationChange={(nextLocation) => {
            setLocation(nextLocation);
            setSelectedObjectId(undefined);
          }}
          onTimeChange={(nextTimeIso) => {
            setTimeIso(nextTimeIso);
            setSelectedObjectId(undefined);
          }}
          onSelectObject={(id) => {
            setSelectedObjectId(id);
            setActivePanel(null);
          }}
          onCopyShareLink={handleCopyShareLink}
        />
      )}
      leftRail={(
        <LeftToolRail
          activePanel={activePanel}
          isDemo={isDemo}
          hasSelectedObject={Boolean(selectedObjectId)}
          onToggle={togglePanel}
        />
      )}
      rightDock={(
        <RightDock
          context={context}
          isOpen={isNarratorOpen}
          onOpen={() => setIsNarratorOpen(true)}
          onClose={() => setIsNarratorOpen(false)}
        />
      )}
      bottomTray={(
        <BottomTray
          selectedObject={selectedObject}
          navigationTarget={navigationTarget}
          activePanel={activePanel}
          isCollapsed={isTrayCollapsed}
          onToggleCollapsed={() => setIsTrayCollapsed((current) => !current)}
          onOpenObject={() => setActivePanel("object")}
          onClearObject={() => setSelectedObjectId(undefined)}
        />
      )}
      mobileTabs={(
        <MobileTabBar
          activePanel={activePanel}
          narratorOpen={isNarratorOpen}
          onTogglePanel={togglePanel}
          onToggleNarrator={() => setIsNarratorOpen((current) => !current)}
        />
      )}
    >
      {hasMounted ? (
        <CesiumScene
          skyState={skyState}
          isLoading={isLoading}
          error={error}
          layers={layers}
          selectedObjectId={selectedObjectId}
          onSelectObject={setSelectedObjectId}
        />
      ) : (
        <div className="scene-loading">Calibrating the sky...</div>
      )}
    </ZenithShell>
  );
}

interface PanelRenderProps {
  activePanel: ZenithPanel;
  location: ObserverLocationPreset;
  effectiveTimeIso: string;
  next24HoursIso: string;
  next180DaysIso: string;
  skyState: ReturnType<typeof useSkyState>["state"];
  isDemo: boolean;
  layers: LayerVisibility;
  selectedObjectId?: string;
  selectedObject?: { id: string; name: string };
  shareStatus?: string;
  setSelectedObjectId(id?: string): void;
  setLayers(layers: LayerVisibility): void;
  handleCopyShareLink(): Promise<void>;
}

function renderPanelContent({
  activePanel,
  location,
  effectiveTimeIso,
  next24HoursIso,
  next180DaysIso,
  skyState,
  isDemo,
  layers,
  selectedObjectId,
  selectedObject,
  shareStatus,
  setSelectedObjectId,
  setLayers,
  handleCopyShareLink,
}: PanelRenderProps) {
  switch (activePanel) {
    case "conditions":
      return (
        <div className="workspace-panel-stack">
          <ObservingConditionsCard
            location={{ lat: location.lat, lon: location.lon, label: location.label }}
            timeUtc={effectiveTimeIso}
          />
          <CrossingNowCard skyState={skyState} />
        </div>
      );
    case "events":
      return (
        <EventsTimeline
          location={{ lat: location.lat, lon: location.lon }}
          startUtc={effectiveTimeIso}
          endUtc={next180DaysIso}
          types={["meteor_shower", "eclipse", "visibility_window", "conjunction"]}
        />
      );
    case "passes":
      return (
        <PassPredictionsCard
          location={{ lat: location.lat, lon: location.lon, elevationM: location.elevationM, label: location.label }}
          startUtc={effectiveTimeIso}
          endUtc={next24HoursIso}
          minElevationDeg={15}
        />
      );
    case "iss":
      return (
        <div className="iss-panel-host">
          <p className="panel-intro">Watch ISS live as a deliberate demo moment. Close this panel to stop taking screen space.</p>
          <IssLiveVideoCard isDemo={isDemo} />
        </div>
      );
    case "layers":
      return (
        <div className="workspace-panel-stack">
          <p className="panel-intro">
            Toggle what the globe renders. The globe stays interactive anywhere this drawer does not physically cover it.
          </p>
          <div className="layer-list shell-layer-list" role="group" aria-label="Sky layer visibility">
            {SKY_LAYER_LABELS.map(({ kind, label }) => (
              <label key={kind} className="layer-toggle shell-layer-toggle">
                <input
                  type="checkbox"
                  aria-label={`Toggle ${label} layer`}
                  checked={layers[kind]}
                  onChange={(event) => setLayers({ ...layers, [kind]: event.target.checked })}
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </div>
      );
    case "provenance":
      return <DataProvenanceLegend />;
    case "object":
      return (
        <ObjectDetailsPanel
          skyState={skyState}
          selectedObjectId={selectedObjectId}
          onClear={() => setSelectedObjectId(undefined)}
        />
      );
    case "snapshot":
      return (
        <div className="workspace-panel-stack">
          <SnapshotExportButton
            location={{ lat: location.lat, lon: location.lon, label: location.label }}
            timeUtc={effectiveTimeIso}
            selectedObject={selectedObject}
            layers={visibilityToSnapshotLayers(layers)}
          />
          <button className="share-button" type="button" onClick={() => void handleCopyShareLink()}>
            Copy sky link
          </button>
          {shareStatus ? <span className="share-status" role="status">{shareStatus}</span> : null}
        </div>
      );
    default:
      return null;
  }
}

function getPanelMeta(panel: ZenithPanel | null): { title: string; eyebrow: string } | undefined {
  switch (panel) {
    case "conditions":
      return { title: "Tonight conditions", eyebrow: "Sky status" };
    case "events":
      return { title: "Sky events", eyebrow: "Next 180 days" };
    case "passes":
      return { title: "Satellite passes", eyebrow: "Next 24 hours" };
    case "iss":
      return { title: "ISS live", eyebrow: "Live video" };
    case "layers":
      return { title: "Globe layers", eyebrow: "Visibility" };
    case "object":
      return { title: "Object details", eyebrow: "Selected target" };
    case "snapshot":
      return { title: "Snapshot & share", eyebrow: "Export" };
    case "provenance":
      return { title: "Data sources", eyebrow: "Live / demo / fallback" };
    default:
      return undefined;
  }
}

function locationFromShare(location: NonNullable<ShareSkyState["location"]>): ObserverLocationPreset {
  return OBSERVER_LOCATIONS.find(
    (preset) => Math.abs(preset.lat - location.lat) < 0.01 && Math.abs(preset.lon - location.lon) < 0.01,
  ) ?? {
    id: "shared",
    label: location.label ?? "Shared location",
    lat: location.lat,
    lon: location.lon,
    elevationM: 0,
  };
}

function shareLayersToVisibility(
  shareLayers: NonNullable<ShareSkyState["layers"]>,
  current: LayerVisibility,
): LayerVisibility {
  return {
    ...current,
    ...(shareLayers.planets !== undefined ? { planet: shareLayers.planets } : {}),
    ...(shareLayers.satellites !== undefined ? { satellite: shareLayers.satellites } : {}),
    ...(shareLayers.iss !== undefined ? { iss: shareLayers.iss } : {}),
    ...(shareLayers.constellations !== undefined ? { constellation: shareLayers.constellations } : {}),
    ...(shareLayers.meteorShowers !== undefined ? { meteor_shower: shareLayers.meteorShowers } : {}),
  };
}

function visibilityToShareLayers(layers: LayerVisibility): ShareSkyState["layers"] {
  return {
    planets: layers.planet,
    satellites: layers.satellite,
    iss: layers.iss,
    constellations: layers.constellation,
    meteorShowers: layers.meteor_shower,
  };
}

function visibilityToSnapshotLayers(layers: LayerVisibility): SnapshotLayer[] {
  const visible: SnapshotLayer[] = [];
  if (layers.planet) visible.push("planets");
  if (layers.satellite) visible.push("satellites");
  if (layers.iss) visible.push("iss");
  if (layers.moon) visible.push("moon");
  if (layers.constellation) visible.push("constellations");
  if (layers.meteor_shower) visible.push("meteor_showers");
  return visible;
}
