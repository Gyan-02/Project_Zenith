"use client";

import type { Viewer as CesiumViewer } from "cesium";
import { useEffect, useRef, useState } from "react";
import { useNavigationTarget } from "../../hooks/useNavigationTarget";
import type { LayerVisibility } from "../../lib/skyLayers";
import type { SkyState, SkyObjectKind } from "../../lib/skyState";
import { highlightSelected } from "./selection-style";
import { SkyStateRenderer } from "./sky-state-renderer";

declare global {
  interface Window {
    Cesium?: typeof import("cesium");
    CESIUM_BASE_URL?: string;
  }
}

interface CesiumSceneProps {
  skyState: SkyState | null;
  isLoading: boolean;
  error: string | null;
  layers: LayerVisibility;
  selectedObjectId?: string;
  onSelectObject(id: string | undefined): void;
}

export function CesiumScene({ skyState, isLoading, error, layers, selectedObjectId, onSelectObject }: CesiumSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<CesiumViewer | undefined>(undefined);
  const rendererRef = useRef<SkyStateRenderer | undefined>(undefined);
  const previousSelectedIdRef = useRef<string | undefined>(undefined);
  const hasFramedSkyRef = useRef(false);
  const [isLibraryReady, setIsLibraryReady] = useState(false);
  const navigationTarget = useNavigationTarget();

  useEffect(() => {
    window.CESIUM_BASE_URL = "/cesium/";
    if (window.Cesium) {
      setIsLibraryReady(true);
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>("script[data-zenith-cesium]");
    const script = existingScript ?? document.createElement("script");
    const handleLoad = () => setIsLibraryReady(true);
    script.addEventListener("load", handleLoad);

    if (!existingScript) {
      script.src = "/cesium/Cesium.js";
      script.async = true;
      script.dataset.zenithCesium = "true";
      document.head.appendChild(script);
    }

    return () => script.removeEventListener("load", handleLoad);
  }, []);

  useEffect(() => {
    const Cesium = window.Cesium;
    const container = containerRef.current;
    if (!isLibraryReady || !Cesium || !container || viewerRef.current) return;

    if (process.env.NEXT_PUBLIC_CESIUM_ION_TOKEN) {
      Cesium.Ion.defaultAccessToken = process.env.NEXT_PUBLIC_CESIUM_ION_TOKEN;
    }

    const viewer = new Cesium.Viewer(container, {
      animation: false,
      timeline: false,
      baseLayer: false,
      baseLayerPicker: false,
      geocoder: false,
      homeButton: false,
      sceneModePicker: false,
      navigationHelpButton: false,
      selectionIndicator: false,
      infoBox: false,
    });

    // Presentation mode: Zenith is a sky digital twin, not an Earth viewer.
    // On deployed Cesium builds the default globe/atmosphere can dominate the
    // screen as a giant dark/red sphere. Hide the physical globe surface and
    // keep our computed sky objects, paths, and labels as the visual focus.
    viewer.scene.backgroundColor = Cesium.Color.fromCssColorString("#02040b");
    if (viewer.scene.globe) {
      viewer.scene.globe.show = false;
      viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString("#02040b");
    }
    if (viewer.scene.skyAtmosphere) viewer.scene.skyAtmosphere.show = false;
    if (viewer.scene.fog) viewer.scene.fog.enabled = false;
    if (viewer.scene.sun) viewer.scene.sun.show = false;
    if (viewer.scene.moon) viewer.scene.moon.show = false;

    viewerRef.current = viewer;
    const renderer = new SkyStateRenderer(viewer, Cesium);
    rendererRef.current = renderer;
    const removePickListener = renderer.onEntityPick(({ id }) => onSelectObject(id));

    return () => {
      removePickListener();
      renderer.destroy();
      rendererRef.current = undefined;
      viewerRef.current = undefined;
      if (!viewer.isDestroyed()) viewer.destroy();
    };
  }, [isLibraryReady, onSelectObject]);

  useEffect(() => {
    if (skyState && rendererRef.current) {
      rendererRef.current.updateSkyState(skyState);
      if (!hasFramedSkyRef.current && viewerRef.current) {
        hasFramedSkyRef.current = true;
        void viewerRef.current.zoomTo(viewerRef.current.entities);
      }
    }
  }, [skyState, isLibraryReady]);

  useEffect(() => {
    const renderer = rendererRef.current;
    const Cesium = window.Cesium;
    if (!renderer || !Cesium) return;

    highlightSelected(renderer, selectedObjectId, previousSelectedIdRef.current, Cesium);
    previousSelectedIdRef.current = selectedObjectId;
  }, [selectedObjectId, skyState, isLibraryReady]);

  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer) return;
    for (const [kind, visible] of Object.entries(layers)) {
      renderer.setLayerVisible(kind as SkyObjectKind, visible);
    }
  }, [layers, isLibraryReady]);

  useEffect(() => {
    const viewer = viewerRef.current;
    const renderer = rendererRef.current;
    if (!viewer || !renderer || !navigationTarget) return;
    const entity = renderer.getEntity(navigationTarget.id);
    if (!entity) return;

    onSelectObject(navigationTarget.id);
    void viewer.flyTo(entity, { duration: 1.2 });
  }, [navigationTarget, onSelectObject]);

  return (
    <div className="cesium-viewer-shell" ref={containerRef}>
      {!isLibraryReady || isLoading ? <div className="scene-loading">Calibrating the sky...</div> : null}
      {error ? <div className="scene-error" role="alert">{error}</div> : null}
    </div>
  );
}
