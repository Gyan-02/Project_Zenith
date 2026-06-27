"use client";

import { useEffect, useState } from "react";
import { navigationBus } from "../lib/navigationBus";
import type { NavigationTarget } from "../lib/narration";

export function useNavigationTarget(): NavigationTarget | null {
  const [target, setTarget] = useState<NavigationTarget | null>(() => navigationBus.current());

  useEffect(() => navigationBus.subscribe(setTarget), []);
  return target;
}
