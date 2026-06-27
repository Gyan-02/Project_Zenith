"use client";

/**
 * GYA-39 — useDemoMode hook
 *
 * React wrapper around the pure `demoMode` module. Provides reactive state
 * so components re-render when demo mode is toggled.
 *
 * Usage:
 *   const { isDemo, enable, disable, toggle } = useDemoMode();
 *
 * Notes:
 *   - On mount, the hook syncs from localStorage/URL param via `isDemoActive()`.
 *   - `toggle()` returns the new boolean state.
 *   - `enable()` / `disable()` also persist to localStorage.
 */

import { useCallback, useEffect, useState } from "react";
import {
  disableDemo,
  enableDemo,
  isDemoActive,
  toggleDemo,
} from "../lib/demoMode";

export interface UseDemoModeResult {
  /** True when demo mode is currently active */
  isDemo: boolean;
  /** Activate demo mode and persist to localStorage */
  enable: () => void;
  /** Deactivate demo mode and remove from localStorage */
  disable: () => void;
  /** Toggle demo mode and return the new state */
  toggle: () => boolean;
}

export function useDemoMode(): UseDemoModeResult {
  // Keep the server render and first client render identical, then sync the
  // browser-only URL/localStorage/env state after hydration.
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    setIsDemo(isDemoActive());
  }, []);

  const enable = useCallback(() => {
    enableDemo();
    setIsDemo(true);
  }, []);

  const disable = useCallback(() => {
    disableDemo();
    setIsDemo(false);
  }, []);

  const toggle = useCallback((): boolean => {
    const next = toggleDemo();
    setIsDemo(next);
    return next;
  }, []);

  return { isDemo, enable, disable, toggle };
}
