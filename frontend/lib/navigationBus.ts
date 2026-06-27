import type { NavigationTarget } from "./narration";

export type NavigationListener = (target: NavigationTarget | null) => void;

export interface NavigationBus {
  publish(target: NavigationTarget): void;
  clear(): void;
  current(): NavigationTarget | null;
  subscribe(listener: NavigationListener): () => void;
}

export function createNavigationBus(): NavigationBus {
  const listeners = new Set<NavigationListener>();
  let activeTarget: NavigationTarget | null = null;

  function emit(target: NavigationTarget | null) {
    activeTarget = target;
    for (const listener of listeners) listener(target);
  }

  return {
    publish: emit,
    clear: () => emit(null),
    current: () => activeTarget,
    subscribe(listener) {
      listeners.add(listener);
      listener(activeTarget);
      return () => listeners.delete(listener);
    },
  };
}

export const navigationBus = createNavigationBus();
